import { z } from "zod";

export const exportInvoicesSchema = z
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

export const exportPaymentsSchema = z
  .object({
    from: z.string().trim().min(1),
    to: z.string().trim().min(1)
  })
  .strict();
