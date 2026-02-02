import { Hono } from "hono";
import { lateListHandler } from "../controllers/lateController";
import { authGuard } from "../middleware/auth";
import type { AppBindings } from "../types";

export const lateRoutes = new Hono<AppBindings>();

lateRoutes.use("*", authGuard);
lateRoutes.get("/late", lateListHandler);
