export const listAuditEntries = async (db: D1Database, limit: number) => {
  const rows = await db
    .prepare(
      `SELECT id, action, entity, entity_id, summary_json, created_at
       FROM audit_log
       ORDER BY created_at DESC
       LIMIT ?`
    )
    .bind(limit)
    .all();

  return rows.results.map((row) => {
    let summary: unknown = row.summary_json;
    try {
      summary = JSON.parse(row.summary_json as string);
    } catch {
      summary = row.summary_json;
    }

    return {
      id: row.id,
      action: row.action,
      entity: row.entity,
      entity_id: row.entity_id,
      summary,
      created_at: row.created_at
    };
  });
};
