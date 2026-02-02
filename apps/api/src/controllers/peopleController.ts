import { createPersonSchema, peopleQuerySchema } from "../schemas/people";
import { createPerson, listPeople } from "../services/peopleService";
import type { AppHandler } from "../types";

export const listPeopleHandler: AppHandler = async (c) => {
  const parsed = peopleQuerySchema.safeParse(c.req.query());
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

  const search = parsed.data.search?.trim();

  try {
    const items = await listPeople(c.env.poco_db, search);
    return c.json({ ok: true, data: { items } });
  } catch (error) {
    return c.json(
      {
        ok: false,
        error: {
          message: "Database error while listing people",
          details: error instanceof Error ? error.message : String(error)
        }
      },
      500
    );
  }
};

export const createPersonHandler: AppHandler = async (c) => {
  let payload: unknown;
  try {
    payload = await c.req.json();
  } catch {
    return c.json({ ok: false, error: { message: "Invalid JSON body" } }, 400);
  }

  const parsed = createPersonSchema.safeParse(payload);
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
    const data = await createPerson(c.env.poco_db, parsed.data);
    return c.json({ ok: true, data });
  } catch (error) {
    return c.json(
      {
        ok: false,
        error: {
          message: "Database error while creating person",
          details: error instanceof Error ? error.message : String(error)
        }
      },
      500
    );
  }
};
