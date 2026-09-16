import { ConsumoService } from "../services/consumo.service.js";

export default class ConsumoController {
  constructor() {
    this.consumoService = new ConsumoService();
  }

  /**
   * HU-R8: Registro de consumo
   * POST /api/consumos
   */
  registrarConsumo = (req, res) => {
    try {
      const {
        tiquetera_id,
        pin,
        cantidad,
        usuario_id,
        cuadros_seleccionados,
      } = req.body ?? {};

      const resultado = this.consumoService.registrarConsumo({
        tiquetera_id,
        pin,
        cantidad,
        usuario_id,
        cuadros_seleccionados,
      });

      return res.status(201).json({
        mensaje: "Consumo registrado exitosamente",
        movimiento: resultado.movimiento,
        tiquetera: resultado.tiquetera,
      });
    } catch (error) {
      const statusCode = error.status || 400;
      return res.status(statusCode).json({ error: error.message });
    }
  };

  /**
   * Consulta del historial de movimientos de una tiquetera
   * GET /api/consumos/tiquetera/:tiqueteraId
   */
  obtenerHistorial = (req, res) => {
    try {
      const { tiqueteraId } = req.params;
      const movimientos = this.consumoService.obtenerHistorialPorTiquetera(tiqueteraId);
      return res.json(movimientos);
    } catch (error) {
      const statusCode = error.status || 400;
      return res.status(statusCode).json({ error: error.message });
    }
  };
}
