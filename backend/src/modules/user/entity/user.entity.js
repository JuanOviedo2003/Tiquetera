import { db, seedDefaultUsers } from '../../../config/database.js';

function formatUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    nombre: row.name,
    email: row.email,
    passwordHash: row.passwordHash || undefined,
    password: row.password || undefined,
    role: row.role,
    rol: row.role,
    restaurante_id: row.restaurante_id || null,
    es_titular: Boolean(row.es_titular),
    active: Boolean(row.active),
    activo: Boolean(row.active),
    createdAt: row.createdAt,
  };
}

export default class UserEntity {
  static findMany(filters = {}) {
    let query = 'SELECT * FROM users WHERE 1=1';
    const params = [];

    if (filters.role) {
      query += ' AND role = ?';
      params.push(String(filters.role));
    }

    if (filters.restaurante_id) {
      query += ' AND restaurante_id = ?';
      params.push(String(filters.restaurante_id));
    }

    if (filters.es_titular !== undefined) {
      query += ' AND es_titular = ?';
      params.push(filters.es_titular ? 1 : 0);
    }

    query += ' ORDER BY createdAt DESC';
    const rows = db.prepare(query).all(...params);
    return rows.map(formatUser);
  }

  static findById(id) {
    if (!id) return null;
    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(String(id));
    return formatUser(row);
  }

  static findByEmail(email) {
    if (!email) return null;
    const normalized = email.trim().toLowerCase();
    const row = db.prepare('SELECT * FROM users WHERE LOWER(email) = ?').get(normalized);
    return formatUser(row);
  }

  static createOne(data) {
    const id = String(data.id || `USR-${Date.now()}-${Math.floor(Math.random() * 10000)}`);
    const createdAt = data.createdAt || new Date().toISOString();
    const activeInt = data.active !== false ? 1 : 0;
    const esTitularInt = data.es_titular ? 1 : 0;

    db.prepare(`
      INSERT INTO users (id, name, email, passwordHash, password, role, restaurante_id, es_titular, active, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      data.name,
      data.email.trim().toLowerCase(),
      data.passwordHash || null,
      data.password || null,
      data.role || 'RESTAURANTE',
      data.restaurante_id !== undefined ? data.restaurante_id : 'REST-1',
      esTitularInt,
      activeInt,
      createdAt
    );

    const inserted = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    return formatUser(inserted);
  }

  static clearAll() {
    db.prepare('DELETE FROM users').run();
    seedDefaultUsers();
  }
}