export const countHouses = async (
  db: D1Database,
  whereClause: string,
  bindings: unknown[]
) =>
  db
    .prepare(
      `SELECT COUNT(DISTINCT h.id) AS total
       FROM houses h
       LEFT JOIN house_responsibilities hr
         ON hr.house_id = h.id AND hr.end_at IS NULL
       LEFT JOIN people p ON p.id = hr.person_id
       ${whereClause}`
    )
    .bind(...bindings)
    .first<{ total: number }>();

export const listHouses = async (
  db: D1Database,
  whereClause: string,
  bindings: unknown[],
  limit: number,
  offset: number
) =>
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
         p.id AS responsible_id,
         p.name AS responsible_name,
         p.phone AS responsible_phone
       FROM houses h
       LEFT JOIN house_responsibilities hr
         ON hr.house_id = h.id AND hr.end_at IS NULL
       LEFT JOIN people p ON p.id = hr.person_id
       ${whereClause}
       ORDER BY h.created_at DESC
       LIMIT ? OFFSET ?`
    )
    .bind(...bindings, limit, offset)
    .all();

export const listPendingHouses = async (db: D1Database) =>
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
         p.id AS responsible_id,
         p.name AS responsible_name,
         p.phone AS responsible_phone
       FROM houses h
       LEFT JOIN house_responsibilities hr
         ON hr.house_id = h.id AND hr.end_at IS NULL
       LEFT JOIN people p ON p.id = hr.person_id
       WHERE (h.street IS NULL OR TRIM(h.street) = '')
          OR (h.house_number IS NULL OR TRIM(h.house_number) = '')
          OR hr.id IS NULL
       ORDER BY h.created_at DESC`
    )
    .all();

export const getHouse = async (db: D1Database, houseId: string) =>
  db
    .prepare(
      `SELECT
         id,
         street,
         house_number,
         complement,
         cep,
         reference,
         monthly_amount_cents,
         status,
         notes,
         created_at,
         updated_at
       FROM houses
       WHERE id = ?`
    )
    .bind(houseId)
    .first();

export const getHouseForUpdate = async (db: D1Database, houseId: string) =>
  db
    .prepare(
      `SELECT
         street,
         house_number,
         complement,
         cep,
         reference,
         monthly_amount_cents,
         status,
         notes
       FROM houses
       WHERE id = ?`
    )
    .bind(houseId)
    .first<{
      street: string | null;
      house_number: string | null;
      complement: string | null;
      cep: string | null;
      reference: string | null;
      monthly_amount_cents: number;
      status: "active" | "inactive" | "pending";
      notes: string | null;
    }>();

export const getHouseForDelete = async (db: D1Database, houseId: string) =>
  db
    .prepare(
      `SELECT
         id,
         street,
         house_number,
         status,
         monthly_amount_cents
       FROM houses
       WHERE id = ?`
    )
    .bind(houseId)
    .first<{
      id: string;
      street: string | null;
      house_number: string | null;
      status: string;
      monthly_amount_cents: number;
    }>();

export const getCurrentResponsible = async (db: D1Database, houseId: string) =>
  db
    .prepare(
      `SELECT
         p.id,
         p.name,
         p.phone,
         hr.start_at
       FROM house_responsibilities hr
       JOIN people p ON p.id = hr.person_id
       WHERE hr.house_id = ? AND hr.end_at IS NULL
       ORDER BY hr.start_at DESC
       LIMIT 1`
    )
    .bind(houseId)
    .first();

export const listResponsibilityHistory = async (
  db: D1Database,
  houseId: string
) =>
  db
    .prepare(
      `SELECT
         hr.id,
         hr.house_id,
         hr.person_id,
         hr.start_at,
         hr.end_at,
         hr.reason,
         p.name,
         p.phone
       FROM house_responsibilities hr
       JOIN people p ON p.id = hr.person_id
       WHERE hr.house_id = ?
       ORDER BY hr.start_at DESC`
    )
    .bind(houseId)
    .all();

export const listHouseInvoices = async (db: D1Database, houseId: string) =>
  db
    .prepare(
      `SELECT
         id,
         house_id,
         year,
         month,
         amount_cents,
         status,
         due_date,
         paid_at,
         notes,
         created_at,
         updated_at
       FROM invoices
       WHERE house_id = ?
       ORDER BY year DESC, month DESC
       LIMIT 12`
    )
    .bind(houseId)
    .all();

export const houseExists = async (db: D1Database, houseId: string) =>
  db
    .prepare("SELECT id FROM houses WHERE id = ?")
    .bind(houseId)
    .first<{ id: string }>();

export const buildUpdateHouseStatement = (
  db: D1Database,
  data: {
    id: string;
    street: string | null;
    house_number: string | null;
    complement: string | null;
    cep: string | null;
    reference: string | null;
    monthly_amount_cents: number;
    status: string;
    notes: string | null;
    updated_at: string;
  }
) =>
  db
    .prepare(
      `UPDATE houses
       SET street = ?,
           house_number = ?,
           complement = ?,
           cep = ?,
           reference = ?,
           monthly_amount_cents = ?,
           status = ?,
           notes = ?,
           updated_at = ?
       WHERE id = ?`
    )
    .bind(
      data.street,
      data.house_number,
      data.complement,
      data.cep,
      data.reference,
      data.monthly_amount_cents,
      data.status,
      data.notes,
      data.updated_at,
      data.id
    );

export const buildDeleteHouseStatements = (db: D1Database, houseId: string) => [
  db.prepare("DELETE FROM payments WHERE house_id = ?").bind(houseId),
  db.prepare("DELETE FROM invoices WHERE house_id = ?").bind(houseId),
  db.prepare("DELETE FROM house_responsibilities WHERE house_id = ?").bind(houseId),
  db.prepare("DELETE FROM houses WHERE id = ?").bind(houseId)
];

export const buildInsertHouseStatement = (
  db: D1Database,
  data: {
    id: string;
    street: string | null;
    house_number: string | null;
    cep: string | null;
    reference: string | null;
    complement: string | null;
    monthly_amount_cents: number;
    status: string;
  }
) =>
  db
    .prepare(
      "INSERT INTO houses (id, street, house_number, cep, reference, complement, monthly_amount_cents, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(
      data.id,
      data.street,
      data.house_number,
      data.cep,
      data.reference,
      data.complement,
      data.monthly_amount_cents,
      data.status
    );

export const buildCloseResponsibilitiesStatement = (
  db: D1Database,
  houseId: string,
  now: string
) =>
  db
    .prepare(
      "UPDATE house_responsibilities SET end_at = ? WHERE house_id = ? AND end_at IS NULL"
    )
    .bind(now, houseId);

export const buildInsertResponsibilityStatement = (
  db: D1Database,
  data: {
    id: string;
    house_id: string;
    person_id: string | null;
    start_at: string;
  }
) =>
  db
    .prepare(
      "INSERT INTO house_responsibilities (id, house_id, person_id, start_at, end_at) VALUES (?, ?, ?, ?, NULL)"
    )
    .bind(data.id, data.house_id, data.person_id, data.start_at);
