export type OfflineQueueItem = {
  id: string;
  type: "houses_quick";
  payload: unknown;
  created_at: string;
};

const queueKey = "poco_offline_queue";
const queueEvent = "poco:offline-queue";

const emitQueueChange = () => {
  window.dispatchEvent(new Event(queueEvent));
};

export const subscribeQueue = (handler: () => void) => {
  window.addEventListener(queueEvent, handler);
  return () => window.removeEventListener(queueEvent, handler);
};

export const getQueue = (): OfflineQueueItem[] => {
  const raw = localStorage.getItem(queueKey);
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as OfflineQueueItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    localStorage.removeItem(queueKey);
    return [];
  }
};

export const saveQueue = (items: OfflineQueueItem[]) => {
  localStorage.setItem(queueKey, JSON.stringify(items));
  emitQueueChange();
};

export const addToQueue = (item: OfflineQueueItem) => {
  const queue = getQueue();
  queue.push(item);
  saveQueue(queue);
};

export const removeFromQueue = (id: string) => {
  const queue = getQueue().filter((item) => item.id !== id);
  saveQueue(queue);
};

export const clearQueue = () => {
  localStorage.removeItem(queueKey);
  emitQueueChange();
};

export const getQueueCount = () => getQueue().length;

export const isNetworkError = (error: unknown) => {
  if (error instanceof TypeError) {
    return true;
  }
  const message =
    error instanceof Error ? error.message : typeof error === "string" ? error : "";
  return /network|failed to fetch/i.test(message);
};
