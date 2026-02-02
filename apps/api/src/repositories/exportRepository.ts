export const fetchHousesExport = async (db: D1Database) =>
  db
    .prepare(
      `SELECT
         h.id,
         h.street,
         h.house_number,
         h.complement,
         h.cep,
         h.reference,
         h.monthly_amount_cents,
         h.status,
         h.notes,
         h.created_at,
         h.updated_at,
         p.name AS responsible_name,
         p.phone AS responsible_phone
       FROM houses h
       LEFT JOIN house_responsibilities hr
         ON hr.house_id = h.id AND hr.end_at IS NULL
       LEFT JOIN people p ON p.id = hr.person_id
       ORDER BY h.created_at DESC`
    )
    .all();

export const fetchInvoicesExport = async (
  db: D1Database,
  year: number,
  month: number
) =>
  db
    .prepare(
      `SELECT
         i.id,
         i.house_id,
         i.year,
         i.month,
         i.amount_cents,
         i.status,
         i.due_date,
         i.paid_at,
         i.notes,
         i.created_at,
         i.updated_at,
         h.street,
         h.house_number,
         h.cep,
         h.reference
       FROM invoices i
       JOIN houses h ON h.id = i.house_id
       WHERE i.year = ? AND i.month = ?
       ORDER BY h.street, h.house_number`
    )
    .bind(year, month)
    .all();

export const fetchPaymentsExport = async (
  db: D1Database,
  from: string,
  to: string
) =>
  db
    .prepare(
      `SELECT
         p.id,
         p.house_id,
         p.invoice_id,
         p.amount_cents,
         p.method,
         p.paid_at,
         p.notes,
         p.created_at,
         i.year,
         i.month,
         h.street,
         h.house_number
       FROM payments p
       LEFT JOIN invoices i ON i.id = p.invoice_id
       LEFT JOIN houses h ON h.id = p.house_id
       WHERE p.paid_at >= ? AND p.paid_at <= ?
       ORDER BY p.paid_at DESC`
    )
    .bind(from, to)
    .all();

export const fetchLateExport = async (db: D1Database, asOfKey: number) =>
  db
    .prepare(
      `SELECT
         h.id AS house_id,
         h.street,
         h.house_number,
         h.cep,
         h.reference,
         h.status,
         p.name AS responsible_name,
         p.phone AS responsible_phone,
         i.id AS invoice_id,
         i.year,
         i.month,
         i.amount_cents,
         i.due_date,
         i.status AS invoice_status
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
