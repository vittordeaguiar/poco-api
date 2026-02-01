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

app.get("/health", (c) =>
  c.json({
    ok: true,
    data: { status: "up" }
  })
);

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

export default app;
