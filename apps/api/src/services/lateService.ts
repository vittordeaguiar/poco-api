import { fetchLateRows } from "../repositories/invoiceRepository";

export const listLate = async (
  db: D1Database,
  data: { as_of_year: number; as_of_month: number }
) => {
  const { as_of_year, as_of_month } = data;
  const asOfKey = as_of_year * 12 + as_of_month;

  const lateRows = await fetchLateRows(db, asOfKey);

  const map = new Map<
    string,
    {
      house: Record<string, unknown>;
      responsible_current: Record<string, unknown> | null;
      invoices: Array<Record<string, unknown>>;
      months_late: number;
    }
  >();

  for (const row of lateRows.results) {
    const houseId = row.house_id as string;
    const monthKey = (row.year as number) * 12 + (row.month as number);
    const monthsLate = Math.max(asOfKey - monthKey, 0);

    if (!map.has(houseId)) {
      map.set(houseId, {
        house: {
          id: row.house_id,
          street: row.street,
          house_number: row.house_number,
          complement: row.complement,
          cep: row.cep,
          reference: row.reference,
          status: row.status
        },
        responsible_current: row.responsible_id
          ? {
              id: row.responsible_id,
              name: row.responsible_name,
              phone: row.responsible_phone
            }
          : null,
        invoices: [],
        months_late: 0
      });
    }

    const entry = map.get(houseId);
    if (entry) {
      entry.invoices.push({
        id: row.invoice_id,
        year: row.year,
        month: row.month,
        amount_cents: row.amount_cents,
        status: row.invoice_status,
        due_date: row.due_date
      });

      if (monthsLate > entry.months_late) {
        entry.months_late = monthsLate;
      }
    }
  }

  const items = Array.from(map.values()).map((entry) => ({
    house: entry.house,
    responsible_current: entry.responsible_current,
    months_late: entry.months_late,
    invoices_open: entry.invoices
  }));

  return { items };
};
