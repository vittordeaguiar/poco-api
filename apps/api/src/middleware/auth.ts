import type { AppMiddleware } from "../types";

export const authGuard: AppMiddleware = async (c, next) => {
  const apiKey = c.env.API_KEY?.trim();
  if (!apiKey) {
    return c.json(
      { ok: false, error: { message: "API_KEY not configured" } },
      500
    );
  }

  const authHeader = c.req.header("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token || token !== apiKey) {
    return c.json({ ok: false, error: { message: "Unauthorized" } }, 401);
  }

  await next();
};
