import { Hono } from "hono";
import {
  generateInvoicesHandler,
  payInvoiceHandler
} from "../controllers/invoicesController";
import { authGuard } from "../middleware/auth";
import type { AppBindings } from "../types";

export const invoicesRoutes = new Hono<AppBindings>();

invoicesRoutes.use("*", authGuard);
invoicesRoutes.post("/invoices/generate", generateInvoicesHandler);
invoicesRoutes.post("/invoices/:id/pay", payInvoiceHandler);
