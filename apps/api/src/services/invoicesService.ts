import {
  buildInsertPaymentStatement,
  buildMarkInvoicePaidStatement,
  countEligibleHouses,
  countExistingInvoices,
  countInvoicesAfter,
  getInvoiceById,
  getInvoiceStatus,
  insertInvoicesForMonth
} from "../repositories/invoiceRepository";
import { createAuditStatement } from "../utils/audit";
import { ServiceError } from "./serviceError";

export const generateInvoices = async (
  db: D1Database,
  data: { year: number; month: number; include_pending?: boolean }
) => {
  const { year, month, include_pending } = data;
  const eligibleStatuses = include_pending ? ["active", "pending"] : ["active"];

  const eligibleCountResult = await countEligibleHouses(db, eligibleStatuses);
  const eligibleTotal = eligibleCountResult?.total ?? 0;

  const existingCountResult = await countExistingInvoices(
    db,
    year,
    month,
    eligibleStatuses
  );
  const existingTotal = existingCountResult?.total ?? 0;

  await insertInvoicesForMonth(db, year, month, eligibleStatuses);

  const afterCountResult = await countInvoicesAfter(
    db,
    year,
    month,
    eligibleStatuses
  );

  const afterTotal = afterCountResult?.total ?? 0;
  const created = Math.max(afterTotal - existingTotal, 0);
  const skippedExisting = Math.max(eligibleTotal - created, 0);

  await createAuditStatement(
    db,
    "generate_invoices",
    "invoices",
    `${year}-${String(month).padStart(2, "0")}`,
    {
      year,
      month,
      include_pending: include_pending ?? false,
      created,
      skipped_existing: skippedExisting
    }
  ).run();

  return {
    created,
    skipped_existing: skippedExisting
  };
};

export const payInvoice = async (
  db: D1Database,
  invoiceId: string,
  data: { method: string; paid_at?: string; notes?: string }
) => {
  const { method, paid_at, notes } = data;

  const invoice = await getInvoiceById(db, invoiceId);
  if (!invoice) {
    throw new ServiceError(404, "Invoice not found");
  }

  if (invoice.status === "paid") {
    throw new ServiceError(409, "Invoice already paid", "ALREADY_PAID");
  }

  if (invoice.status !== "open") {
    throw new ServiceError(409, "Invoice cannot be paid");
  }

  const now = new Date().toISOString();
  const paidAtValue = paid_at ?? now;
  const paymentId = crypto.randomUUID();

  const insertPayment = buildInsertPaymentStatement(db, {
    id: paymentId,
    invoice_id: invoiceId,
    method,
    paid_at: paidAtValue,
    notes: notes ?? null
  });

  const updateInvoice = buildMarkInvoicePaidStatement(
    db,
    invoiceId,
    paidAtValue
  );

  const auditStatement = createAuditStatement(
    db,
    "pay_invoice",
    "invoice",
    invoiceId,
    {
      payment_id: paymentId,
      method,
      paid_at: paidAtValue,
      notes: notes ?? null
    }
  );

  await db.batch([insertPayment, updateInvoice, auditStatement]);

  const updated = await getInvoiceStatus(db, invoiceId);
  if (updated?.status !== "paid") {
    throw new ServiceError(409, "Failed to mark invoice as paid");
  }

  return { invoice_id: invoiceId, payment_id: paymentId };
};
