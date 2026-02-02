import { dashboardQuerySchema } from "../schemas/dashboard";
import { getDashboard } from "../services/dashboardService";
import type { AppHandler } from "../types";

export const dashboardHandler: AppHandler = async (c) => {
  const parsed = dashboardQuerySchema.safeParse(c.req.query());
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

  try {
    const data = await getDashboard(c.env.poco_db, parsed.data);
    return c.json({ ok: true, data });
  } catch (error) {
    return c.json(
      {
        ok: false,
        error: {
          message: "Database error while loading dashboard",
          details: error instanceof Error ? error.message : String(error)
        }
      },
      500
    );
  }
};
