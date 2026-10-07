import { db } from '../../../config/database.js';

function formatTiquetera(row) {
  if (!row) return null;
  return {
    ...row,
    codigo_usado: Boolean(row.codigo_usado),
    total_almuerzos: Number(row.total_almuerzos),
    almuerzos_consumidos: Number(row.almuerzos_consumidos),
    almuerzos_disponibles: Number(row.almuerzos_disponibles),
    intentos_fallidos_pin: Number(row.intentos_fallidos_pin || 0),
  };
}

export default class TiqueteraEntity {
  static createOne(data) {
    const id = String(data.id || `TIQ-${Date.now()}-${Math.floor(Math.random() * 1000)}`);
    const createdAt = data.createdAt || new Date().toISOString();
    const updatedAt = data.updatedAt || new Date().toISOString();

    db.prepare(`
      INSERT INTO tiqueteras (
        id, cliente_id, restaurante_id, total_almuerzos, almuerzos_consumidos,
        almuerzos_disponibles, estado, codigo_activacion, fecha_expiracion_codigo,
        codigo_usado, qr_token, pin_hash, intentos_fallidos_pin, bloqueado_hasta,
        fecha_activacion, fecha_finalizacion, fecha_regeneracion_pin, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      String(data.cliente_id),
      data.restaurante_id !== undefined && data.restaurante_id !== null ? String(data.restaurante_id) : null,
      Number(data.total_almuerzos),
      Number(data.almuerzos_consumidos || 0),
      Number(data.almuerzos_disponibles !== undefined ? data.almuerzos_disponibles : data.total_almuerzos),
      data.estado || 'PENDIENTE',
      data.codigo_activacion || null,
      data.fecha_expiracion_codigo || null,
      data.codigo_usado ? 1 : 0,
      data.qr_token || null,
      data.pin_hash || null,
      Number(data.intentos_fallidos_pin || 0),
      data.bloqueado_hasta || null,
      data.fecha_activacion || null,
      data.fecha_finalizacion || null,
      data.fecha_regeneracion_pin || null,
      createdAt,
      updatedAt
    );

    const inserted = db.prepare('SELECT * FROM tiqueteras WHERE id = ?').get(id);
    return formatTiquetera(inserted);
  }

  static findById(id) {
    if (!id) return null;
    const row = db.prepare('SELECT * FROM tiqueteras WHERE id = ?').get(String(id));
    return formatTiquetera(row);
  }

  static findByActivationCode(code) {
    if (!code) return null;
    const row = db.prepare('SELECT * FROM tiqueteras WHERE codigo_activacion = ?').get(String(code));
    return formatTiquetera(row);
  }

  static findByQrToken(qrToken) {
    if (!qrToken) return null;
    const row = db.prepare('SELECT * FROM tiqueteras WHERE qr_token = ?').get(String(qrToken));
    return formatTiquetera(row);
  }

  static findMany(filters = {}) {
    let query = 'SELECT * FROM tiqueteras WHERE 1=1';
    const params = [];

    if (filters.cliente_id !== undefined) {
      query += ' AND cliente_id = ?';
      params.push(String(filters.cliente_id));
    }

    if (filters.cliente_ids !== undefined) {
      const ids = filters.cliente_ids.map(String);
      if (ids.length === 0) {
        return [];
      }
      const placeholders = ids.map(() => '?').join(',');
      query += ` AND cliente_id IN (${placeholders})`;
      params.push(...ids);
    }

    if (filters.estado) {
      query += ' AND UPPER(estado) = UPPER(?)';
      params.push(filters.estado);
    }

    if (filters.fecha_creacion) {
      query += ' AND substr(createdAt, 1, 10) = ?';
      params.push(filters.fecha_creacion);
    }

    query += ' ORDER BY createdAt DESC';
    const rows = db.prepare(query).all(...params);
    return rows.map(formatTiquetera);
  }

  static updateOne(id, updateData) {
    const existing = db.prepare('SELECT * FROM tiqueteras WHERE id = ?').get(String(id));
    if (!existing) {
      return null;
    }

    const updatedAt = updateData.updatedAt || new Date().toISOString();
    const dataToUpdate = { ...updateData, updatedAt };

    const sets = [];
    const params = [];

    for (const [key, value] of Object.entries(dataToUpdate)) {
      if (key === 'id') continue;
      sets.push(`${key} = ?`);
      if (typeof value === 'boolean') {
        params.push(value ? 1 : 0);
      } else {
        params.push(value === undefined ? null : value);
      }
    }

    if (sets.length === 0) {
      return formatTiquetera(existing);
    }

    params.push(String(id));
    const sql = `UPDATE tiqueteras SET ${sets.join(', ')} WHERE id = ?`;
    db.prepare(sql).run(...params);

    const updated = db.prepare('SELECT * FROM tiqueteras WHERE id = ?').get(String(id));
    return formatTiquetera(updated);
  }

  static clearAll() {
    db.prepare('DELETE FROM tiqueteras').run();
  }
}
