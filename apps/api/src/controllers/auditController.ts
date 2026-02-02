import { auditQuerySchema } from "../schemas/audit";
import { listAudit } from "../services/auditService";
import type { AppHandler } from "../types";

export const listAuditHandler: AppHandler = async (c) => {
  const parsed = auditQuerySchema.safeParse(c.req.query());
  if (!parsed.success) {
    return c.json(
      {
        ok: false,
        error: {
          message: "Invalid query parameters",
          details: parsed.error.flatten()
        }
      },
      400
    );
  }

  const limitRaw = parsed.data.limit ?? 50;
  const limit = Math.min(limitRaw, 200);

  try {
    const items = await listAudit(c.env.poco_db, limit);
    return c.json({ ok: true, data: { items } });
  } catch (error) {
    return c.json(
      {
        ok: false,
        error: {
          message: "Database error while loading audit log",
          details: error instanceof Error ? error.message : String(error)
        }
      },
      500
    );
  }
};
