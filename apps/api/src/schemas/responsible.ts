import { z } from "zod";

export const responsibleInputSchema = z.union([
  z
    .object({
      person_id: z.string().trim().min(1)
    })
    .strict(),
  z
    .object({
      name: z.string().trim().min(1),
      phone: z.string().trim().min(1).optional()
    })
    .strict()
]);
