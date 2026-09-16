let tiqueteras = [
  {
    id: "TIQ-000000145",
    cliente_id: "1002820063",
    restaurante_id: 21212,
    total_almuerzos: 5,
    almuerzos_consumidos: 20,
    almuerzos_disponibles: 20,
    estado: "PENDIENTE", // PENDIENTE | ACTIVA | FINALIZADA
    codigo_activacion: "1234",
    fecha_expiracion_codigo: "2026-05-21",
    codigo_usado: false,
    qr_token: null,
    pin_hash: null,
    intentos_fallidos_pin: 0,
    bloqueado_hasta: null,
    fecha_activacion: null,
    fecha_finalizacion: null,
  }
];

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

    if (filters.cliente_ids !== undefined) {
      const ids = filters.cliente_ids.map(String);
      result = result.filter((t) => ids.includes(String(t.cliente_id)));
    }

    if (filters.estado) {
      result = result.filter(
        (t) => t.estado.toUpperCase() === filters.estado.toUpperCase()
      );
    }

    if (filters.fecha_creacion) {
      result = result.filter((t) => t.createdAt.slice(0, 10) === filters.fecha_creacion);
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
