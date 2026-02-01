import { Hono } from "hono";
import type { MiddlewareHandler } from "hono";
import { z } from "zod";

type Env = {
  poco_db: D1Database;
  API_KEY?: string;
  DEFAULT_AMOUNT_CENTS?: string;
};

const app = new Hono<{ Bindings: Env }>();

const authGuard: MiddlewareHandler<{ Bindings: Env }> = async (c, next) => {
  const apiKey = c.env.API_KEY?.trim();
  if (!apiKey) {
    return c.json(
      { ok: false, error: { message: "API_KEY not configured" } },
      500
    );
  }

  const authHeader = c.req.header("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token || token !== apiKey) {
    return c.json(
      { ok: false, error: { message: "Unauthorized" } },
      401
    );
  }

  await next();
};

const houseQuickSchema = z
  .object({
    house: z
      .object({
        street: z.string().trim().min(1).optional(),
        house_number: z.string().trim().min(1).optional(),
        cep: z.string().trim().min(1).optional(),
        reference: z.string().trim().min(1).optional(),
        complement: z.string().trim().min(1).optional(),
        monthly_amount_cents: z.number().int().positive().optional()
      })
      .default({}),
    responsible: z
      .object({
        name: z.string().trim().min(1),
        phone: z.string().trim().min(1).optional()
      })
      .optional()
  })
  .strict();

const housesQuerySchema = z
  .object({
    search: z.string().trim().min(1).optional(),
    status: z.enum(["active", "inactive", "pending"]).optional(),
    page: z
      .string()
      .transform((value) => Number.parseInt(value, 10))
      .refine((value) => Number.isFinite(value) && value >= 1, {
        message: "page must be >= 1"
      })
      .optional(),
    pageSize: z
      .string()
      .transform((value) => Number.parseInt(value, 10))
      .refine((value) => Number.isFinite(value) && value >= 1, {
        message: "pageSize must be >= 1"
      })
      .optional()
  })
  .strict();

const generateInvoicesSchema = z
  .object({
    year: z.number().int().min(2000),
    month: z.number().int().min(1).max(12),
    include_pending: z.boolean().optional()
  })
  .strict();

const payInvoiceSchema = z
  .object({
    method: z.enum(["cash", "pix", "transfer", "other"]),
    paid_at: z.string().trim().min(1).optional(),
    notes: z.string().trim().min(1).optional()
  })
  .strict();

const dashboardQuerySchema = z
  .object({
    year: z
      .string()
      .transform((value) => Number.parseInt(value, 10))
      .refine((value) => Number.isFinite(value) && value >= 2000, {
        message: "year must be >= 2000"
      }),
    month: z
      .string()
      .transform((value) => Number.parseInt(value, 10))
      .refine((value) => Number.isFinite(value) && value >= 1 && value <= 12, {
        message: "month must be between 1 and 12"
      })
  })
  .strict();

const lateQuerySchema = z
  .object({
    as_of_year: z
      .string()
      .transform((value) => Number.parseInt(value, 10))
      .refine((value) => Number.isFinite(value) && value >= 2000, {
        message: "as_of_year must be >= 2000"
      }),
    as_of_month: z
      .string()
      .transform((value) => Number.parseInt(value, 10))
      .refine(
        (value) => Number.isFinite(value) && value >= 1 && value <= 12,
        { message: "as_of_month must be between 1 and 12" }
      )
  })
  .strict();

const wellEventCreateSchema = z
  .object({
    type: z.string().trim().min(1),
    happened_at: z.string().trim().min(1).optional(),
    notes: z.string().trim().min(1).optional()
  })
  .strict();

const wellEventsQuerySchema = z
  .object({
    page: z
      .string()
      .transform((value) => Number.parseInt(value, 10))
      .refine((value) => Number.isFinite(value) && value >= 1, {
        message: "page must be >= 1"
      })
      .optional(),
    pageSize: z
      .string()
      .transform((value) => Number.parseInt(value, 10))
      .refine((value) => Number.isFinite(value) && value >= 1, {
        message: "pageSize must be >= 1"
      })
      .optional()
  })
  .strict();

app.get("/health", (c) =>
  c.json({
    ok: true,
    data: { status: "up" }
  })
);

app.get("/houses", authGuard, async (c) => {
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
  const offset = (page - 1) * pageSize;

  const where: string[] = [];
  const bindings: unknown[] = [];

  if (parsed.data.status) {
    where.push("h.status = ?");
    bindings.push(parsed.data.status);
  }

  if (parsed.data.search) {
    const like = `%${parsed.data.search}%`;
    where.push(
      "(h.street LIKE ? OR h.house_number LIKE ? OR p.name LIKE ? OR p.phone LIKE ?)"
    );
    bindings.push(like, like, like, like);
  }

  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  try {
    const countResult = await c.env.poco_db
      .prepare(
        `SELECT COUNT(DISTINCT h.id) AS total
         FROM houses h
         LEFT JOIN house_responsibilities hr
           ON hr.house_id = h.id AND hr.end_at IS NULL
         LEFT JOIN people p ON p.id = hr.person_id
         ${whereClause}`
      )
      .bind(...bindings)
      .first<{ total: number }>();

    const total = countResult?.total ?? 0;

    const rowsResult = await c.env.poco_db
      .prepare(
        `SELECT
           h.id,
           h.street,
           h.house_number,
           h.complement,
           h.cep,
           h.reference,
           h.monthly_amount_cents,
           h.status,
           h.notes,
           h.created_at,
           h.updated_at,
           p.id AS responsible_id,
           p.name AS responsible_name,
           p.phone AS responsible_phone
         FROM houses h
         LEFT JOIN house_responsibilities hr
           ON hr.house_id = h.id AND hr.end_at IS NULL
         LEFT JOIN people p ON p.id = hr.person_id
         ${whereClause}
         ORDER BY h.created_at DESC
         LIMIT ? OFFSET ?`
      )
      .bind(...bindings, pageSize, offset)
      .all();

    const items = rowsResult.results.map((row) => ({
      id: row.id,
      street: row.street,
      house_number: row.house_number,
      complement: row.complement,
      cep: row.cep,
      reference: row.reference,
      monthly_amount_cents: row.monthly_amount_cents,
      status: row.status,
      notes: row.notes,
      created_at: row.created_at,
      updated_at: row.updated_at,
      responsible_current: row.responsible_id
        ? {
            id: row.responsible_id,
            name: row.responsible_name,
            phone: row.responsible_phone
          }
        : null
    }));

    return c.json({
      ok: true,
      data: {
        items,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: total === 0 ? 0 : Math.ceil(total / pageSize)
        }
      }
    });
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
});

app.get("/houses/:id", authGuard, async (c) => {
  const houseId = c.req.param("id").trim();
  if (!houseId) {
    return c.json(
      { ok: false, error: { message: "House id is required" } },
      400
    );
  }

  try {
    const house = await c.env.poco_db
      .prepare(
        `SELECT
           id,
           street,
           house_number,
           complement,
           cep,
           reference,
           monthly_amount_cents,
           status,
           notes,
           created_at,
           updated_at
         FROM houses
         WHERE id = ?`
      )
      .bind(houseId)
      .first();

    if (!house) {
      return c.json(
        { ok: false, error: { message: "House not found" } },
        404
      );
    }

    const responsibleCurrent = await c.env.poco_db
      .prepare(
        `SELECT
           p.id,
           p.name,
           p.phone,
           hr.start_at
         FROM house_responsibilities hr
         JOIN people p ON p.id = hr.person_id
         WHERE hr.house_id = ? AND hr.end_at IS NULL
         ORDER BY hr.start_at DESC
         LIMIT 1`
      )
      .bind(houseId)
      .first();

    const historyResult = await c.env.poco_db
      .prepare(
        `SELECT
           hr.id,
           hr.house_id,
           hr.person_id,
           hr.start_at,
           hr.end_at,
           hr.reason,
           p.name,
           p.phone
         FROM house_responsibilities hr
         JOIN people p ON p.id = hr.person_id
         WHERE hr.house_id = ?
         ORDER BY hr.start_at DESC`
      )
      .bind(houseId)
      .all();

    const invoicesResult = await c.env.poco_db
      .prepare(
        `SELECT
           id,
           house_id,
           year,
           month,
           amount_cents,
           status,
           due_date,
           paid_at,
           notes,
           created_at,
           updated_at
         FROM invoices
         WHERE house_id = ?
         ORDER BY year DESC, month DESC
         LIMIT 12`
      )
      .bind(houseId)
      .all();

    return c.json({
      ok: true,
      data: {
        house,
        responsible_current: responsibleCurrent ?? null,
        responsible_history: historyResult.results.map((row) => ({
          id: row.id,
          house_id: row.house_id,
          person_id: row.person_id,
          start_at: row.start_at,
          end_at: row.end_at,
          reason: row.reason,
          person: {
            name: row.name,
            phone: row.phone
          }
        })),
        invoices: invoicesResult.results
      }
    });
  } catch (error) {
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
});

app.post("/houses/quick", authGuard, async (c) => {
  let payload: unknown;
  try {
    payload = await c.req.json();
  } catch {
    return c.json(
      { ok: false, error: { message: "Invalid JSON body" } },
      400
    );
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

  const { house, responsible } = parsed.data;
  const hasStreet = Boolean(house.street?.trim());
  const hasNumber = Boolean(house.house_number?.trim());
  const hasResponsible = Boolean(responsible?.name?.trim());

  const status =
    hasStreet && hasNumber && hasResponsible ? "active" : "pending";

  const envDefaultRaw = c.env.DEFAULT_AMOUNT_CENTS?.trim();
  const envDefault = envDefaultRaw ? Number(envDefaultRaw) : NaN;
  const monthlyAmount =
    house.monthly_amount_cents ??
    (Number.isFinite(envDefault) && envDefault > 0 ? envDefault : 9000);

  const now = new Date().toISOString();
  const houseId = crypto.randomUUID();

  const statements = [
    c.env.poco_db.prepare(
      "INSERT INTO houses (id, street, house_number, cep, reference, complement, monthly_amount_cents, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(
      houseId,
      house.street ?? null,
      house.house_number ?? null,
      house.cep ?? null,
      house.reference ?? null,
      house.complement ?? null,
      monthlyAmount,
      status
    )
  ];

  if (responsible) {
    const personId = crypto.randomUUID();
    statements.push(
      c.env.poco_db.prepare(
        "INSERT INTO people (id, name, phone) VALUES (?, ?, ?)"
      ).bind(personId, responsible.name, responsible.phone ?? null)
    );

    statements.push(
      c.env.poco_db.prepare(
        "UPDATE house_responsibilities SET end_at = ? WHERE house_id = ? AND end_at IS NULL"
      ).bind(now, houseId)
    );

    const responsibilityId = crypto.randomUUID();
    statements.push(
      c.env.poco_db.prepare(
        "INSERT INTO house_responsibilities (id, house_id, person_id, start_at, end_at) VALUES (?, ?, ?, ?, NULL)"
      ).bind(responsibilityId, houseId, personId, now)
    );
  }

  try {
    await c.env.poco_db.batch(statements);
  } catch (error) {
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

  return c.json({ ok: true, data: { house_id: houseId } });
});

app.post("/invoices/generate", authGuard, async (c) => {
  let payload: unknown;
  try {
    payload = await c.req.json();
  } catch {
    return c.json(
      { ok: false, error: { message: "Invalid JSON body" } },
      400
    );
  }

  const parsed = generateInvoicesSchema.safeParse(payload);
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

  const { year, month, include_pending } = parsed.data;
  const eligibleStatuses = include_pending ? ["active", "pending"] : ["active"];

  try {
    const eligibleCountResult = await c.env.poco_db
      .prepare(
        `SELECT COUNT(*) AS total
         FROM houses
         WHERE status IN (${eligibleStatuses.map(() => "?").join(", ")})`
      )
      .bind(...eligibleStatuses)
      .first<{ total: number }>();

    const eligibleTotal = eligibleCountResult?.total ?? 0;

    const existingCountResult = await c.env.poco_db
      .prepare(
        `SELECT COUNT(*) AS total
         FROM invoices i
         JOIN houses h ON h.id = i.house_id
         WHERE i.year = ? AND i.month = ?
           AND h.status IN (${eligibleStatuses.map(() => "?").join(", ")})`
      )
      .bind(year, month, ...eligibleStatuses)
      .first<{ total: number }>();

    const existingTotal = existingCountResult?.total ?? 0;

    await c.env.poco_db
      .prepare(
        `INSERT OR IGNORE INTO invoices (
           id,
           house_id,
           year,
           month,
           amount_cents,
           status,
           created_at,
           updated_at
         )
         SELECT
           lower(hex(randomblob(16))),
           h.id,
           ?,
           ?,
           h.monthly_amount_cents,
           'open',
           strftime('%Y-%m-%dT%H:%M:%SZ', 'now'),
           strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
         FROM houses h
         WHERE h.status IN (${eligibleStatuses.map(() => "?").join(", ")})`
      )
      .bind(year, month, ...eligibleStatuses)
      .run();

    const afterCountResult = await c.env.poco_db
      .prepare(
        `SELECT COUNT(*) AS total
         FROM invoices i
         JOIN houses h ON h.id = i.house_id
         WHERE i.year = ? AND i.month = ?
           AND h.status IN (${eligibleStatuses.map(() => "?").join(", ")})`
      )
      .bind(year, month, ...eligibleStatuses)
      .first<{ total: number }>();

    const afterTotal = afterCountResult?.total ?? 0;
    const created = Math.max(afterTotal - existingTotal, 0);
    const skippedExisting = Math.max(eligibleTotal - created, 0);

    return c.json({
      ok: true,
      data: {
        created,
        skipped_existing: skippedExisting
      }
    });
  } catch (error) {
    return c.json(
      {
        ok: false,
        error: {
          message: "Database error while generating invoices",
          details: error instanceof Error ? error.message : String(error)
        }
      },
      500
    );
  }
});

app.post("/invoices/:id/pay", authGuard, async (c) => {
  const invoiceId = c.req.param("id").trim();
  if (!invoiceId) {
    return c.json(
      { ok: false, error: { message: "Invoice id is required" } },
      400
    );
  }

  let payload: unknown;
  try {
    payload = await c.req.json();
  } catch {
    return c.json(
      { ok: false, error: { message: "Invalid JSON body" } },
      400
    );
  }

  const parsed = payInvoiceSchema.safeParse(payload);
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

  const { method, paid_at, notes } = parsed.data;

  try {
    const invoice = await c.env.poco_db
      .prepare(
        `SELECT id, house_id, status
         FROM invoices
         WHERE id = ?`
      )
      .bind(invoiceId)
      .first<{ id: string; house_id: string; status: string }>();

    if (!invoice) {
      return c.json(
        { ok: false, error: { message: "Invoice not found" } },
        404
      );
    }

    if (invoice.status === "paid") {
      return c.json(
        {
          ok: false,
          error: { message: "Invoice already paid", code: "ALREADY_PAID" }
        },
        409
      );
    }

    if (invoice.status !== "open") {
      return c.json(
        { ok: false, error: { message: "Invoice cannot be paid" } },
        409
      );
    }

    const now = new Date().toISOString();
    const paidAtValue = paid_at ?? now;
    const paymentId = crypto.randomUUID();

    const insertPayment = c.env.poco_db
      .prepare(
        `INSERT INTO payments (
           id,
           house_id,
           invoice_id,
           amount_cents,
           method,
           paid_at,
           notes
         )
         SELECT
           ?,
           house_id,
           id,
           amount_cents,
           ?,
           ?,
           ?
         FROM invoices
         WHERE id = ?`
      )
      .bind(paymentId, method, paidAtValue, notes ?? null, invoiceId);

    const updateInvoice = c.env.poco_db
      .prepare(
        `UPDATE invoices
         SET status = 'paid',
             paid_at = ?,
             updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
         WHERE id = ? AND status = 'open'`
      )
      .bind(paidAtValue, invoiceId);

    await c.env.poco_db.batch([insertPayment, updateInvoice]);

    const updated = await c.env.poco_db
      .prepare(`SELECT status FROM invoices WHERE id = ?`)
      .bind(invoiceId)
      .first<{ status: string }>();

    if (updated?.status !== "paid") {
      return c.json(
        {
          ok: false,
          error: { message: "Failed to mark invoice as paid" }
        },
        409
      );
    }

    return c.json({
      ok: true,
      data: { invoice_id: invoiceId, payment_id: paymentId }
    });
  } catch (error) {
    return c.json(
      {
        ok: false,
        error: {
          message: "Database error while paying invoice",
          details: error instanceof Error ? error.message : String(error)
        }
      },
      500
    );
  }
});

app.get("/dashboard", authGuard, async (c) => {
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

  const { year, month } = parsed.data;
  const asOfKey = year * 12 + month;

  try {
    const receivedResult = await c.env.poco_db
      .prepare(
        `SELECT COALESCE(SUM(p.amount_cents), 0) AS received_cents
         FROM payments p
         JOIN invoices i ON i.id = p.invoice_id
         WHERE i.year = ? AND i.month = ?`
      )
      .bind(year, month)
      .first<{ received_cents: number }>();

    const openResult = await c.env.poco_db
      .prepare(
        `SELECT COALESCE(SUM(amount_cents), 0) AS open_cents
         FROM invoices
         WHERE year = ? AND month = ? AND status = 'open'`
      )
      .bind(year, month)
      .first<{ open_cents: number }>();

    const lateResult = await c.env.poco_db
      .prepare(
        `SELECT COUNT(DISTINCT house_id) AS houses_late_count
         FROM invoices
         WHERE status = 'open' AND (year * 12 + month) < ?`
      )
      .bind(asOfKey)
      .first<{ houses_late_count: number }>();

    return c.json({
      ok: true,
      data: {
        received_cents: receivedResult?.received_cents ?? 0,
        open_cents: openResult?.open_cents ?? 0,
        houses_late_count: lateResult?.houses_late_count ?? 0
      }
    });
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
});

app.get("/late", authGuard, async (c) => {
  const parsed = lateQuerySchema.safeParse(c.req.query());
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

  const { as_of_year, as_of_month } = parsed.data;
  const asOfKey = as_of_year * 12 + as_of_month;

  try {
    const lateRows = await c.env.poco_db
      .prepare(
        `SELECT
           h.id AS house_id,
           h.street,
           h.house_number,
           h.complement,
           h.cep,
           h.reference,
           h.status,
           p.id AS responsible_id,
           p.name AS responsible_name,
           p.phone AS responsible_phone,
           i.id AS invoice_id,
           i.year,
           i.month,
           i.amount_cents,
           i.status AS invoice_status,
           i.due_date
         FROM invoices i
         JOIN houses h ON h.id = i.house_id
         LEFT JOIN house_responsibilities hr
           ON hr.house_id = h.id AND hr.end_at IS NULL
         LEFT JOIN people p ON p.id = hr.person_id
         WHERE i.status = 'open'
           AND (i.year * 12 + i.month) < ?
         ORDER BY h.id, i.year DESC, i.month DESC`
      )
      .bind(asOfKey)
      .all();

    const map = new Map<
      string,
      {
        house: Record<string, unknown>;
        responsible_current: Record<string, unknown> | null;
        invoices: Array<Record<string, unknown>>;
        months_late: number;
      }
    >();

    for (const row of lateRows.results) {
      const houseId = row.house_id as string;
      const monthKey = (row.year as number) * 12 + (row.month as number);
      const monthsLate = Math.max(asOfKey - monthKey, 0);

      if (!map.has(houseId)) {
        map.set(houseId, {
          house: {
            id: row.house_id,
            street: row.street,
            house_number: row.house_number,
            complement: row.complement,
            cep: row.cep,
            reference: row.reference,
            status: row.status
          },
          responsible_current: row.responsible_id
            ? {
                id: row.responsible_id,
                name: row.responsible_name,
                phone: row.responsible_phone
              }
            : null,
          invoices: [],
          months_late: 0
        });
      }

      const entry = map.get(houseId);
      if (entry) {
        entry.invoices.push({
          id: row.invoice_id,
          year: row.year,
          month: row.month,
          amount_cents: row.amount_cents,
          status: row.invoice_status,
          due_date: row.due_date
        });

        if (monthsLate > entry.months_late) {
          entry.months_late = monthsLate;
        }
      }
    }

    const items = Array.from(map.values()).map((entry) => ({
      house: entry.house,
      responsible_current: entry.responsible_current,
      months_late: entry.months_late,
      invoices_open: entry.invoices
    }));

    return c.json({ ok: true, data: { items } });
  } catch (error) {
    return c.json(
      {
        ok: false,
        error: {
          message: "Database error while loading late list",
          details: error instanceof Error ? error.message : String(error)
        }
      },
      500
    );
  }
});

app.post("/well-events", authGuard, async (c) => {
  let payload: unknown;
  try {
    payload = await c.req.json();
  } catch {
    return c.json(
      { ok: false, error: { message: "Invalid JSON body" } },
      400
    );
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

  const { type, happened_at, notes } = parsed.data;
  const eventId = crypto.randomUUID();
  const happenedAtValue = happened_at ?? new Date().toISOString();

  try {
    await c.env.poco_db
      .prepare(
        `INSERT INTO well_events (id, type, happened_at, notes)
         VALUES (?, ?, ?, ?)`
      )
      .bind(eventId, type, happenedAtValue, notes ?? null)
      .run();

    return c.json({ ok: true, data: { well_event_id: eventId } }, 201);
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
});

app.get("/well-events", authGuard, async (c) => {
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
  const offset = (page - 1) * pageSize;

  try {
    const totalResult = await c.env.poco_db
      .prepare(`SELECT COUNT(*) AS total FROM well_events`)
      .first<{ total: number }>();

    const rowsResult = await c.env.poco_db
      .prepare(
        `SELECT id, type, happened_at, notes, created_at
         FROM well_events
         ORDER BY happened_at DESC
         LIMIT ? OFFSET ?`
      )
      .bind(pageSize, offset)
      .all();

    const total = totalResult?.total ?? 0;
    const items = rowsResult.results;

    return c.json({
      ok: true,
      data: {
        items,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: total === 0 ? 0 : Math.ceil(total / pageSize)
        }
      }
    });
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
});

export default app;
