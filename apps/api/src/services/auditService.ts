import { listAuditEntries } from "../repositories/auditRepository";

export const listAudit = async (db: D1Database, limit: number) =>
  listAuditEntries(db, limit);
