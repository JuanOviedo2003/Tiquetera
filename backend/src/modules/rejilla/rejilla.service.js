import RejillaEntity from "./rejilla.entity.js";

export class RejillaService {
  obtenerRejilla(qrToken) {
    if (typeof qrToken !== "string" || !qrToken.trim()) {
      const error = new Error("El qr_token es obligatorio");
      error.statusCode = 400;
      throw error;
    }

    const tiquetera = RejillaEntity.findByQrToken(qrToken.trim());

    if (!tiquetera) {
      const error = new Error("Tiquetera no encontrada");
      error.statusCode = 404;
      throw error;
    }

    const consumosPorCuadro = new Map(
      tiquetera.consumos.map((c) => [c.cuadro, c.fechaConsumo])
    );

    const rejilla = [];
    for (let numero = 1; numero <= tiquetera.total; numero++) {
      const fechaConsumo = consumosPorCuadro.get(numero) ?? null;
      rejilla.push({
        numero,
        estado: fechaConsumo ? "consumido" : "disponible",
        fechaConsumo,
      });
    }

    const consumidos = tiquetera.consumos.length;
    const disponibles = tiquetera.total - consumidos;

    return {
      qr_token: tiquetera.qr_token,
      estado: tiquetera.estado,
      cliente: tiquetera.cliente,
      saldo: { total: tiquetera.total, consumidos, disponibles },
      rejilla,
    };
  }
}
