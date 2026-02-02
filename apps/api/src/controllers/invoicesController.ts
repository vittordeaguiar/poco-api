import { generateInvoicesSchema, payInvoiceSchema } from "../schemas/invoices";
import { generateInvoices, payInvoice } from "../services/invoicesService";
import { ServiceError } from "../services/serviceError";
import type { AppHandler } from "../types";

export const generateInvoicesHandler: AppHandler = async (c) => {
  let payload: unknown;
  try {
    payload = await c.req.json();
  } catch {
    return c.json({ ok: false, error: { message: "Invalid JSON body" } }, 400);
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

  try {
    const data = await generateInvoices(c.env.poco_db, parsed.data);
    return c.json({ ok: true, data });
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
};

export const payInvoiceHandler: AppHandler = async (c) => {
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
    return c.json({ ok: false, error: { message: "Invalid JSON body" } }, 400);
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

  try {
    const data = await payInvoice(c.env.poco_db, invoiceId, parsed.data);
    return c.json({ ok: true, data });
  } catch (error) {
    if (error instanceof ServiceError) {
      const payloadError: Record<string, unknown> = { message: error.message };
      if (error.code) {
        payloadError.code = error.code;
      }
      return c.json({ ok: false, error: payloadError }, error.status);
    }
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
};
