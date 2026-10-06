import RejillaEntity from "./rejilla.entity.js";
import TiqueteraEntity from "../tiquetera/entity/tiquetera.entity.js";
import ClienteEntity from "../cliente/entity/cliente.entity.js";
import ConsumoEntity from "../consumo/entity/consumo.entity.js";

export class RejillaService {
  /**
   * HU-R7: Visualización de la rejilla de almuerzos
   * Muestra la rejilla con cuadros disponibles y consumidos diferenciados,
   * calculando el saldo y la fecha de cada consumo a partir de los datos reales.
   */
  obtenerRejilla(qrToken) {
    if (typeof qrToken !== "string" || !qrToken.trim()) {
      const error = new Error("El qr_token es obligatorio");
      error.statusCode = 400;
      throw error;
    }

    const tokenLimpio = qrToken.trim();

    // 1. Intentar buscar en las tiqueteras reales
    const tiqueteraReal = TiqueteraEntity.findByQrToken(tokenLimpio);

    if (tiqueteraReal) {
      const cliente = ClienteEntity.findById(tiqueteraReal.cliente_id);
      const movimientos = ConsumoEntity.findByTiqueteraId(tiqueteraReal.id);

      const cuadroMap = new Map();

      // Procesar movimientos cronológicos
      for (const m of movimientos) {
        if (m.tipo === "CONSUMO") {
          if (Array.isArray(m.cuadros_seleccionados) && m.cuadros_seleccionados.length > 0) {
            for (const cuadro of m.cuadros_seleccionados) {
              const num = Number(cuadro) >= 1 ? Number(cuadro) : Number(cuadro) + 1;
              cuadroMap.set(num, m.fecha_hora);
            }
          } else {
            // Asignar a los siguientes cuadros disponibles
            let asignados = 0;
            for (let num = 1; num <= tiqueteraReal.total_almuerzos && asignados < m.cantidad; num++) {
              if (!cuadroMap.has(num)) {
                cuadroMap.set(num, m.fecha_hora);
                asignados++;
              }
            }
          }
        } else if (m.tipo === "REVERSA") {
          if (Array.isArray(m.cuadros_seleccionados) && m.cuadros_seleccionados.length > 0) {
            for (const cuadro of m.cuadros_seleccionados) {
              const num = Number(cuadro) >= 1 ? Number(cuadro) : Number(cuadro) + 1;
              cuadroMap.delete(num);
            }
          } else {
            // Desasignar los últimos cuadros consumidos
            let desasignados = 0;
            for (let num = tiqueteraReal.total_almuerzos; num >= 1 && desasignados < m.cantidad; num--) {
              if (cuadroMap.has(num)) {
                cuadroMap.delete(num);
                desasignados++;
              }
            }
          }
        }
      }

      // Si faltan cuadros por mapear respecto a almuerzos_consumidos
      if (cuadroMap.size < tiqueteraReal.almuerzos_consumidos) {
        for (let num = 1; num <= tiqueteraReal.total_almuerzos && cuadroMap.size < tiqueteraReal.almuerzos_consumidos; num++) {
          if (!cuadroMap.has(num)) {
            cuadroMap.set(num, tiqueteraReal.updatedAt || new Date().toISOString());
          }
        }
      }

      const rejilla = [];
      for (let numero = 1; numero <= tiqueteraReal.total_almuerzos; numero++) {
        const fechaConsumo = cuadroMap.get(numero) ?? null;
        rejilla.push({
          numero,
          estado: fechaConsumo ? "consumido" : "disponible",
          fechaConsumo,
        });
      }

      return {
        qr_token: tiqueteraReal.qr_token,
        estado: tiqueteraReal.estado,
        cliente: cliente
          ? {
              nombre: cliente.nombre,
              telefono: cliente.telefono || null,
            }
          : null,
        saldo: {
          total: tiqueteraReal.total_almuerzos,
          consumidos: tiqueteraReal.almuerzos_consumidos,
          disponibles: tiqueteraReal.almuerzos_disponibles,
        },
        rejilla,
      };
    }

    // 2. Fallback a datos mock para retrocompatibilidad con tests o seeds
    const tiqueteraMock = RejillaEntity.findByQrToken(tokenLimpio);
    if (!tiqueteraMock) {
      const error = new Error("Tiquetera no encontrada");
      error.statusCode = 404;
      throw error;
    }

    const consumosPorCuadro = new Map(
      tiqueteraMock.consumos.map((c) => [c.cuadro, c.fechaConsumo])
    );

    const rejilla = [];
    for (let numero = 1; numero <= tiqueteraMock.total; numero++) {
      const fechaConsumo = consumosPorCuadro.get(numero) ?? null;
      rejilla.push({
        numero,
        estado: fechaConsumo ? "consumido" : "disponible",
        fechaConsumo,
      });
    }

    const consumidos = tiqueteraMock.consumos.length;
    const disponibles = tiqueteraMock.total - consumidos;

    return {
      qr_token: tiqueteraMock.qr_token,
      estado: tiqueteraMock.estado,
      cliente: tiqueteraMock.cliente,
      saldo: { total: tiqueteraMock.total, consumidos, disponibles },
      rejilla,
    };
  }
}
