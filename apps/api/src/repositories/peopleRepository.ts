import { normalizePhone } from "../lib/phone";

export const findPersonByPhone = async (db: D1Database, phone: string) => {
  const normalized = normalizePhone(phone);
  if (!normalized) {
    return null;
  }
  return db
    .prepare(
      `SELECT id, name, phone
       FROM people
       WHERE (
         phone IS NOT NULL
         AND REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(phone, ' ', ''), '-', ''), '(', ''), ')', ''), '+', '') = ?
       )
       OR (
         mobile IS NOT NULL
         AND REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(mobile, ' ', ''), '-', ''), '(', ''), ')', ''), '+', '') = ?
       )
       LIMIT 1`
    )
    .bind(normalized, normalized)
    .first<{ id: string; name: string; phone: string }>();
};

export const findPersonById = async (db: D1Database, id: string) =>
  db
    .prepare(
      `SELECT id, name, phone, mobile, cpf, email, rg, notes
       FROM people
       WHERE id = ?
       LIMIT 1`
    )
    .bind(id)
    .first<{
      id: string;
      name: string;
      phone: string | null;
      mobile: string | null;
      cpf: string | null;
      email: string | null;
      rg: string | null;
      notes: string | null;
    }>();

export const findPeopleByName = async (db: D1Database, name: string) => {
  const query = name.trim();
  if (!query) {
    return [];
  }
  const result = await db
    .prepare(
      `SELECT id, name, phone, mobile, cpf, email, rg
       FROM people
       WHERE name LIKE ?
       ORDER BY name
       LIMIT 5`
    )
    .bind(`%${query}%`)
    .all();

  return result.results.map((row) => ({
    id: row.id as string,
    name: row.name as string,
    phone: row.phone as string | null,
    mobile: row.mobile as string | null,
    cpf: row.cpf as string | null,
    email: row.email as string | null,
    rg: row.rg as string | null
  }));
};

export const listPeople = async (db: D1Database, search?: string) => {
  const filters: string[] = [];
  const params: Array<string> = [];

  if (search) {
    filters.push(
      "(p.name LIKE ? OR p.phone LIKE ? OR p.mobile LIKE ? OR p.cpf LIKE ? OR p.email LIKE ? OR p.rg LIKE ?)"
    );
    params.push(
      `%${search}%`,
      `%${search}%`,
      `%${search}%`,
      `%${search}%`,
      `%${search}%`,
      `%${search}%`
    );
  }

  const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

  const rows = await db
    .prepare(
      `SELECT
         p.id,
         p.name,
         p.phone,
         p.mobile,
         p.cpf,
         p.email,
         p.rg,
         p.notes,
         COUNT(DISTINCT hr.house_id) AS active_houses
       FROM people p
       LEFT JOIN house_responsibilities hr
         ON hr.person_id = p.id AND hr.end_at IS NULL
       ${whereClause}
       GROUP BY p.id
       ORDER BY p.name`
    )
    .bind(...params)
    .all();

  return rows.results.map((row) => ({
    id: row.id as string,
    name: row.name as string,
    phone: row.phone as string | null,
    mobile: row.mobile as string | null,
    cpf: row.cpf as string | null,
    email: row.email as string | null,
    rg: row.rg as string | null,
    notes: row.notes as string | null,
    active_houses: Number(row.active_houses ?? 0)
  }));
};

export const buildInsertPersonStatement = (
  db: D1Database,
  data: {
    id: string;
    name: string;
    phone: string | null;
    mobile: string | null;
    cpf: string | null;
    email: string | null;
    rg: string | null;
    notes: string | null;
  }
) =>
  db
    .prepare(
      "INSERT INTO people (id, name, phone, mobile, cpf, email, rg, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(
      data.id,
      data.name,
      data.phone,
      data.mobile,
      data.cpf,
      data.email,
      data.rg,
      data.notes
    );
