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
