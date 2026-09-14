let clientes = [];

export default class ClienteEntity {
  static createOne(data) {
    const cliente = {
      id: data.id || `CLI-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
      ...data,
      createdAt: new Date().toISOString(),
    };
    clientes.push(cliente);
    return cliente;
  }

  static findMany(filters = {}) {
    let result = [...clientes];

    if (filters.restaurante_id !== undefined) {
      result = result.filter(
        (c) => String(c.restaurante_id) === String(filters.restaurante_id)
      );
    }

    return result;
  }

  static findById(id) {
    return clientes.find((c) => String(c.id) === String(id)) || null;
  }

  static findByIdentificacion(identificacion, restaurante_id) {
    return (
      clientes.find(
        (c) =>
          c.identificacion === identificacion &&
          String(c.restaurante_id) === String(restaurante_id)
      ) || null
    );
  }

  static clearAll() {
    clientes = [];
  }
}
