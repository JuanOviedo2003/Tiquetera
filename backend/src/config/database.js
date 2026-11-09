import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

const isTestEnvironment =
  process.env.NODE_ENV === 'test' ||
  process.execArgv.includes('--test') ||
  process.argv.some((arg) => arg.includes('test'));

const backendDir = path.resolve(import.meta.dirname, '../..');
const dataDir = path.resolve(backendDir, 'data');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const defaultDbPath = isTestEnvironment
  ? ':memory:'
  : path.resolve(dataDir, 'tiquetera.db');

const dbPath = process.env.DB_PATH || defaultDbPath;

export const db = new DatabaseSync(dbPath);

// Enable WAL for concurrency and foreign keys
if (dbPath !== ':memory:') {
  db.exec('PRAGMA journal_mode = WAL;');
}
db.exec('PRAGMA foreign_keys = ON;');

// Initialize database schema
export function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      passwordHash TEXT,
      password TEXT,
      role TEXT NOT NULL DEFAULT 'RESTAURANTE',
      restaurante_id TEXT,
      es_titular INTEGER NOT NULL DEFAULT 0,
      precio_tiquetera REAL NOT NULL DEFAULT 0,
      active INTEGER NOT NULL DEFAULT 1,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS clientes (
      id TEXT PRIMARY KEY,
      nombre TEXT NOT NULL,
      identificacion TEXT NOT NULL,
      telefono TEXT,
      restaurante_id TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tiqueteras (
      id TEXT PRIMARY KEY,
      cliente_id TEXT NOT NULL,
      restaurante_id TEXT,
      total_almuerzos INTEGER NOT NULL,
      almuerzos_consumidos INTEGER NOT NULL DEFAULT 0,
      almuerzos_disponibles INTEGER NOT NULL,
      estado TEXT NOT NULL DEFAULT 'PENDIENTE',
      codigo_activacion TEXT,
      fecha_expiracion_codigo TEXT,
      codigo_usado INTEGER NOT NULL DEFAULT 0,
      qr_token TEXT,
      pin_hash TEXT,
      pin_actual TEXT,
      intentos_fallidos_pin INTEGER NOT NULL DEFAULT 0,
      bloqueado_hasta TEXT,
      fecha_activacion TEXT,
      fecha_finalizacion TEXT,
      fecha_regeneracion_pin TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS movimientos (
      id TEXT PRIMARY KEY,
      tiquetera_id TEXT NOT NULL,
      tipo TEXT NOT NULL DEFAULT 'CONSUMO',
      consumo_referencia_id TEXT,
      cantidad INTEGER NOT NULL,
      usuario_id TEXT,
      motivo TEXT,
      fecha_hora TEXT NOT NULL,
      saldo_anterior INTEGER,
      saldo_posterior INTEGER,
      cuadros_seleccionados TEXT
    );

    CREATE TABLE IF NOT EXISTS pin_historial (
      id TEXT PRIMARY KEY,
      tiquetera_id TEXT NOT NULL,
      restaurante_id TEXT,
      cliente_id TEXT,
      pin_anterior TEXT,
      pin_nuevo TEXT NOT NULL,
      origen TEXT NOT NULL DEFAULT 'CLIENTE',
      fecha_hora TEXT NOT NULL
    );
  `);

  try {
    db.exec(`ALTER TABLE users ADD COLUMN restaurante_id TEXT;`);
  } catch {
    // Columna ya existe
  }

  try {
    db.exec(`ALTER TABLE users ADD COLUMN es_titular INTEGER NOT NULL DEFAULT 0;`);
  } catch {
    // Columna ya existe
  }

  try {
    db.exec(`ALTER TABLE users ADD COLUMN precio_tiquetera REAL NOT NULL DEFAULT 0;`);
  } catch {
    // Columna ya existe
  }

  try {
    db.exec(`ALTER TABLE tiqueteras ADD COLUMN pin_actual TEXT;`);
  } catch {
    // Columna ya existe
  }

  seedDefaultUsers();
}

export function seedDefaultUsers() {
  const countStmt = db.prepare('SELECT COUNT(*) as count FROM users');
  const result = countStmt.get();

  if (result.count === 0) {
    const insertStmt = db.prepare(`
      INSERT INTO users (id, name, email, password, role, restaurante_id, es_titular, active, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertStmt.run(
      'USR-SUPER-ADMIN',
      'Superusuario',
      'admin@tiquetera.com',
      'admin123',
      'SUPER_ADMIN',
      null,
      0,
      1,
      new Date().toISOString()
    );

    insertStmt.run(
      'USR-DEMO-1',
      'Restaurante Demo',
      'prueba@gmail.com',
      '1234',
      'RESTAURANTE',
      'REST-1',
      1,
      1,
      new Date().toISOString()
    );

    insertStmt.run(
      'USR-DEMO-2',
      'Cocina Central',
      'cocina@tiquetera.com',
      'cocina123',
      'RESTAURANTE',
      'REST-1',
      0,
      1,
      new Date().toISOString()
    );
  } else {
    // Asegurar que exista el superusuario en bases de datos ya creadas
    const superAdmin = db
      .prepare('SELECT id FROM users WHERE LOWER(email) = ?')
      .get('admin@tiquetera.com');
    if (!superAdmin) {
      db.prepare(`
        INSERT INTO users (id, name, email, password, role, restaurante_id, es_titular, active, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        'USR-SUPER-ADMIN',
        'Superusuario',
        'admin@tiquetera.com',
        'admin123',
        'SUPER_ADMIN',
        null,
        0,
        1,
        new Date().toISOString()
      );
    }

    // Asegurar restaurante_id en cuentas demo preexistentes
    db.prepare(
      `UPDATE users SET restaurante_id = 'REST-1', es_titular = 1 WHERE email = 'prueba@gmail.com' AND (restaurante_id IS NULL OR es_titular = 0)`
    ).run();
    db.prepare(
      `UPDATE users SET restaurante_id = 'REST-1' WHERE role = 'RESTAURANTE' AND restaurante_id IS NULL`
    ).run();
  }
}

// Inicializar de inmediato al importar
initSchema();

export default db;
