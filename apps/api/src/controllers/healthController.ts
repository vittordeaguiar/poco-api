import type { AppHandler } from "../types";

export const healthCheck: AppHandler = (c) =>
  c.json({
    ok: true,
    data: { status: "up" }
  });
