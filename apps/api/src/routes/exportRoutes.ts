import { Hono } from "hono";
import {
  exportHousesHandler,
  exportInvoicesHandler,
  exportLateHandler,
  exportPaymentsHandler
} from "../controllers/exportsController";
import { authGuard } from "../middleware/auth";
import type { AppBindings } from "../types";

export const exportRoutes = new Hono<AppBindings>();

exportRoutes.use("*", authGuard);
exportRoutes.get("/export/houses.csv", exportHousesHandler);
exportRoutes.get("/export/invoices.csv", exportInvoicesHandler);
exportRoutes.get("/export/payments.csv", exportPaymentsHandler);
exportRoutes.get("/export/late.csv", exportLateHandler);
