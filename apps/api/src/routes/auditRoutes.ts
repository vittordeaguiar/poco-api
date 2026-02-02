import { Hono } from "hono";
import { listAuditHandler } from "../controllers/auditController";
import { authGuard } from "../middleware/auth";
import type { AppBindings } from "../types";

export const auditRoutes = new Hono<AppBindings>();

auditRoutes.use("*", authGuard);
auditRoutes.get("/audit", listAuditHandler);
