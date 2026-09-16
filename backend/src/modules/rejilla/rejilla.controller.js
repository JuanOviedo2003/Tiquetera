import { RejillaService } from "./rejilla.service.js";

export default class RejillaController {
  rejillaService = new RejillaService();

  obtenerRejilla = (req, res) => {
    const { qrToken } = req.params ?? {};

    try {
      const resultado = this.rejillaService.obtenerRejilla(qrToken);
      res.status(200).json(resultado);
    } catch (error) {
      res.status(error.statusCode ?? 400).json({ error: error.message });
    }
  };
}
