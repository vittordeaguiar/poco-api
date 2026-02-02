import { countLateHouses, sumOpen, sumReceived } from "../repositories/invoiceRepository";

export const getDashboard = async (
  db: D1Database,
  data: { year: number; month: number }
) => {
  const { year, month } = data;
  const asOfKey = year * 12 + month;

  const receivedResult = await sumReceived(db, year, month);
  const openResult = await sumOpen(db, year, month);
  const lateResult = await countLateHouses(db, asOfKey);

  return {
    received_cents: receivedResult?.received_cents ?? 0,
    open_cents: openResult?.open_cents ?? 0,
    houses_late_count: lateResult?.houses_late_count ?? 0
  };
};
