import { createPersonSchema, peopleQuerySchema, updatePersonSchema } from "../schemas/people";
import { createPerson, listPeople, updatePerson } from "../services/peopleService";
import { ServiceError } from "../services/serviceError";
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

export const updatePersonHandler: AppHandler = async (c) => {
  const personId = c.req.param("id").trim();
  if (!personId) {
    return c.json(
      { ok: false, error: { message: "Person id is required" } },
      400
    );
  }

  let payload: unknown;
  try {
    payload = await c.req.json();
  } catch {
    return c.json({ ok: false, error: { message: "Invalid JSON body" } }, 400);
  }

  const parsed = updatePersonSchema.safeParse(payload);
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

  if (Object.keys(parsed.data).length === 0) {
    return c.json(
      { ok: false, error: { message: "No fields provided for update" } },
      400
    );
  }

  try {
    const data = await updatePerson(c.env.poco_db, personId, parsed.data);
    return c.json({ ok: true, data });
  } catch (error) {
    if (error instanceof ServiceError) {
      return c.json({ ok: false, error: { message: error.message } }, error.status);
    }
    return c.json(
      {
        ok: false,
        error: {
          message: "Database error while updating person",
          details: error instanceof Error ? error.message : String(error)
        }
      },
      500
    );
  }
};
