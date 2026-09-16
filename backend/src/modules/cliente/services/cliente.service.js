import ClienteEntity from "../entity/cliente.entity.js";

export class ClienteService {
  /**
   * HU-R2: Registro de clientes
   * RF-01: nombre completo, número de identificación y teléfono opcional,
   * vinculado al restaurante que lo registró.
   */
  createCliente({ nombre, identificacion, telefono, restaurante_id }) {
    if (typeof nombre !== "string" || !nombre.trim()) {
      throw new Error("El nombre completo es obligatorio");
    }

    if (
      identificacion === undefined ||
      identificacion === null ||
      !String(identificacion).trim()
    ) {
      throw new Error("El número de identificación es obligatorio");
    }

    if (
      telefono !== undefined &&
      telefono !== null &&
      telefono !== "" &&
      !/^\d{7,15}$/.test(String(telefono).trim())
    ) {
      throw new Error("El teléfono debe contener solo números (7 a 15 dígitos)");
    }

    if (!restaurante_id && restaurante_id !== 0) {
      throw new Error("El id del restaurante es obligatorio");
    }

    const identificacionLimpia = String(identificacion).trim();
    const existente = ClienteEntity.findByIdentificacion(
      identificacionLimpia,
      restaurante_id
    );
    if (existente) {
      throw new Error(
        "Ya existe un cliente registrado con esa identificación en este restaurante"
      );
    }

    return ClienteEntity.createOne({
      nombre: nombre.trim(),
      identificacion: identificacionLimpia,
      telefono: telefono ? String(telefono).trim() : null,
      restaurante_id,
    });
  }

  getAllClientes(filters = {}) {
    return ClienteEntity.findMany(filters);
  }

  getClienteById(id) {
    const cliente = ClienteEntity.findById(id);
    if (!cliente) {
      throw new Error("Cliente no encontrado");
    }
    return cliente;
  }
}
