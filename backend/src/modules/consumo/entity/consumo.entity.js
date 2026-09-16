let movimientos = [];

export default class ConsumoEntity {
  static createOne(data) {
    const movimiento = {
      id: data.id || `MOV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tipo: data.tipo || "CONSUMO",
      tiquetera_id: data.tiquetera_id,
      cantidad: data.cantidad,
      usuario_id: data.usuario_id,
      fecha_hora: data.fecha_hora || new Date().toISOString(),
      saldo_anterior: data.saldo_anterior,
      saldo_posterior: data.saldo_posterior,
      cuadros_seleccionados: data.cuadros_seleccionados || [],
    };

    movimientos.push(movimiento);
    return movimiento;
  }

  static findByTiqueteraId(tiqueteraId) {
    return movimientos
      .filter((m) => String(m.tiquetera_id) === String(tiqueteraId))
      .sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora));
  }

  static findMany(filters = {}) {
    let result = [...movimientos];

    if (filters.tiquetera_id) {
      result = result.filter(
        (m) => String(m.tiquetera_id) === String(filters.tiquetera_id)
      );
    }

    if (filters.tipo) {
      result = result.filter(
        (m) => m.tipo.toUpperCase() === filters.tipo.toUpperCase()
      );
    }

    return result.sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora));
  }

  static clearAll() {
    movimientos = [];
  }
}
