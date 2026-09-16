import { ClienteService } from "../services/cliente.service.js";

export default class ClienteController {
  clienteService = new ClienteService();

  
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

  
  listar = (req, res) => {
    try {
      const { restaurante_id } = req.query;
      const clientes = this.clienteService.getAllClientes({ restaurante_id });
      res.json(clientes);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

  
  obtenerPorId = (req, res) => {
    try {
      const id  = req.params.id;
      console.log(req)
      console.log(id)
      const cliente = this.clienteService.getClienteById(id);
      res.json(cliente);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  };
}
