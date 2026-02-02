import {
  countWellEvents,
  insertWellEvent,
  listWellEvents as listWellEventsRepo
} from "../repositories/wellEventRepository";

export const createWellEvent = async (
  db: D1Database,
  data: { type: string; happened_at?: string; notes?: string }
) => {
  const { type, happened_at, notes } = data;
  const eventId = crypto.randomUUID();
  const happenedAtValue = happened_at ?? new Date().toISOString();

  await insertWellEvent(db, {
    id: eventId,
    type,
    happened_at: happenedAtValue,
    notes: notes ?? null
  });

  return { well_event_id: eventId };
};

export const listWellEvents = async (
  db: D1Database,
  data: { page: number; pageSize: number }
) => {
  const { page, pageSize } = data;
  const offset = (page - 1) * pageSize;

  const totalResult = await countWellEvents(db);
  const rowsResult = await listWellEventsRepo(db, pageSize, offset);

  const total = totalResult?.total ?? 0;
  const items = rowsResult.results;

  return {
    items,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / pageSize)
    }
  };
};
