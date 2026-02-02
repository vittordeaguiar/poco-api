import { z } from "zod";
import { responsibleInputSchema } from "./responsible";

export const houseQuickSchema = z
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
    responsible: responsibleInputSchema.optional()
  })
  .strict();

export const houseUpdateSchema = z
  .object({
    house: z
      .object({
        street: z.string().trim().optional(),
        house_number: z.string().trim().optional(),
        cep: z.string().trim().optional(),
        reference: z.string().trim().optional(),
        complement: z.string().trim().optional(),
        monthly_amount_cents: z.number().int().positive().optional(),
        status: z.enum(["active", "inactive", "pending"]).optional(),
        notes: z.string().trim().optional()
      })
      .strict()
  })
  .strict();

export const housesQuerySchema = z
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

export const assignResponsibleSchema = responsibleInputSchema;
