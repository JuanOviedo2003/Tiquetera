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
  `);

  seedDefaultUsers();
}

export function seedDefaultUsers() {
  const countStmt = db.prepare('SELECT COUNT(*) as count FROM users');
  const result = countStmt.get();

  if (result.count === 0) {
    const insertStmt = db.prepare(`
      INSERT INTO users (id, name, email, password, role, active, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    insertStmt.run(
      'USR-DEMO-1',
      'Restaurante Demo',
      'prueba@gmail.com',
      '1234',
      'RESTAURANTE',
      1,
      new Date().toISOString()
    );

    insertStmt.run(
      'USR-DEMO-2',
      'Cocina Central',
      'cocina@tiquetera.com',
      'cocina123',
      'RESTAURANTE',
      1,
      new Date().toISOString()
    );
  }
}

// Inicializar de inmediato al importar
initSchema();

export default db;
