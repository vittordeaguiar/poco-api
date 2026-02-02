export const insertWellEvent = async (
  db: D1Database,
  data: { id: string; type: string; happened_at: string; notes: string | null }
) =>
  db
    .prepare(
      `INSERT INTO well_events (id, type, happened_at, notes)
       VALUES (?, ?, ?, ?)`
    )
    .bind(data.id, data.type, data.happened_at, data.notes)
    .run();

export const countWellEvents = async (db: D1Database) =>
  db
    .prepare(`SELECT COUNT(*) AS total FROM well_events`)
    .first<{ total: number }>();

export const listWellEvents = async (
  db: D1Database,
  limit: number,
  offset: number
) =>
  db
    .prepare(
      `SELECT id, type, happened_at, notes, created_at
       FROM well_events
       ORDER BY happened_at DESC
       LIMIT ? OFFSET ?`
    )
    .bind(limit, offset)
    .all();
