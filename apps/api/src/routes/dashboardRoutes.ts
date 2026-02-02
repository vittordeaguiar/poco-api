import { Hono } from "hono";
import { dashboardHandler } from "../controllers/dashboardController";
import { authGuard } from "../middleware/auth";
import type { AppBindings } from "../types";

export const dashboardRoutes = new Hono<AppBindings>();

dashboardRoutes.use("*", authGuard);
dashboardRoutes.get("/dashboard", dashboardHandler);
