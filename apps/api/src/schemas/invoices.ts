import { z } from "zod";

export const generateInvoicesSchema = z
  .object({
    year: z.number().int().min(2000),
    month: z.number().int().min(1).max(12),
    include_pending: z.boolean().optional()
  })
  .strict();

export const payInvoiceSchema = z
  .object({
    method: z.enum(["cash", "pix", "transfer", "other"]),
    paid_at: z.string().trim().min(1).optional(),
    notes: z.string().trim().min(1).optional()
  })
  .strict();
