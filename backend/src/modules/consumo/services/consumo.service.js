import crypto from "node:crypto";
import ConsumoEntity from "../entity/consumo.entity.js";
import TiqueteraEntity from "../../tiquetera/entity/tiquetera.entity.js";

export class ConsumoService {
  /**
   * HU-R8: Registro de consumo
   * RF-10, RF-11, RF-12, RF-13, RNF-04, RNF-06
   */
  registrarConsumo({
    tiquetera_id,
    pin,
    cantidad,
    usuario_id,
    cuadros_seleccionados = [],
  }) {
    // 1. Validar parámetros básicos de entrada
    if (!tiquetera_id) {
      const error = new Error("El id de la tiquetera es obligatorio");
      error.status = 400;
      throw error;
    }

    if (!usuario_id) {
      const error = new Error(
        "El id del usuario del restaurante que realiza la operación es obligatorio"
      );
      error.status = 400;
      throw error;
    }

    const cantidadAlmuerzos = Number(cantidad);
    if (!Number.isInteger(cantidadAlmuerzos) || cantidadAlmuerzos <= 0) {
      const error = new Error(
        "La cantidad de almuerzos a consumir debe ser un número entero mayor a 0"
      );
      error.status = 400;
      throw error;
    }

    if (!pin || !/^\d{6}$/.test(String(pin).trim())) {
      const error = new Error("El PIN del cliente debe tener 6 dígitos numéricos");
      error.status = 400;
      throw error;
    }

    // 2. Buscar tiquetera
    const tiquetera = TiqueteraEntity.findById(tiquetera_id);
    if (!tiquetera) {
      const error = new Error("Tiquetera no encontrada");
      error.status = 404;
      throw error;
    }

    // 3. Validar estado de la tiquetera (RF-12)
    if (tiquetera.estado !== "ACTIVA") {
      const error = new Error(
        `Operación rechazada: la tiquetera no está ACTIVA (estado actual: ${tiquetera.estado})`
      );
      error.status = 400;
      throw error;
    }

    // 4. Validar protección contra fuerza bruta y bloqueo temporal (RNF-06)
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

    // 5. Validar PIN del cliente mediante hash SHA-256 (RF-10, RNF-06)
    const pinHashIngresado = crypto
      .createHash("sha256")
      .update(String(pin).trim())
      .digest("hex");

    if (pinHashIngresado !== tiquetera.pin_hash) {
      const nuevosIntentos = (tiquetera.intentos_fallidos_pin || 0) + 1;
      let nuevoBloqueo = null;

      if (nuevosIntentos >= 3) {
        // Bloqueo temporal por 15 minutos
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

    // PIN correcto -> resetear intentos fallidos
    if (tiquetera.intentos_fallidos_pin > 0 || tiquetera.bloqueado_hasta) {
      TiqueteraEntity.updateOne(tiquetera.id, {
        intentos_fallidos_pin: 0,
        bloqueado_hasta: null,
      });
    }

    // 6. Validar saldo disponible (RF-12)
    if (cantidadAlmuerzos > tiquetera.almuerzos_disponibles) {
      const error = new Error(
        `Saldo insuficiente: no es posible descontar ${cantidadAlmuerzos} almuerzo(s). Almuerzos disponibles: ${tiquetera.almuerzos_disponibles}`
      );
      error.status = 400;
      throw error;
    }

    // 7. Actualización automática de saldos (RF-11)
    const saldoAnterior = tiquetera.almuerzos_disponibles;
    const nuevosConsumidos = tiquetera.almuerzos_consumidos + cantidadAlmuerzos;
    const nuevosDisponibles = tiquetera.almuerzos_disponibles - cantidadAlmuerzos;

    // 8. Finalización automática si llega a 0 (RF-13)
    const finalizar = nuevosDisponibles === 0;
    const fechaActualIso = new Date().toISOString();

    const actualizacionTiquetera = {
      almuerzos_consumidos: nuevosConsumidos,
      almuerzos_disponibles: nuevosDisponibles,
      estado: finalizar ? "FINALIZADA" : "ACTIVA",
      fecha_finalizacion: finalizar ? fechaActualIso : tiquetera.fecha_finalizacion,
    };

    const tiqueteraActualizada = TiqueteraEntity.updateOne(
      tiquetera.id,
      actualizacionTiquetera
    );

    // 9. Registrar el movimiento de consumo inmutable (RF-10, RF-15, RNF-04)
    const movimiento = ConsumoEntity.createOne({
      tiquetera_id: tiquetera.id,
      tipo: "CONSUMO",
      cantidad: cantidadAlmuerzos,
      usuario_id,
      fecha_hora: fechaActualIso,
      saldo_anterior: saldoAnterior,
      saldo_posterior: nuevosDisponibles,
      cuadros_seleccionados: Array.isArray(cuadros_seleccionados)
        ? cuadros_seleccionados
        : [],
    });

    return {
      movimiento,
      tiquetera: tiqueteraActualizada,
    };
  }

  /**
   * HU-R9: Corrección de consumo del mismo día
   * RF-14: Permite deseleccionar un cuadro consumido únicamente dentro del mismo día calendario,
   * generando una reversa inmutable y restaurando el saldo de la tiquetera.
   */
  revertirConsumo({ consumo_id, usuario_id, cuadro_deseleccionado = null, motivo = "Corrección del mismo día" }) {
    if (!consumo_id) {
      const error = new Error("El id del consumo original es obligatorio");
      error.status = 400;
      throw error;
    }

    if (!usuario_id) {
      const error = new Error("El id del usuario del restaurante que realiza la reversa es obligatorio");
      error.status = 400;
      throw error;
    }

    const consumoOriginal = ConsumoEntity.findById(consumo_id);
    if (!consumoOriginal) {
      const error = new Error("Consumo no encontrado");
      error.status = 404;
      throw error;
    }

    if (consumoOriginal.tipo !== "CONSUMO") {
      const error = new Error("Solo se pueden revertir registros de tipo CONSUMO");
      error.status = 400;
      throw error;
    }

    // Validar restricción del mismo día calendario (RF-14)
    const fechaConsumoStr = new Date(consumoOriginal.fecha_hora).toISOString().slice(0, 10);
    const fechaHoyStr = new Date().toISOString().slice(0, 10);

    if (fechaConsumoStr !== fechaHoyStr) {
      const error = new Error("Solo es posible corregir consumos registrados dentro del mismo día calendario");
      error.status = 400;
      throw error;
    }

    // Verificar si ya fue revertido
    const todosMovimientos = ConsumoEntity.findByTiqueteraId(consumoOriginal.tiquetera_id);
    const reversasPrevias = todosMovimientos.filter(
      (m) => m.tipo === "REVERSA" && String(m.consumo_referencia_id) === String(consumo_id)
    );
    const cantidadYaRevertida = reversasPrevias.reduce((acc, r) => acc + (r.cantidad || 0), 0);

    if (cantidadYaRevertida >= consumoOriginal.cantidad) {
      const error = new Error("El consumo ya ha sido revertido en su totalidad");
      error.status = 400;
      throw error;
    }

    const cantidadRevertir = cuadro_deseleccionado !== null ? 1 : (consumoOriginal.cantidad - cantidadYaRevertida);

    // Actualizar tiquetera
    const tiquetera = TiqueteraEntity.findById(consumoOriginal.tiquetera_id);
    if (!tiquetera) {
      const error = new Error("Tiquetera asociada no encontrada");
      error.status = 404;
      throw error;
    }

    const saldoAnterior = tiquetera.almuerzos_disponibles;
    const nuevosDisponibles = Math.min(
      tiquetera.total_almuerzos,
      tiquetera.almuerzos_disponibles + cantidadRevertir
    );
    const nuevosConsumidos = Math.max(0, tiquetera.almuerzos_consumidos - cantidadRevertir);

    const actualizacionTiquetera = {
      almuerzos_disponibles: nuevosDisponibles,
      almuerzos_consumidos: nuevosConsumidos,
      estado: "ACTIVA", // Si estaba FINALIZADA, reactiva la tiquetera
      fecha_finalizacion: nuevosDisponibles === 0 ? tiquetera.fecha_finalizacion : null,
    };

    const tiqueteraActualizada = TiqueteraEntity.updateOne(tiquetera.id, actualizacionTiquetera);

    // Crear registro de reversa inmutable (RF-14, RNF-04)
    const movimiento = ConsumoEntity.createOne({
      tiquetera_id: tiquetera.id,
      tipo: "REVERSA",
      consumo_referencia_id: consumoOriginal.id,
      cantidad: cantidadRevertir,
      usuario_id,
      motivo,
      fecha_hora: new Date().toISOString(),
      saldo_anterior: saldoAnterior,
      saldo_posterior: nuevosDisponibles,
      cuadros_seleccionados: cuadro_deseleccionado !== null
        ? [cuadro_deseleccionado]
        : (consumoOriginal.cuadros_seleccionados || []),
    });

    return {
      movimiento,
      tiquetera: tiqueteraActualizada,
    };
  }

  /**
   * RF-15 / HU-R10: Consulta del historial de movimientos de una tiquetera con filtro opcional por fecha
   */
  obtenerHistorialPorTiquetera(tiquetera_id, { fecha } = {}) {
    if (!tiquetera_id) {
      const error = new Error("El id de la tiquetera es obligatorio");
      error.status = 400;
      throw error;
    }

    const tiquetera = TiqueteraEntity.findById(tiquetera_id);
    if (!tiquetera) {
      const error = new Error("Tiquetera no encontrada");
      error.status = 404;
      throw error;
    }

    let movimientos = ConsumoEntity.findByTiqueteraId(tiquetera_id);

    if (fecha) {
      movimientos = movimientos.filter((m) => m.fecha_hora.slice(0, 10) === String(fecha).trim());
    }

    return movimientos;
  }
}
