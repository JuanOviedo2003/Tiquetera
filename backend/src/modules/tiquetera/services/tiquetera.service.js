import crypto from "node:crypto";
import TiqueteraEntity from "../entity/tiquetera.entity.js";
import ClienteEntity from "../../cliente/entity/cliente.entity.js";

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
   * RF-05, RF-06, RF-07: Activación de tiquetera desde el cliente
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
    return tiquetera;
  }

  getTiqueteraByQr(qrToken) {
    const tiquetera = TiqueteraEntity.findByQrToken(qrToken);
    if (!tiquetera) {
      throw new Error("Tiquetera no encontrada para el QR proporcionado");
    }
    return tiquetera;
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
