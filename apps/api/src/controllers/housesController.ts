import {
  assignResponsibleSchema,
  houseQuickSchema,
  houseUpdateSchema,
  housesQuerySchema
} from "../schemas/houses";
import {
  assignResponsible,
  deleteHouse,
  getHouseDetails,
  listHouses,
  listPendingHouses,
  quickCreateHouse,
  updateHouse
} from "../services/housesService";
import { ServiceError } from "../services/serviceError";
import type { AppHandler } from "../types";

export const listHousesHandler: AppHandler = async (c) => {
  const parsed = housesQuerySchema.safeParse(c.req.query());
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

  const search = parsed.data.search?.trim();

  try {
    const data = await listHouses(c.env.poco_db, {
      search,
      status: parsed.data.status,
      page,
      pageSize
    });
    return c.json({ ok: true, data });
  } catch (error) {
    return c.json(
      {
        ok: false,
        error: {
          message: "Database error while listing houses",
          details: error instanceof Error ? error.message : String(error)
        }
      },
      500
    );
  }
};

export const listPendingHousesHandler: AppHandler = async (c) => {
  try {
    const data = await listPendingHouses(c.env.poco_db);
    return c.json({ ok: true, data });
  } catch (error) {
    return c.json(
      {
        ok: false,
        error: {
          message: "Database error while loading pending houses",
          details: error instanceof Error ? error.message : String(error)
        }
      },
      500
    );
  }
};

export const getHouseHandler: AppHandler = async (c) => {
  const houseId = c.req.param("id").trim();
  if (!houseId) {
    return c.json(
      { ok: false, error: { message: "House id is required" } },
      400
    );
  }

  try {
    const data = await getHouseDetails(c.env.poco_db, houseId);
    return c.json({ ok: true, data });
  } catch (error) {
    if (error instanceof ServiceError) {
      return c.json({ ok: false, error: { message: error.message } }, error.status);
    }
    return c.json(
      {
        ok: false,
        error: {
          message: "Database error while loading house",
          details: error instanceof Error ? error.message : String(error)
        }
      },
      500
    );
  }
};

export const updateHouseHandler: AppHandler = async (c) => {
  const houseId = c.req.param("id").trim();
  if (!houseId) {
    return c.json(
      { ok: false, error: { message: "House id is required" } },
      400
    );
  }

  let payload: unknown;
  try {
    payload = await c.req.json();
  } catch {
    return c.json({ ok: false, error: { message: "Invalid JSON body" } }, 400);
  }

  const parsed = houseUpdateSchema.safeParse(payload);
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

  const update = parsed.data.house;
  if (Object.keys(update).length === 0) {
    return c.json(
      { ok: false, error: { message: "No fields provided for update" } },
      400
    );
  }

  try {
    const data = await updateHouse(c.env.poco_db, houseId, update);
    return c.json({ ok: true, data });
  } catch (error) {
    if (error instanceof ServiceError) {
      return c.json({ ok: false, error: { message: error.message } }, error.status);
    }
    return c.json(
      {
        ok: false,
        error: {
          message: "Database error while updating house",
          details: error instanceof Error ? error.message : String(error)
        }
      },
      500
    );
  }
};

export const deleteHouseHandler: AppHandler = async (c) => {
  const houseId = c.req.param("id").trim();
  if (!houseId) {
    return c.json(
      { ok: false, error: { message: "House id is required" } },
      400
    );
  }

  try {
    const data = await deleteHouse(c.env.poco_db, houseId);
    return c.json({ ok: true, data });
  } catch (error) {
    if (error instanceof ServiceError) {
      return c.json({ ok: false, error: { message: error.message } }, error.status);
    }
    return c.json(
      {
        ok: false,
        error: {
          message: "Database error while deleting house",
          details: error instanceof Error ? error.message : String(error)
        }
      },
      500
    );
  }
};

export const assignResponsibleHandler: AppHandler = async (c) => {
  const houseId = c.req.param("id").trim();
  if (!houseId) {
    return c.json(
      { ok: false, error: { message: "House id is required" } },
      400
    );
  }

  let payload: unknown;
  try {
    payload = await c.req.json();
  } catch {
    return c.json({ ok: false, error: { message: "Invalid JSON body" } }, 400);
  }

  const parsed = assignResponsibleSchema.safeParse(payload);
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
    const data = await assignResponsible(c.env.poco_db, houseId, parsed.data);
    return c.json({ ok: true, data });
  } catch (error) {
    if (error instanceof ServiceError) {
      return c.json({ ok: false, error: { message: error.message } }, error.status);
    }
    return c.json(
      {
        ok: false,
        error: {
          message: "Database error while assigning responsible",
          details: error instanceof Error ? error.message : String(error)
        }
      },
      500
    );
  }
};

export const quickCreateHouseHandler: AppHandler = async (c) => {
  let payload: unknown;
  try {
    payload = await c.req.json();
  } catch {
    return c.json({ ok: false, error: { message: "Invalid JSON body" } }, 400);
  }

  const parsed = houseQuickSchema.safeParse(payload);
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
    const data = await quickCreateHouse(
      c.env.poco_db,
      parsed.data,
      c.env.DEFAULT_AMOUNT_CENTS
    );
    return c.json({ ok: true, data });
  } catch (error) {
    if (error instanceof ServiceError) {
      return c.json({ ok: false, error: { message: error.message } }, error.status);
    }
    return c.json(
      {
        ok: false,
        error: {
          message: "Database error while creating house",
          details: error instanceof Error ? error.message : String(error)
        }
      },
      500
    );
  }
};
