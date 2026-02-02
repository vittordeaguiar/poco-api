export const createAuditStatement = (
  db: D1Database,
  action: string,
  entity: string,
  entityId: string,
  summary: Record<string, unknown>
) => {
  const summaryJson = JSON.stringify(summary ?? {});
  return db
    .prepare(
      "INSERT INTO audit_log (id, action, entity, entity_id, summary_json) VALUES (?, ?, ?, ?, ?)"
    )
    .bind(crypto.randomUUID(), action, entity, entityId, summaryJson);
};
