import { wellEventCreateSchema, wellEventsQuerySchema } from "../schemas/wellEvents";
import {
  createWellEvent,
  listWellEvents
} from "../services/wellEventsService";
import type { AppHandler } from "../types";

export const createWellEventHandler: AppHandler = async (c) => {
  let payload: unknown;
  try {
    payload = await c.req.json();
  } catch {
    return c.json({ ok: false, error: { message: "Invalid JSON body" } }, 400);
  }

  const parsed = wellEventCreateSchema.safeParse(payload);
  if (!parsed.success) {
    return c.json(
      {
        ok: false,
        error: {
          message: "Invalid request body",
          details: parsed.error.flatten()
        }
      },
      400
    );
  }

  try {
    const data = await createWellEvent(c.env.poco_db, parsed.data);
    return c.json({ ok: true, data }, 201);
  } catch (error) {
    return c.json(
      {
        ok: false,
        error: {
          message: "Database error while creating well event",
          details: error instanceof Error ? error.message : String(error)
        }
      },
      500
    );
  }
};

export const listWellEventsHandler: AppHandler = async (c) => {
  const parsed = wellEventsQuerySchema.safeParse(c.req.query());
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

  const page = parsed.data.page ?? 1;
  const pageSizeRaw = parsed.data.pageSize ?? 20;
  const pageSize = Math.min(pageSizeRaw, 100);

  try {
    const data = await listWellEvents(c.env.poco_db, { page, pageSize });
    return c.json({ ok: true, data });
  } catch (error) {
    return c.json(
      {
        ok: false,
        error: {
          message: "Database error while listing well events",
          details: error instanceof Error ? error.message : String(error)
        }
      },
      500
    );
  }
};
