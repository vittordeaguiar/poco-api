import { z } from "zod";

export const wellEventCreateSchema = z
  .object({
    type: z.string().trim().min(1),
    happened_at: z.string().trim().min(1).optional(),
    notes: z.string().trim().min(1).optional()
  })
  .strict();

export const wellEventsQuerySchema = z
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
