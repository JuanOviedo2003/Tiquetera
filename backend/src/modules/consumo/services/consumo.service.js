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
   * RF-15: Consulta del historial de movimientos de una tiquetera
   */
  obtenerHistorialPorTiquetera(tiquetera_id) {
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

    return ConsumoEntity.findByTiqueteraId(tiquetera_id);
  }
}
