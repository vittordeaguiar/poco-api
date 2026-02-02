import {
  fetchHousesExport,
  fetchInvoicesExport,
  fetchLateExport,
  fetchPaymentsExport
} from "../repositories/exportRepository";
import { buildCsv } from "../utils/csv";

export const exportHousesCsv = async (db: D1Database) => {
  const rows = await fetchHousesExport(db);
  const csv = buildCsv(
    [
      "id",
      "street",
      "house_number",
      "complement",
      "cep",
      "reference",
      "monthly_amount_cents",
      "status",
      "notes",
      "created_at",
      "updated_at",
      "responsible_name",
      "responsible_phone"
    ],
    rows.results.map((row) => [
      row.id,
      row.street,
      row.house_number,
      row.complement,
      row.cep,
      row.reference,
      row.monthly_amount_cents,
      row.status,
      row.notes,
      row.created_at,
      row.updated_at,
      row.responsible_name,
      row.responsible_phone
    ])
  );

  return { csv, filename: "houses.csv" };
};

export const exportInvoicesCsv = async (
  db: D1Database,
  year: number,
  month: number
) => {
  const rows = await fetchInvoicesExport(db, year, month);
  const csv = buildCsv(
    [
      "id",
      "house_id",
      "year",
      "month",
      "amount_cents",
      "status",
      "due_date",
      "paid_at",
      "notes",
      "created_at",
      "updated_at",
      "street",
      "house_number",
      "cep",
      "reference"
    ],
    rows.results.map((row) => [
      row.id,
      row.house_id,
      row.year,
      row.month,
      row.amount_cents,
      row.status,
      row.due_date,
      row.paid_at,
      row.notes,
      row.created_at,
      row.updated_at,
      row.street,
      row.house_number,
      row.cep,
      row.reference
    ])
  );

  return {
    csv,
    filename: `invoices-${year}-${String(month).padStart(2, "0")}.csv`
  };
};

export const exportPaymentsCsv = async (
  db: D1Database,
  from: string,
  to: string
) => {
  const rows = await fetchPaymentsExport(db, from, to);
  const csv = buildCsv(
    [
      "id",
      "house_id",
      "invoice_id",
      "amount_cents",
      "method",
      "paid_at",
      "notes",
      "created_at",
      "invoice_year",
      "invoice_month",
      "street",
      "house_number"
    ],
    rows.results.map((row) => [
      row.id,
      row.house_id,
      row.invoice_id,
      row.amount_cents,
      row.method,
      row.paid_at,
      row.notes,
      row.created_at,
      row.year,
      row.month,
      row.street,
      row.house_number
    ])
  );

  return { csv, filename: `payments-${from}-to-${to}.csv` };
};

export const exportLateCsv = async (db: D1Database) => {
  const now = new Date();
  const asOfYear = now.getFullYear();
  const asOfMonth = now.getMonth() + 1;
  const asOfKey = asOfYear * 12 + asOfMonth;

  const rows = await fetchLateExport(db, asOfKey);

  const csv = buildCsv(
    [
      "as_of_year",
      "as_of_month",
      "house_id",
      "street",
      "house_number",
      "cep",
      "reference",
      "house_status",
      "responsible_name",
      "responsible_phone",
      "invoice_id",
      "invoice_year",
      "invoice_month",
      "invoice_amount_cents",
      "invoice_due_date",
      "invoice_status",
      "months_late"
    ],
    rows.results.map((row) => {
      const monthKey = (row.year as number) * 12 + (row.month as number);
      const monthsLate = Math.max(asOfKey - monthKey, 0);
      return [
        asOfYear,
        asOfMonth,
        row.house_id,
        row.street,
        row.house_number,
        row.cep,
        row.reference,
        row.status,
        row.responsible_name,
        row.responsible_phone,
        row.invoice_id,
        row.year,
        row.month,
        row.amount_cents,
        row.due_date,
        row.invoice_status,
        monthsLate
      ];
    })
  );

  return {
    csv,
    filename: `late-${asOfYear}-${String(asOfMonth).padStart(2, "0")}.csv`
  };
};
