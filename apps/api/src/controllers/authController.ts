import { authLoginSchema } from "../schemas/auth";
import { verifyLogin } from "../services/authService";
import type { AppHandler } from "../types";

export const login: AppHandler = async (c) => {
  let payload: unknown;
  try {
    payload = await c.req.json();
  } catch {
    return c.json({ ok: false, error: { message: "Invalid JSON body" } }, 400);
  }

  const parsed = authLoginSchema.safeParse(payload);
  if (!parsed.success) {
    return c.json(
      {
        ok: false,
        error: {
          message: "Invalid request body",
          details: parsed.error.flatten()
        }
      },
      400
    );
  }

  const result = verifyLogin(c.env.API_KEY?.trim(), parsed.data.password);
  if (!result.ok) {
    return c.json(
      { ok: false, error: { message: result.message } },
      result.status
    );
  }

  return c.json({ ok: true, data: { token: result.token } });
};
