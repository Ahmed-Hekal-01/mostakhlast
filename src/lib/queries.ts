import { getDb } from './db';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Company {
  id: number;
  name: string;
  contact_person: string | null;
  phone: string | null;
  notes: string | null;
  created_at: string;
  total_debt?: number;
  location_count?: number;
}

export interface Location {
  id: number;
  company_id: number;
  name: string;
  scope_description: string | null;
  status: string;
  created_at: string;
  company_name?: string;
  total_remaining?: number;
  mostakhlasat_count?: number;
  latest_status?: string;
}

export interface Mostakhlas {
  id: number;
  location_id: number;
  sequence_number: number;
  expected_amount: number | null;
  due_date: string;
  notes: string | null;
  created_at: string;
  location_name?: string;
  company_name?: string;
  company_id?: number;
  collected?: number;
  remaining?: number;
  status?: string;
}

export interface Payment {
  id: number;
  mostakhlas_id: number;
  amount: number;
  payment_date: string;
  notes: string | null;
  created_at: string;
}

// ─── Status computation ────────────────────────────────────────────────────────

export function computeStatus(m: {
  expected_amount: number | null;
  due_date: string;
  collected: number;
}): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(m.due_date + 'T00:00:00');
  const diffDays = Math.floor((due.getTime() - today.getTime()) / 86400000);

  if (m.expected_amount === null) return 'لم يحدد المبلغ بعد';
  if (m.collected >= m.expected_amount) return 'محصل بالكامل';
  if (diffDays < 0) return 'متأخر';
  if (diffDays === 0) return 'مستحق اليوم';
  if (diffDays <= 2) return 'قادم';
  return 'قادم';
}

// ─── Companies ────────────────────────────────────────────────────────────────

export function getAllCompanies(): Company[] {
  const db = getDb();
  return db.prepare(`
    SELECT
      c.*,
      COUNT(DISTINCT l.id) AS location_count,
      COALESCE(SUM(
        CASE
          WHEN m.expected_amount IS NOT NULL
          THEN m.expected_amount - COALESCE((
            SELECT SUM(p.amount) FROM payments p WHERE p.mostakhlas_id = m.id
          ), 0)
          ELSE 0
        END
      ), 0) AS total_debt
    FROM companies c
    LEFT JOIN locations l ON l.company_id = c.id
    LEFT JOIN mostakhlasat m ON m.location_id = l.id
    GROUP BY c.id
    ORDER BY total_debt DESC
  `).all() as Company[];
}

export function getCompanyById(id: number): Company | null {
  const db = getDb();
  const company = db.prepare(`
    SELECT
      c.*,
      COUNT(DISTINCT l.id) AS location_count,
      COALESCE(SUM(
        CASE
          WHEN m.expected_amount IS NOT NULL
          THEN m.expected_amount - COALESCE((
            SELECT SUM(p.amount) FROM payments p WHERE p.mostakhlas_id = m.id
          ), 0)
          ELSE 0
        END
      ), 0) AS total_debt
    FROM companies c
    LEFT JOIN locations l ON l.company_id = c.id
    LEFT JOIN mostakhlasat m ON m.location_id = l.id
    WHERE c.id = ?
    GROUP BY c.id
  `).get(id) as Company | null;
  return company;
}

export function createCompany(data: { name: string; contact_person?: string; phone?: string; notes?: string }): number {
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO companies (name, contact_person, phone, notes)
    VALUES (?, ?, ?, ?)
  `).run(data.name, data.contact_person || null, data.phone || null, data.notes || null);
  return result.lastInsertRowid as number;
}

export function updateCompany(id: number, data: { name: string; contact_person?: string; phone?: string; notes?: string }) {
  const db = getDb();
  db.prepare(`
    UPDATE companies SET name = ?, contact_person = ?, phone = ?, notes = ?
    WHERE id = ?
  `).run(data.name, data.contact_person || null, data.phone || null, data.notes || null, id);
}

export function deleteCompany(id: number) {
  const db = getDb();
  db.prepare('DELETE FROM companies WHERE id = ?').run(id);
}

// ─── Locations ────────────────────────────────────────────────────────────────

export function getLocationsByCompany(companyId: number): Location[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT
      l.*,
      c.name AS company_name,
      COUNT(DISTINCT m.id) AS mostakhlasat_count,
      COALESCE(SUM(
        CASE
          WHEN m.expected_amount IS NOT NULL
          THEN m.expected_amount - COALESCE((
            SELECT SUM(p.amount) FROM payments p WHERE p.mostakhlas_id = m.id
          ), 0)
          ELSE 0
        END
      ), 0) AS total_remaining
    FROM locations l
    JOIN companies c ON c.id = l.company_id
    LEFT JOIN mostakhlasat m ON m.location_id = l.id
    WHERE l.company_id = ?
    GROUP BY l.id
    ORDER BY l.created_at DESC
  `).all(companyId) as Location[];

  // Add latest_status
  return rows.map(loc => {
    const latest = db.prepare(`
      SELECT m.expected_amount, m.due_date,
        COALESCE((SELECT SUM(p.amount) FROM payments p WHERE p.mostakhlas_id = m.id), 0) AS collected
      FROM mostakhlasat m
      WHERE m.location_id = ?
      ORDER BY m.sequence_number DESC
      LIMIT 1
    `).get(loc.id) as { expected_amount: number | null; due_date: string; collected: number } | null;

    return {
      ...loc,
      latest_status: latest ? computeStatus(latest) : undefined,
    };
  });
}

export function getLocationById(id: number): Location | null {
  const db = getDb();
  const loc = db.prepare(`
    SELECT
      l.*,
      c.name AS company_name,
      COALESCE(SUM(
        CASE
          WHEN m.expected_amount IS NOT NULL
          THEN m.expected_amount - COALESCE((
            SELECT SUM(p.amount) FROM payments p WHERE p.mostakhlas_id = m.id
          ), 0)
          ELSE 0
        END
      ), 0) AS total_remaining
    FROM locations l
    JOIN companies c ON c.id = l.company_id
    LEFT JOIN mostakhlasat m ON m.location_id = l.id
    WHERE l.id = ?
    GROUP BY l.id
  `).get(id) as Location | null;
  return loc;
}

export function createLocation(data: {
  company_id: number;
  name: string;
  scope_description?: string;
  status?: string;
}): number {
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO locations (company_id, name, scope_description, status)
    VALUES (?, ?, ?, ?)
  `).run(data.company_id, data.name, data.scope_description || null, data.status || 'نشط');
  return result.lastInsertRowid as number;
}

export function updateLocation(id: number, data: { name: string; scope_description?: string; status?: string }) {
  const db = getDb();
  db.prepare(`
    UPDATE locations SET name = ?, scope_description = ?, status = ?
    WHERE id = ?
  `).run(data.name, data.scope_description || null, data.status || 'نشط', id);
}

// ─── Mostakhlasat ─────────────────────────────────────────────────────────────

export function getMostakhlasat(locationId: number): Mostakhlas[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT
      m.*,
      l.name AS location_name,
      c.name AS company_name,
      c.id AS company_id,
      COALESCE((SELECT SUM(p.amount) FROM payments p WHERE p.mostakhlas_id = m.id), 0) AS collected
    FROM mostakhlasat m
    JOIN locations l ON l.id = m.location_id
    JOIN companies c ON c.id = l.company_id
    WHERE m.location_id = ?
    ORDER BY m.sequence_number DESC
  `).all(locationId) as (Mostakhlas & { collected: number })[];

  return rows.map(m => ({
    ...m,
    remaining: m.expected_amount !== null ? m.expected_amount - m.collected : undefined,
    status: computeStatus({ expected_amount: m.expected_amount, due_date: m.due_date, collected: m.collected }),
  }));
}

export function getMostakhlasByIdRaw(id: number): Mostakhlas | null {
  const db = getDb();
  const m = db.prepare(`
    SELECT
      m.*,
      l.name AS location_name,
      l.company_id AS company_id,
      c.name AS company_name,
      COALESCE((SELECT SUM(p.amount) FROM payments p WHERE p.mostakhlas_id = m.id), 0) AS collected
    FROM mostakhlasat m
    JOIN locations l ON l.id = m.location_id
    JOIN companies c ON c.id = l.company_id
    WHERE m.id = ?
  `).get(id) as (Mostakhlas & { collected: number }) | null;

  if (!m) return null;
  return {
    ...m,
    remaining: m.expected_amount !== null ? m.expected_amount - m.collected : undefined,
    status: computeStatus({ expected_amount: m.expected_amount, due_date: m.due_date, collected: m.collected }),
  };
}

export function getNextSequenceNumber(locationId: number): number {
  const db = getDb();
  const result = db.prepare(`
    SELECT COALESCE(MAX(sequence_number), 0) + 1 AS next_seq
    FROM mostakhlasat WHERE location_id = ?
  `).get(locationId) as { next_seq: number };
  return result.next_seq;
}

export function createMostakhlas(data: {
  location_id: number;
  expected_amount?: number | null;
  due_date: string;
  notes?: string;
}): number {
  const db = getDb();
  const seqNum = getNextSequenceNumber(data.location_id);
  const result = db.prepare(`
    INSERT INTO mostakhlasat (location_id, sequence_number, expected_amount, due_date, notes)
    VALUES (?, ?, ?, ?, ?)
  `).run(data.location_id, seqNum, data.expected_amount ?? null, data.due_date, data.notes || null);
  return result.lastInsertRowid as number;
}

export function updateMostakhlas(id: number, data: { expected_amount?: number | null; due_date?: string; notes?: string }) {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM mostakhlasat WHERE id = ?').get(id) as Mostakhlas;
  db.prepare(`
    UPDATE mostakhlasat SET expected_amount = ?, due_date = ?, notes = ?
    WHERE id = ?
  `).run(
    data.expected_amount !== undefined ? data.expected_amount : existing.expected_amount,
    data.due_date || existing.due_date,
    data.notes !== undefined ? data.notes : existing.notes,
    id
  );
}

// ─── Payments ─────────────────────────────────────────────────────────────────

export function getPaymentsByMostakhlas(mostakhlasId: number): Payment[] {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM payments
    WHERE mostakhlas_id = ?
    ORDER BY payment_date ASC, created_at ASC
  `).all(mostakhlasId) as Payment[];
}

export function createPayment(data: { mostakhlas_id: number; amount: number; payment_date: string; notes?: string }): number {
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO payments (mostakhlas_id, amount, payment_date, notes)
    VALUES (?, ?, ?, ?)
  `).run(data.mostakhlas_id, data.amount, data.payment_date, data.notes || null);
  return result.lastInsertRowid as number;
}

export function deletePayment(id: number) {
  const db = getDb();
  db.prepare('DELETE FROM payments WHERE id = ?').run(id);
}

// ─── Dashboard / Alerts ───────────────────────────────────────────────────────

export interface AlertItem {
  mostakhlas_id: number;
  sequence_number: number;
  location_name: string;
  company_name: string;
  company_id: number;
  location_id: number;
  due_date: string;
  expected_amount: number | null;
  collected: number;
  remaining: number;
  alert_type: 'overdue' | 'due_today' | 'upcoming';
}

export function getAlerts(): AlertItem[] {
  const db = getDb();

  const rows = db.prepare(`
    SELECT
      m.id AS mostakhlas_id,
      m.sequence_number,
      m.due_date,
      m.expected_amount,
      l.id AS location_id,
      l.name AS location_name,
      c.id AS company_id,
      c.name AS company_name,
      COALESCE((SELECT SUM(p.amount) FROM payments p WHERE p.mostakhlas_id = m.id), 0) AS collected
    FROM mostakhlasat m
    JOIN locations l ON l.id = m.location_id
    JOIN companies c ON c.id = l.company_id
    WHERE m.expected_amount IS NOT NULL
    ORDER BY m.due_date ASC
  `).all() as (Omit<AlertItem, 'remaining' | 'alert_type'> & { collected: number })[];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const alerts: AlertItem[] = [];

  for (const row of rows) {
    const remaining = row.expected_amount! - row.collected;
    if (remaining <= 0) continue; // fully collected

    const due = new Date(row.due_date + 'T00:00:00');
    const diffDays = Math.floor((due.getTime() - today.getTime()) / 86400000);

    let alert_type: AlertItem['alert_type'] | null = null;
    if (diffDays < 0) alert_type = 'overdue';
    else if (diffDays === 0) alert_type = 'due_today';
    else if (diffDays <= 2) alert_type = 'upcoming';

    if (alert_type) {
      alerts.push({ ...row, remaining, alert_type });
    }
  }

  // Sort: overdue first, then due_today, then upcoming
  const order = { overdue: 0, due_today: 1, upcoming: 2 };
  alerts.sort((a, b) => order[a.alert_type] - order[b.alert_type]);

  return alerts;
}

export interface DashboardStats {
  total_debt: number;
  company_count: number;
  active_location_count: number;
}

export function getDashboardStats(): DashboardStats {
  const db = getDb();
  const result = db.prepare(`
    SELECT
      COALESCE(SUM(
        CASE
          WHEN m.expected_amount IS NOT NULL
          THEN m.expected_amount - COALESCE((SELECT SUM(p.amount) FROM payments p WHERE p.mostakhlas_id = m.id), 0)
          ELSE 0
        END
      ), 0) AS total_debt,
      (SELECT COUNT(*) FROM companies) AS company_count,
      (SELECT COUNT(*) FROM locations WHERE status = 'نشط') AS active_location_count
    FROM mostakhlasat m
  `).get() as DashboardStats;
  return result;
}
