import { db } from '../../../config/database.js';

export default class ClienteEntity {
  static createOne(data) {
    const id = String(data.id || `CLI-${Date.now()}-${Math.floor(Math.random() * 100000)}`);
    const createdAt = data.createdAt || new Date().toISOString();

    db.prepare(`
      INSERT INTO clientes (id, nombre, identificacion, telefono, restaurante_id, createdAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      id,
      data.nombre,
      String(data.identificacion),
      data.telefono ? String(data.telefono) : null,
      String(data.restaurante_id),
      createdAt
    );

    return db.prepare('SELECT * FROM clientes WHERE id = ?').get(id);
  }

  static findMany(filters = {}) {
    if (filters.restaurante_id !== undefined) {
      return db.prepare(
        'SELECT * FROM clientes WHERE restaurante_id = ? ORDER BY createdAt DESC'
      ).all(String(filters.restaurante_id));
    }
    return db.prepare('SELECT * FROM clientes ORDER BY createdAt DESC').all();
  }

  static findById(id) {
    if (!id) return null;
    return db.prepare('SELECT * FROM clientes WHERE id = ?').get(String(id)) || null;
  }

  static findByIdentificacion(identificacion, restaurante_id) {
    if (!identificacion) return null;
    return (
      db.prepare(
        'SELECT * FROM clientes WHERE identificacion = ? AND restaurante_id = ?'
      ).get(String(identificacion), String(restaurante_id)) || null
    );
  }

  static clearAll() {
    db.prepare('DELETE FROM clientes').run();
  }
}
