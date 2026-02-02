import { z } from "zod";

export const authLoginSchema = z
  .object({
    password: z.string().trim().min(1)
  })
  .strict();
