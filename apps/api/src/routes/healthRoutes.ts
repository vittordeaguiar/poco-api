import { Hono } from "hono";
import { healthCheck } from "../controllers/healthController";
import type { AppBindings } from "../types";

export const healthRoutes = new Hono<AppBindings>();

healthRoutes.get("/health", healthCheck);
