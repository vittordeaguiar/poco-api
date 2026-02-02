import { cors } from "hono/cors";
import type { AppMiddleware } from "../types";

export const corsMiddleware: AppMiddleware = cors({
  origin: (origin, c) => {
    const defaultOrigins = ["http://localhost:5173", "http://127.0.0.1:5173"];
    const configured =
      c.env.CORS_ORIGINS?.split(",").map((value) => value.trim()) ?? [];
    const allowed = configured.filter(Boolean);
    const whitelist = allowed.length ? allowed : defaultOrigins;

    if (!origin) {
      return "";
    }
    return whitelist.includes(origin) ? origin : "";
  },
  allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"]
});
