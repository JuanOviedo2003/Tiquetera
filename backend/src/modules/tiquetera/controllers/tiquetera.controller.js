import { TiqueteraService } from "../services/tiquetera.service.js";

export default class TiqueteraController {
  constructor() {
    this.tiqueteraService = new TiqueteraService();
  }

  /**
   * HU-R3: Creación de tiquetera
   * POST /api/tiqueteras
   */
  crear = (req, res) => {
    try {
      const { cliente_id, total_almuerzos, restaurante_id } = req.body ?? {};
      const tiquetera = this.tiqueteraService.createTiquetera({
        cliente_id,
        total_almuerzos,
        restaurante_id,
      });

      return res.status(201).json({
        mensaje: "Tiquetera creada exitosamente",
        tiquetera,
      });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  };

  /**
   * Listar tiqueteras con filtros opcionales (cliente_id, estado)
   * GET /api/tiqueteras
   */
  listar = (req, res) => {
    try {
      const { cliente_id, estado } = req.query;
      const tiqueteras = this.tiqueteraService.getAllTiqueteras({
        cliente_id,
        estado,
      });
      return res.json(tiqueteras);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  };

  /**
   * Consultar tiquetera por ID
   * GET /api/tiqueteras/:id
   */
  obtenerPorId = (req, res) => {
    try {
      const { id } = req.params;
      const tiquetera = this.tiqueteraService.getTiqueteraById(id);
      return res.json(tiquetera);
    } catch (error) {
      return res.status(404).json({ error: error.message });
    }
  };

  /**
   * Reemitir código de activación vencido/pendiente
   * POST /api/tiqueteras/:id/reemitir-codigo
   */
  reemitirCodigo = (req, res) => {
    try {
      const { id } = req.params;
      const tiquetera = this.tiqueteraService.reemitirCodigoActivacion(id);
      return res.json({
        mensaje: "Código de activación reemitido exitosamente",
        tiquetera,
      });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  };

  /**
   * Activación de tiquetera por código y creación de PIN
   * POST /api/tiqueteras/activar
   */
  activar = (req, res) => {
    try {
      const { codigo_activacion, pin } = req.body ?? {};
      const tiquetera = this.tiqueteraService.activarTiquetera({
        codigo_activacion,
        pin,
      });
      return res.json({
        mensaje: "Tiquetera activada exitosamente",
        qr_token: tiquetera.qr_token,
        tiquetera,
      });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  };
}
