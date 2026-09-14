import { ClienteService } from "../services/cliente.service.js";

export default class ClienteController {
  clienteService = new ClienteService();

  /**
   * HU-R2: Registro de clientes
   * POST /api/clientes
   */
  crear = (req, res) => {
    try {
      const { nombre, identificacion, telefono, restaurante_id } = req.body ?? {};
      const cliente = this.clienteService.createCliente({
        nombre,
        identificacion,
        telefono,
        restaurante_id,
      });
      res.status(201).json({ mensaje: "Cliente registrado exitosamente", cliente });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

  /**
   * Listar clientes de un restaurante
   * GET /api/clientes
   */
  listar = (req, res) => {
    try {
      const { restaurante_id } = req.query;
      const clientes = this.clienteService.getAllClientes({ restaurante_id });
      res.json(clientes);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

  /**
   * Consultar cliente por ID
   * GET /api/clientes/:id
   */
  obtenerPorId = (req, res) => {
    try {
      const { id } = req.params;
      const cliente = this.clienteService.getClienteById(id);
      res.json(cliente);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  };
}
