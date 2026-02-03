import { z } from "zod";

export const peopleQuerySchema = z
  .object({
    search: z.string().trim().min(1).optional()
  })
  .strict();

export const createPersonSchema = z
  .object({
    name: z.string().trim().min(1),
    phone: z.string().trim().min(1).optional(),
    mobile: z.string().trim().min(1).optional(),
    cpf: z.string().trim().min(1).optional(),
    email: z.string().trim().min(1).optional(),
    rg: z.string().trim().min(1).optional(),
    notes: z.string().trim().min(1).optional()
  })
  .strict();

export const updatePersonSchema = z
  .object({
    name: z.string().trim().optional(),
    phone: z.string().trim().nullable().optional(),
    mobile: z.string().trim().nullable().optional(),
    cpf: z.string().trim().nullable().optional(),
    email: z.string().trim().nullable().optional(),
    rg: z.string().trim().nullable().optional(),
    notes: z.string().trim().nullable().optional()
  })
  .strict();
