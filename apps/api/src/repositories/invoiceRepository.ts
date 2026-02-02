export const countEligibleHouses = async (
  db: D1Database,
  statuses: string[]
) =>
  db
    .prepare(
      `SELECT COUNT(*) AS total
       FROM houses
       WHERE status IN (${statuses.map(() => "?").join(", ")})`
    )
    .bind(...statuses)
    .first<{ total: number }>();

export const countExistingInvoices = async (
  db: D1Database,
  year: number,
  month: number,
  statuses: string[]
) =>
  db
    .prepare(
      `SELECT COUNT(*) AS total
       FROM invoices i
       JOIN houses h ON h.id = i.house_id
       WHERE i.year = ? AND i.month = ?
         AND h.status IN (${statuses.map(() => "?").join(", ")})`
    )
    .bind(year, month, ...statuses)
    .first<{ total: number }>();

export const insertInvoicesForMonth = async (
  db: D1Database,
  year: number,
  month: number,
  statuses: string[]
) =>
  db
    .prepare(
      `INSERT OR IGNORE INTO invoices (
         id,
         house_id,
         year,
         month,
         amount_cents,
         status,
         created_at,
         updated_at
       )
       SELECT
         lower(hex(randomblob(16))),
         h.id,
         ?,
         ?,
         h.monthly_amount_cents,
         'open',
         strftime('%Y-%m-%dT%H:%M:%SZ', 'now'),
         strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
       FROM houses h
       WHERE h.status IN (${statuses.map(() => "?").join(", ")})`
    )
    .bind(year, month, ...statuses)
    .run();

export const countInvoicesAfter = async (
  db: D1Database,
  year: number,
  month: number,
  statuses: string[]
) =>
  db
    .prepare(
      `SELECT COUNT(*) AS total
       FROM invoices i
       JOIN houses h ON h.id = i.house_id
       WHERE i.year = ? AND i.month = ?
         AND h.status IN (${statuses.map(() => "?").join(", ")})`
    )
    .bind(year, month, ...statuses)
    .first<{ total: number }>();

export const getInvoiceById = async (db: D1Database, invoiceId: string) =>
  db
    .prepare(
      `SELECT id, house_id, status
       FROM invoices
       WHERE id = ?`
    )
    .bind(invoiceId)
    .first<{ id: string; house_id: string; status: string }>();

export const buildInsertPaymentStatement = (
  db: D1Database,
  data: {
    id: string;
    invoice_id: string;
    method: string;
    paid_at: string;
    notes: string | null;
  }
) =>
  db
    .prepare(
      `INSERT INTO payments (
         id,
         house_id,
         invoice_id,
         amount_cents,
         method,
         paid_at,
         notes
       )
       SELECT
         ?,
         house_id,
         id,
         amount_cents,
         ?,
         ?,
         ?
       FROM invoices
       WHERE id = ?`
    )
    .bind(data.id, data.method, data.paid_at, data.notes, data.invoice_id);

export const buildMarkInvoicePaidStatement = (
  db: D1Database,
  invoiceId: string,
  paidAtValue: string
) =>
  db
    .prepare(
      `UPDATE invoices
       SET status = 'paid',
           paid_at = ?,
           updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
       WHERE id = ? AND status = 'open'`
    )
    .bind(paidAtValue, invoiceId);

export const getInvoiceStatus = async (db: D1Database, invoiceId: string) =>
  db
    .prepare(`SELECT status FROM invoices WHERE id = ?`)
    .bind(invoiceId)
    .first<{ status: string }>();

export const sumReceived = async (db: D1Database, year: number, month: number) =>
  db
    .prepare(
      `SELECT COALESCE(SUM(p.amount_cents), 0) AS received_cents
       FROM payments p
       JOIN invoices i ON i.id = p.invoice_id
       WHERE i.year = ? AND i.month = ?`
    )
    .bind(year, month)
    .first<{ received_cents: number }>();

export const sumOpen = async (db: D1Database, year: number, month: number) =>
  db
    .prepare(
      `SELECT COALESCE(SUM(amount_cents), 0) AS open_cents
       FROM invoices
       WHERE year = ? AND month = ? AND status = 'open'`
    )
    .bind(year, month)
    .first<{ open_cents: number }>();

export const countLateHouses = async (db: D1Database, asOfKey: number) =>
  db
    .prepare(
      `SELECT COUNT(DISTINCT house_id) AS houses_late_count
       FROM invoices
       WHERE status = 'open' AND (year * 12 + month) < ?`
    )
    .bind(asOfKey)
    .first<{ houses_late_count: number }>();

export const fetchLateRows = async (db: D1Database, asOfKey: number) =>
  db
    .prepare(
      `SELECT
         h.id AS house_id,
         h.street,
         h.house_number,
         h.complement,
         h.cep,
         h.reference,
         h.status,
         p.id AS responsible_id,
         p.name AS responsible_name,
         p.phone AS responsible_phone,
         i.id AS invoice_id,
         i.year,
         i.month,
         i.amount_cents,
         i.status AS invoice_status,
         i.due_date
       FROM invoices i
       JOIN houses h ON h.id = i.house_id
       LEFT JOIN house_responsibilities hr
         ON hr.house_id = h.id AND hr.end_at IS NULL
       LEFT JOIN people p ON p.id = hr.person_id
       WHERE i.status = 'open'
         AND (i.year * 12 + i.month) < ?
       ORDER BY h.id, i.year DESC, i.month DESC`
    )
    .bind(asOfKey)
    .all();
