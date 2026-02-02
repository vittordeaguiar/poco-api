import { exportInvoicesSchema, exportPaymentsSchema } from "../schemas/exports";
import {
  exportHousesCsv,
  exportInvoicesCsv,
  exportLateCsv,
  exportPaymentsCsv
} from "../services/exportsService";
import { csvResponse } from "../utils/csv";
import type { AppHandler } from "../types";

export const exportHousesHandler: AppHandler = async (c) => {
  try {
    const { csv, filename } = await exportHousesCsv(c.env.poco_db);
    return c.text(csv, 200, csvResponse(filename, csv));
  } catch (error) {
    return c.json(
      {
        ok: false,
        error: {
          message: "Database error while exporting houses",
          details: error instanceof Error ? error.message : String(error)
        }
      },
      500
    );
  }
};

export const exportInvoicesHandler: AppHandler = async (c) => {
  const parsed = exportInvoicesSchema.safeParse(c.req.query());
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
  try {
    const { csv, filename } = await exportInvoicesCsv(
      c.env.poco_db,
      year,
      month
    );
    return c.text(csv, 200, csvResponse(filename, csv));
  } catch (error) {
    return c.json(
      {
        ok: false,
        error: {
          message: "Database error while exporting invoices",
          details: error instanceof Error ? error.message : String(error)
        }
      },
      500
    );
  }
};

export const exportPaymentsHandler: AppHandler = async (c) => {
  const parsed = exportPaymentsSchema.safeParse(c.req.query());
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

  const { from, to } = parsed.data;
  try {
    const { csv, filename } = await exportPaymentsCsv(
      c.env.poco_db,
      from,
      to
    );
    return c.text(csv, 200, csvResponse(filename, csv));
  } catch (error) {
    return c.json(
      {
        ok: false,
        error: {
          message: "Database error while exporting payments",
          details: error instanceof Error ? error.message : String(error)
        }
      },
      500
    );
  }
};

export const exportLateHandler: AppHandler = async (c) => {
  try {
    const { csv, filename } = await exportLateCsv(c.env.poco_db);
    return c.text(csv, 200, csvResponse(filename, csv));
  } catch (error) {
    return c.json(
      {
        ok: false,
        error: {
          message: "Database error while exporting late list",
          details: error instanceof Error ? error.message : String(error)
        }
      },
      500
    );
  }
};
