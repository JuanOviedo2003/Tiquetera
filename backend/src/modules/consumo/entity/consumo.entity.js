import { db } from '../../../config/database.js';

function formatMovimiento(row) {
  if (!row) return null;
  let cuadros = [];
  try {
    cuadros = row.cuadros_seleccionados ? JSON.parse(row.cuadros_seleccionados) : [];
  } catch {
    cuadros = [];
  }

  return {
    ...row,
    cantidad: Number(row.cantidad),
    saldo_anterior: row.saldo_anterior !== null && row.saldo_anterior !== undefined ? Number(row.saldo_anterior) : null,
    saldo_posterior: row.saldo_posterior !== null && row.saldo_posterior !== undefined ? Number(row.saldo_posterior) : null,
    cuadros_seleccionados: Array.isArray(cuadros) ? cuadros : [],
  };
}

export default class ConsumoEntity {
  static createOne(data) {
    const id = String(data.id || `MOV-${Date.now()}-${Math.floor(Math.random() * 1000)}`);
    const fechaHora = data.fecha_hora || new Date().toISOString();
    const cuadrosJson = JSON.stringify(
      Array.isArray(data.cuadros_seleccionados) ? data.cuadros_seleccionados : []
    );

    db.prepare(`
      INSERT INTO movimientos (
        id, tiquetera_id, tipo, consumo_referencia_id, cantidad, usuario_id,
        motivo, fecha_hora, saldo_anterior, saldo_posterior, cuadros_seleccionados
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      String(data.tiquetera_id),
      data.tipo || 'CONSUMO',
      data.consumo_referencia_id ? String(data.consumo_referencia_id) : null,
      Number(data.cantidad),
      data.usuario_id ? String(data.usuario_id) : null,
      data.motivo || null,
      fechaHora,
      data.saldo_anterior !== undefined && data.saldo_anterior !== null ? Number(data.saldo_anterior) : null,
      data.saldo_posterior !== undefined && data.saldo_posterior !== null ? Number(data.saldo_posterior) : null,
      cuadrosJson
    );

    const inserted = db.prepare('SELECT * FROM movimientos WHERE id = ?').get(id);
    return formatMovimiento(inserted);
  }

  static findById(id) {
    if (!id) return null;
    const row = db.prepare('SELECT * FROM movimientos WHERE id = ?').get(String(id));
    return formatMovimiento(row);
  }

  static findByTiqueteraId(tiqueteraId) {
    const rows = db.prepare(
      'SELECT * FROM movimientos WHERE tiquetera_id = ? ORDER BY fecha_hora ASC'
    ).all(String(tiqueteraId));
    return rows.map(formatMovimiento);
  }

  static findMany(filters = {}) {
    let query = 'SELECT * FROM movimientos WHERE 1=1';
    const params = [];

    if (filters.tiquetera_id) {
      query += ' AND tiquetera_id = ?';
      params.push(String(filters.tiquetera_id));
    }

    if (filters.tipo) {
      query += ' AND UPPER(tipo) = UPPER(?)';
      params.push(filters.tipo);
    }

    query += ' ORDER BY fecha_hora ASC';
    const rows = db.prepare(query).all(...params);
    return rows.map(formatMovimiento);
  }

  static clearAll() {
    db.prepare('DELETE FROM movimientos').run();
  }
}
