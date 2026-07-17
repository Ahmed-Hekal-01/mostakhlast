import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Allow override via environment variable for portability (e.g., if the user
// moves the app folder, just set DB_PATH in .env.local to an absolute path)
const DB_DIR = process.env.DB_PATH
  ? path.dirname(process.env.DB_PATH)
  : path.join(process.cwd(), 'data');

const DB_PATH = process.env.DB_PATH
  ? process.env.DB_PATH
  : path.join(DB_DIR, 'mostakhlasat.db');

let _db: Database.Database | null = null;
let _shutdownRegistered = false;

export function getDb(): Database.Database {
  if (_db) return _db;

  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  _db = new Database(DB_PATH);
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');
  // Prevent "database is locked" errors if two requests come simultaneously
  _db.pragma('busy_timeout = 5000');

  initSchema(_db);
  registerShutdown();
  return _db;
}

/** Flush WAL and close DB cleanly when the server process exits */
function registerShutdown() {
  if (_shutdownRegistered) return;
  _shutdownRegistered = true;

  const close = () => {
    if (_db) {
      try {
        _db.pragma('wal_checkpoint(TRUNCATE)');
        _db.close();
      } catch {
        // ignore errors on exit
      }
      _db = null;
    }
    process.exit(0);
  };

  process.on('SIGINT', close);
  process.on('SIGTERM', close);
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      contact_person TEXT,
      phone TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS locations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      scope_description TEXT,
      status TEXT NOT NULL DEFAULT 'نشط',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS mostakhlasat (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      location_id INTEGER NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
      sequence_number INTEGER NOT NULL,
      expected_amount REAL,
      due_date TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mostakhlas_id INTEGER NOT NULL REFERENCES mostakhlasat(id) ON DELETE CASCADE,
      amount REAL NOT NULL,
      payment_date TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}
