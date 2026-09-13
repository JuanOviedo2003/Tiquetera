let tiqueteras = [];

export default class TiqueteraEntity {
  static createOne(data) {
    const tiquetera = {
      id: data.id || `TIQ-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      ...data,
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString(),
    };
    tiqueteras.push(tiquetera);
    return tiquetera;
  }

  static findById(id) {
    return tiqueteras.find((t) => t.id === id) || null;
  }

  static findByActivationCode(code) {
    return tiqueteras.find((t) => t.codigo_activacion === code) || null;
  }

  static findByQrToken(qrToken) {
    return tiqueteras.find((t) => t.qr_token === qrToken) || null;
  }

  static findMany(filters = {}) {
    let result = [...tiqueteras];

    if (filters.cliente_id !== undefined) {
      result = result.filter((t) => String(t.cliente_id) === String(filters.cliente_id));
    }

    if (filters.estado) {
      result = result.filter(
        (t) => t.estado.toUpperCase() === filters.estado.toUpperCase()
      );
    }

    return result;
  }

  static updateOne(id, updateData) {
    const index = tiqueteras.findIndex((t) => t.id === id);
    if (index === -1) {
      return null;
    }

    tiqueteras[index] = {
      ...tiqueteras[index],
      ...updateData,
      updatedAt: new Date().toISOString(),
    };

    return tiqueteras[index];
  }

  static clearAll() {
    tiqueteras = [];
  }
}
