import { z } from "zod";

export const lateQuerySchema = z
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
