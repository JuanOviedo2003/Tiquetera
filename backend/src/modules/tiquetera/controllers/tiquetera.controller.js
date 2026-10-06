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
   * HU-R4: Consulta y filtrado de tiqueteras
   * RF-17: filtros opcionales por cliente_id, nombre de cliente, estado y fecha de creación
   * GET /api/tiqueteras
   */
  listar = (req, res) => {
    try {
      const { cliente_id, cliente_nombre, estado, fecha_creacion } = req.query;
      const tiqueteras = this.tiqueteraService.getAllTiqueteras({
        cliente_id,
        cliente_nombre,
        estado,
        fecha_creacion,
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
   * Obtener código de activación de una tiquetera PENDIENTE
   * GET /api/tiqueteras/:id/codigo-activacion
   */
  obtenerCodigoActivacion = (req, res) => {
    try {
      const { id } = req.params;

      const codigo = this.tiqueteraService.getCodigoActivacion(id);

      return res.json(codigo);
    } catch (error) {
      return res.status(400).json({
        error: error.message,
      });
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
        url_consulta: `/api/tiqueteras/public/qr/${tiquetera.qr_token}`,
        tiquetera,
      });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  };

  /**
   * HU-R5: Apertura de tiquetera por QR
   * GET /api/tiqueteras/qr/:qrToken
   */
  obtenerPorQr = (req, res) => {
    try {
      const { qrToken } = req.params;
      const tiquetera = this.tiqueteraService.getTiqueteraByQr(qrToken);
      return res.json(tiquetera);
    } catch (error) {
      const statusCode = error.status || 404;
      return res.status(statusCode).json({ error: error.message });
    }
  };

  /**
   * HU-R6: Validación de PIN del cliente antes de mostrar la rejilla
   * POST /api/tiqueteras/validar-pin o POST /api/tiqueteras/:id/validar-pin
   */
  validarPin = (req, res) => {
    try {
      const { tiquetera_id, qr_token, pin } = req.body ?? {};
      const resultado = this.tiqueteraService.validarPin({
        tiquetera_id: tiquetera_id || req.params.id,
        qr_token,
        pin,
      });
      return res.json(resultado);
    } catch (error) {
      const statusCode = error.status || 400;
      return res.status(statusCode).json({ error: error.message });
    }
  };

  /**
   * HU-C3: Regeneración de PIN por parte del cliente
   * POST /api/tiqueteras/regenerar-pin
   */
  regenerarPin = (req, res) => {
    try {
      const { qr_token, nuevo_pin } = req.body ?? {};
      const resultado = this.tiqueteraService.regenerarPin({
        qr_token,
        nuevo_pin,
      });
      return res.json(resultado);
    } catch (error) {
      const statusCode = error.status || 400;
      return res.status(statusCode).json({ error: error.message });
    }
  };

  /**
   * HU-C4 & HU-C5: Consulta pública de saldo e historial del cliente (solo lectura sin cuenta)
   * GET /api/tiqueteras/public/qr/:qrToken
   */
  obtenerVistaPublica = (req, res) => {
    try {
      const { qrToken } = req.params;
      const vista = this.tiqueteraService.getVistaPublicaCliente(qrToken);
      return res.json(vista);
    } catch (error) {
      const statusCode = error.status || 404;
      return res.status(statusCode).json({ error: error.message });
    }
  };
}
