import { z } from "zod";

export const auditQuerySchema = z
  .object({
    limit: z
      .string()
      .transform((value) => Number.parseInt(value, 10))
      .refine((value) => Number.isFinite(value) && value >= 1, {
        message: "limit must be >= 1"
      })
      .optional()
  })
  .strict();
