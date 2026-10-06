import crypto from "node:crypto";
import TiqueteraEntity from "../entity/tiquetera.entity.js";
import ClienteEntity from "../../cliente/entity/cliente.entity.js";
import ConsumoEntity from "../../consumo/entity/consumo.entity.js";

export class TiqueteraService {
  /**
   * HU-R3: Creación de tiquetera
   * RF-04: Creación de tiquetera con código de activación de 6 dígitos y 48h de expiración.
   */
  createTiquetera({ cliente_id, total_almuerzos, restaurante_id = null }) {
    if (!cliente_id && cliente_id !== 0) {
      throw new Error("El id del cliente es obligatorio");
    }

    const almuerzos = Number(total_almuerzos);
    if (!Number.isInteger(almuerzos) || almuerzos <= 0) {
      throw new Error("El total de almuerzos debe ser un número entero mayor a 0");
    }

    // Generar código aleatorio de 6 dígitos (100000 - 999999)
    const codigoActivacion = crypto.randomInt(100000, 1000000).toString();
    const ahora = Date.now();
    const duracion48HorasMs = 48 * 60 * 60 * 1000;
    const fechaExpiracionCodigo = new Date(ahora + duracion48HorasMs).toISOString();

    const nuevaTiquetera = {
      cliente_id,
      restaurante_id,
      total_almuerzos: almuerzos,
      almuerzos_consumidos: 0,
      almuerzos_disponibles: almuerzos,
      estado: "PENDIENTE", // PENDIENTE | ACTIVA | FINALIZADA
      codigo_activacion: codigoActivacion,
      fecha_expiracion_codigo: fechaExpiracionCodigo,
      codigo_usado: false,
      qr_token: null,
      pin_hash: null,
      intentos_fallidos_pin: 0,
      bloqueado_hasta: null,
      fecha_activacion: null,
      fecha_finalizacion: null,
    };

    return TiqueteraEntity.createOne(nuevaTiquetera);
  }

  /**
   * RF-04: Reemisión de código de activación si vence sin haberse activado.
   */
  reemitirCodigoActivacion(id) {
    const tiquetera = TiqueteraEntity.findById(id);
    if (!tiquetera) {
      throw new Error("Tiquetera no encontrada");
    }

    if (tiquetera.estado !== "PENDIENTE") {
      throw new Error(
        `No se puede reemitir el código para una tiquetera en estado ${tiquetera.estado}`
      );
    }

    const nuevoCodigo = crypto.randomInt(100000, 1000000).toString();
    const duracion48HorasMs = 48 * 60 * 60 * 1000;
    const nuevaFechaExpiracion = new Date(Date.now() + duracion48HorasMs).toISOString();

    return TiqueteraEntity.updateOne(id, {
      codigo_activacion: nuevoCodigo,
      fecha_expiracion_codigo: nuevaFechaExpiracion,
      codigo_usado: false,
    });
  }

  /**
   * RF-05, RF-06, RF-07 / HU-C1, HU-C2: Activación de tiquetera desde el cliente
   * Valida código de activación, establece PIN de 6 dígitos hasheado,
   * genera QR token único inmutable y pasa a estado ACTIVA.
   */
  activarTiquetera({ codigo_activacion, pin }) {
    if (!codigo_activacion) {
      throw new Error("El código de activación es obligatorio");
    }

    if (!pin || !/^\d{6}$/.test(String(pin).trim())) {
      throw new Error("El PIN debe tener exactamente 6 dígitos numéricos");
    }

    const codigo = String(codigo_activacion).trim();
    const tiquetera = TiqueteraEntity.findByActivationCode(codigo);

    if (!tiquetera) {
      throw new Error("Código de activación inválido");
    }

    if (tiquetera.estado !== "PENDIENTE" || tiquetera.codigo_usado) {
      throw new Error("Este código de activación ya ha sido utilizado");
    }

    const ahora = new Date();
    if (ahora > new Date(tiquetera.fecha_expiracion_codigo)) {
      throw new Error(
        "El código de activación ha expirado. Solicite la reemisión al restaurante"
      );
    }

    // Hashear PIN irreversiblemente usando SHA-256
    const pinHash = crypto.createHash("sha256").update(String(pin).trim()).digest("hex");
    // Generar identificador qr_token único e inmutable
    const qrToken = crypto.randomUUID();

    return TiqueteraEntity.updateOne(tiquetera.id, {
      estado: "ACTIVA",
      codigo_usado: true,
      qr_token: qrToken,
      pin_hash: pinHash,
      intentos_fallidos_pin: 0,
      bloqueado_hasta: null,
      fecha_activacion: ahora.toISOString(),
    });
  }

  getTiqueteraById(id) {
    const tiquetera = TiqueteraEntity.findById(id);
    if (!tiquetera) {
      throw new Error("Tiquetera no encontrada");
    }
    const cliente = ClienteEntity.findById(tiquetera.cliente_id);
    return {
      ...tiquetera,
      cliente_nombre: cliente ? cliente.nombre : null,
      cliente: cliente || null,
    };
  }

  /**
   * HU-R12: Entrega del código de activación
   */
  getCodigoActivacion(id) {
    const tiquetera = TiqueteraEntity.findById(id);

    if (!tiquetera) {
      throw new Error("Tiquetera no encontrada");
    }

    if (tiquetera.estado !== "PENDIENTE") {
      throw new Error(
        `No se puede obtener el código de activación de una tiquetera en estado ${tiquetera.estado}`
      );
    }

    return {
      tiquetera_id: tiquetera.id,
      estado: tiquetera.estado,
      codigo_activacion: tiquetera.codigo_activacion,
      fecha_expiracion_codigo: tiquetera.fecha_expiracion_codigo,
    };
  }

  /**
   * HU-R5: Apertura de tiquetera por QR
   * Escanear o ingresar token de QR para abrir vista del cliente
   */
  getTiqueteraByQr(qrToken) {
    if (!qrToken || !String(qrToken).trim()) {
      const error = new Error("El qr_token es obligatorio");
      error.status = 400;
      throw error;
    }

    const tiquetera = TiqueteraEntity.findByQrToken(String(qrToken).trim());
    if (!tiquetera) {
      const error = new Error("Tiquetera no encontrada para el QR proporcionado");
      error.status = 404;
      throw error;
    }

    const cliente = ClienteEntity.findById(tiquetera.cliente_id);
    return {
      ...tiquetera,
      cliente_nombre: cliente ? cliente.nombre : null,
      cliente: cliente || null,
    };
  }

  /**
   * HU-R6: Validación de PIN del cliente antes de mostrar la tiquetera y autorizar operaciones
   */
  validarPin({ tiquetera_id, qr_token, pin }) {
    let tiquetera = null;
    if (tiquetera_id) {
      tiquetera = TiqueteraEntity.findById(tiquetera_id);
    } else if (qr_token) {
      tiquetera = TiqueteraEntity.findByQrToken(String(qr_token).trim());
    } else {
      const error = new Error("Se requiere el id o el qr_token de la tiquetera");
      error.status = 400;
      throw error;
    }

    if (!tiquetera) {
      const error = new Error("Tiquetera no encontrada");
      error.status = 404;
      throw error;
    }

    if (tiquetera.estado !== "ACTIVA") {
      const error = new Error(
        `Operación rechazada: la tiquetera no está ACTIVA (estado actual: ${tiquetera.estado})`
      );
      error.status = 400;
      throw error;
    }

    if (!pin || !/^\d{6}$/.test(String(pin).trim())) {
      const error = new Error("El PIN debe tener exactamente 6 dígitos numéricos");
      error.status = 400;
      throw error;
    }

    const ahora = Date.now();
    if (tiquetera.bloqueado_hasta && ahora < new Date(tiquetera.bloqueado_hasta).getTime()) {
      const minutosRestantes = Math.ceil(
        (new Date(tiquetera.bloqueado_hasta).getTime() - ahora) / (60 * 1000)
      );
      const error = new Error(
        `Tiquetera bloqueada temporalmente por intentos fallidos de PIN. Intente de nuevo en ${minutosRestantes} minuto(s)`
      );
      error.status = 403;
      throw error;
    }

    const pinHashIngresado = crypto
      .createHash("sha256")
      .update(String(pin).trim())
      .digest("hex");

    if (pinHashIngresado !== tiquetera.pin_hash) {
      const nuevosIntentos = (tiquetera.intentos_fallidos_pin || 0) + 1;
      let nuevoBloqueo = null;
      if (nuevosIntentos >= 3) {
        nuevoBloqueo = new Date(ahora + 15 * 60 * 1000).toISOString();
      }

      TiqueteraEntity.updateOne(tiquetera.id, {
        intentos_fallidos_pin: nuevosIntentos,
        bloqueado_hasta: nuevoBloqueo,
      });

      const mensaje =
        nuevosIntentos >= 3
          ? "PIN incorrecto. Se alcanzó el límite de 3 intentos y la tiquetera fue bloqueada temporalmente por 15 minutos."
          : `PIN incorrecto. Intento ${nuevosIntentos} de 3.`;

      const error = new Error(mensaje);
      error.status = 401;
      throw error;
    }

    // PIN correcto -> resetear intentos
    if (tiquetera.intentos_fallidos_pin > 0 || tiquetera.bloqueado_hasta) {
      tiquetera = TiqueteraEntity.updateOne(tiquetera.id, {
        intentos_fallidos_pin: 0,
        bloqueado_hasta: null,
      });
    }

    const cliente = ClienteEntity.findById(tiquetera.cliente_id);
    return {
      autorizado: true,
      mensaje: "PIN validado exitosamente",
      tiquetera_id: tiquetera.id,
      qr_token: tiquetera.qr_token,
      cliente: cliente
        ? {
            nombre: cliente.nombre,
            identificacion: cliente.identificacion,
            telefono: cliente.telefono,
          }
        : null,
      saldo: {
        total: tiquetera.total_almuerzos,
        consumidos: tiquetera.almuerzos_consumidos,
        disponibles: tiquetera.almuerzos_disponibles,
      },
    };
  }

  /**
   * HU-C3: Regeneración de PIN
   * RF-06: Permite al cliente regenerar su PIN de 6 dígitos en cualquier momento usando su QR
   */
  regenerarPin({ qr_token, nuevo_pin }) {
    if (!qr_token || !String(qr_token).trim()) {
      const error = new Error("El qr_token es obligatorio");
      error.status = 400;
      throw error;
    }

    if (!nuevo_pin || !/^\d{6}$/.test(String(nuevo_pin).trim())) {
      const error = new Error("El nuevo PIN debe tener exactamente 6 dígitos numéricos");
      error.status = 400;
      throw error;
    }

    const tiquetera = TiqueteraEntity.findByQrToken(String(qr_token).trim());
    if (!tiquetera) {
      const error = new Error("Tiquetera no encontrada");
      error.status = 404;
      throw error;
    }

    if (tiquetera.estado !== "ACTIVA") {
      const error = new Error(
        `Solo se puede regenerar el PIN de una tiquetera en estado ACTIVA (estado actual: ${tiquetera.estado})`
      );
      error.status = 400;
      throw error;
    }

    const pinHash = crypto.createHash("sha256").update(String(nuevo_pin).trim()).digest("hex");

    const tiqueteraActualizada = TiqueteraEntity.updateOne(tiquetera.id, {
      pin_hash: pinHash,
      intentos_fallidos_pin: 0,
      bloqueado_hasta: null,
      fecha_regeneracion_pin: new Date().toISOString(),
    });

    return {
      mensaje: "PIN regenerado exitosamente",
      tiquetera_id: tiqueteraActualizada.id,
      qr_token: tiqueteraActualizada.qr_token,
    };
  }

  /**
   * HU-C4 & HU-C5: Consulta pública de saldo e historial del cliente (solo lectura sin cuenta)
   * RF-08, RF-16, RNF-07: nombre, estado, saldos y movimientos agrupados por día sin datos sensibles
   */
  getVistaPublicaCliente(qrToken) {
    if (!qrToken || !String(qrToken).trim()) {
      const error = new Error("El qr_token es obligatorio");
      error.status = 400;
      throw error;
    }

    const tiquetera = TiqueteraEntity.findByQrToken(String(qrToken).trim());
    if (!tiquetera) {
      const error = new Error("Tiquetera no encontrada");
      error.status = 404;
      throw error;
    }

    const cliente = ClienteEntity.findById(tiquetera.cliente_id);
    const movimientos = ConsumoEntity.findByTiqueteraId(tiquetera.id).map((m) => ({
      id: m.id,
      tipo: m.tipo,
      cantidad: m.cantidad,
      fecha_hora: m.fecha_hora,
      cuadros_afectados: m.cuadros_seleccionados || [],
      saldo_posterior: m.saldo_posterior,
    }));

    // Agrupar movimientos por día calendario
    const movimientosPorDia = {};
    for (const mov of movimientos) {
      const dia = mov.fecha_hora.slice(0, 10);
      if (!movimientosPorDia[dia]) {
        movimientosPorDia[dia] = [];
      }
      movimientosPorDia[dia].push(mov);
    }

    return {
      qr_token: tiquetera.qr_token,
      url_consulta: `/api/tiqueteras/public/qr/${tiquetera.qr_token}`,
      cliente_nombre: cliente ? cliente.nombre : "Cliente",
      estado: tiquetera.estado,
      saldo: {
        total: tiquetera.total_almuerzos,
        consumidos: tiquetera.almuerzos_consumidos,
        disponibles: tiquetera.almuerzos_disponibles,
      },
      movimientos,
      movimientos_por_dia: movimientosPorDia,
    };
  }

  /**
   * HU-R4: Consulta y filtrado de tiqueteras
   * RF-17: filtros por nombre de cliente, estado y fecha de creación (YYYY-MM-DD).
   */
  getAllTiqueteras({ cliente_id, cliente_nombre, estado, fecha_creacion } = {}) {
    if (fecha_creacion && !/^\d{4}-\d{2}-\d{2}$/.test(fecha_creacion)) {
      throw new Error("La fecha de creación debe tener el formato YYYY-MM-DD");
    }

    const filtros = { cliente_id, estado, fecha_creacion };

    if (cliente_nombre) {
      const nombreBuscado = cliente_nombre.trim().toLowerCase();
      filtros.cliente_ids = ClienteEntity.findMany()
        .filter((c) => c.nombre.toLowerCase().includes(nombreBuscado))
        .map((c) => c.id);
    }

    return TiqueteraEntity.findMany(filtros).map((tiquetera) => {
      const cliente = ClienteEntity.findById(tiquetera.cliente_id);
      return {
        ...tiquetera,
        cliente_nombre: cliente ? cliente.nombre : null,
      };
    });
  }
}
