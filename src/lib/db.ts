import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'mostakhlasat.db');

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;

  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  _db = new Database(DB_PATH);
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');

  initSchema(_db);
  return _db;
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

    CREATE TABLE IF NOT EXISTS seed_done (
      id INTEGER PRIMARY KEY
    );
  `);

  const seeded = db.prepare('SELECT id FROM seed_done WHERE id = 1').get();
  if (!seeded) {
    seedData(db);
    db.prepare('INSERT INTO seed_done (id) VALUES (1)').run();
  }
}

function seedData(db: Database.Database) {
  // Today = 2026-07-16 (as per user's local time)
  // We'll compute dates relative to 'now' at seed time so alerts work
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().split('T')[0];

  const dayOffset = (n: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + n);
    return fmt(d);
  };

  // --- Companies ---
  const insertCompany = db.prepare(`
    INSERT INTO companies (name, contact_person, phone, notes, created_at)
    VALUES (?, ?, ?, ?, datetime('now'))
  `);

  const c1 = insertCompany.run('شركة النيل للمقاولات', 'أحمد محمود', '01012345678', 'عميل رئيسي - مشاريع كبرى');
  const c2 = insertCompany.run('مجموعة الدلتا للتعمير', 'محمد سالم', '01098765432', 'مشاريع سكنية');
  const c3 = insertCompany.run('شركة الأهرام للبناء', 'سامي عبدالله', '01155556666', '');

  // --- Locations ---
  const insertLocation = db.prepare(`
    INSERT INTO locations (company_id, name, scope_description, status, created_at)
    VALUES (?, ?, ?, ?, datetime('now'))
  `);

  const l1 = insertLocation.run(c1.lastInsertRowid, 'مشروع القاهرة الجديدة - قرية A', 'أعمال الهيكل الخرساني والتشطيبات الخارجية - 120 وحدة سكنية', 'نشط');
  const l2 = insertLocation.run(c1.lastInsertRowid, 'مشروع العاشر من رمضان', 'بناء مصنع وأعمال بنية تحتية', 'نشط');
  const l3 = insertLocation.run(c2.lastInsertRowid, 'قرية دمياط الجديدة', 'تشييد كمبوند سكني - 60 فيلا', 'نشط');
  const l4 = insertLocation.run(c2.lastInsertRowid, 'مشروع الإسماعيلية', 'أعمال طرق وصرف صحي', 'منتهي');
  const l5 = insertLocation.run(c3.lastInsertRowid, 'مجمع المنصورة السكني', 'تشطيبات داخلية وخارجية لـ 80 شقة', 'نشط');

  // --- Mostakhlasat ---
  const insertM = db.prepare(`
    INSERT INTO mostakhlasat (location_id, sequence_number, expected_amount, due_date, notes, created_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
  `);

  // L1: 3 cycles — 2 fully collected, 1 OVERDUE
  const m1 = insertM.run(l1.lastInsertRowid, 1, 150000, dayOffset(-60), 'مستخلص الهيكل الخرساني');
  const m2 = insertM.run(l1.lastInsertRowid, 2, 200000, dayOffset(-30), 'مستخلص التشطيبات الخارجية');
  const m3 = insertM.run(l1.lastInsertRowid, 3, 180000, dayOffset(-5), 'مستخلص الأعمال الكهربائية'); // OVERDUE

  // L2: 1 cycle UPCOMING in 2 days
  const m4 = insertM.run(l2.lastInsertRowid, 1, 320000, dayOffset(2), 'مستخلص أعمال البنية التحتية'); // UPCOMING

  // L3: 2 cycles — 1 overdue partially collected, 1 upcoming
  const m5 = insertM.run(l3.lastInsertRowid, 1, 95000, dayOffset(-10), 'مستخلص أساسات الفيلات'); // OVERDUE partial
  const m6 = insertM.run(l3.lastInsertRowid, 2, 75000, dayOffset(1), 'مستخلص الطوب والبلاط'); // DUE TOMORROW

  // L4: 2 cycles fully collected
  const m7 = insertM.run(l4.lastInsertRowid, 1, 60000, dayOffset(-90), 'مستخلص الطرق');
  const m8 = insertM.run(l4.lastInsertRowid, 2, 40000, dayOffset(-45), 'مستخلص الصرف الصحي');

  // L5: 1 cycle — amount not set yet, 1 with future due date
  const m9 = insertM.run(l5.lastInsertRowid, 1, null, dayOffset(15), 'مستخلص التشطيبات الداخلية - لم يحدد المبلغ بعد');
  const m10 = insertM.run(l5.lastInsertRowid, 2, 110000, dayOffset(0), 'مستخلص الأعمال الكهربائية'); // DUE TODAY

  // --- Payments ---
  const insertP = db.prepare(`
    INSERT INTO payments (mostakhlas_id, amount, payment_date, notes, created_at)
    VALUES (?, ?, ?, ?, datetime('now'))
  `);

  // m1 fully collected: 150,000
  insertP.run(m1.lastInsertRowid, 100000, dayOffset(-55), 'دفعة أولى');
  insertP.run(m1.lastInsertRowid, 50000, dayOffset(-50), 'دفعة ثانية - تسوية كاملة');

  // m2 fully collected: 200,000
  insertP.run(m2.lastInsertRowid, 120000, dayOffset(-28), 'دفعة أولى');
  insertP.run(m2.lastInsertRowid, 80000, dayOffset(-20), 'باقي المبلغ');

  // m3 OVERDUE - partially collected: 180,000 expected, 70,000 collected → 110,000 remaining
  insertP.run(m3.lastInsertRowid, 70000, dayOffset(-3), 'دفعة جزئية');

  // m4 no payments yet (upcoming)

  // m5 OVERDUE - partially: 95,000 expected, 45,000 collected → 50,000 remaining
  insertP.run(m5.lastInsertRowid, 45000, dayOffset(-8), 'تحصيل جزئي');

  // m6 no payments (due tomorrow)

  // m7 fully collected
  insertP.run(m7.lastInsertRowid, 60000, dayOffset(-88), 'مبلغ كامل');

  // m8 fully collected
  insertP.run(m8.lastInsertRowid, 25000, dayOffset(-44), 'دفعة أولى');
  insertP.run(m8.lastInsertRowid, 15000, dayOffset(-40), 'دفعة أخيرة');

  // m9 no payments, no amount
  // m10 DUE TODAY - no payments yet
}
