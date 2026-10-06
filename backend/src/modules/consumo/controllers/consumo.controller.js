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
   * HU-R9: Corrección de consumo del mismo día
   * POST /api/consumos/reversa
   */
  revertirConsumo = (req, res) => {
    try {
      const { consumo_id, usuario_id, cuadro_deseleccionado, motivo } = req.body ?? {};
      const resultado = this.consumoService.revertirConsumo({
        consumo_id,
        usuario_id,
        cuadro_deseleccionado,
        motivo,
      });

      return res.status(200).json({
        mensaje: "Consumo revertido exitosamente",
        movimiento: resultado.movimiento,
        tiquetera: resultado.tiquetera,
      });
    } catch (error) {
      const statusCode = error.status || 400;
      return res.status(statusCode).json({ error: error.message });
    }
  };

  /**
   * HU-R10 / RF-15: Consulta del historial de movimientos de una tiquetera
   * GET /api/consumos/tiquetera/:tiqueteraId?fecha=YYYY-MM-DD
   */
  obtenerHistorial = (req, res) => {
    try {
      const { tiqueteraId } = req.params;
      const { fecha } = req.query;
      const movimientos = this.consumoService.obtenerHistorialPorTiquetera(tiqueteraId, { fecha });
      return res.json(movimientos);
    } catch (error) {
      const statusCode = error.status || 400;
      return res.status(statusCode).json({ error: error.message });
    }
  };
}
