import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../lib/api";
import {
  getQueue,
  isNetworkError,
  removeFromQueue,
  subscribeQueue,
  type OfflineQueueItem
} from "../lib/offlineQueue";

export const SyncPage = () => {
  const [items, setItems] = useState<OfflineQueueItem[]>(getQueue());
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const update = () => setItems(getQueue());
    const unsubscribe = subscribeQueue(update);
    window.addEventListener("storage", update);
    return () => {
      unsubscribe();
      window.removeEventListener("storage", update);
    };
  }, []);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }
    const timer = window.setTimeout(() => setToast(null), 2500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const summary = useMemo(() => {
    return items.map((item) => {
      const payload = item.payload as {
        house?: { street?: string; house_number?: string };
        responsible?: { name?: string };
      };
      return {
        id: item.id,
        created_at: item.created_at,
        address: `${payload?.house?.street ?? "(sem rua)"}, ${
          payload?.house?.house_number ?? "s/n"
        }`,
        responsible: payload?.responsible?.name ?? "Sem responsável"
      };
    });
  }, [items]);

  const handleResendAll = async () => {
    if (items.length === 0) {
      return;
    }

    setIsSyncing(true);
    setError(null);
    let hadError = false;

    for (const item of items) {
      if (item.type !== "houses_quick") {
        continue;
      }

      try {
        await apiFetch("/houses/quick", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(item.payload)
        });
        removeFromQueue(item.id);
      } catch (err) {
        if (isNetworkError(err)) {
          setError("Sem conexão. Tente novamente quando estiver online.");
          hadError = true;
          break;
        }
        setError(err instanceof Error ? err.message : "Falha ao reenviar.");
        hadError = true;
      }
    }

    setItems(getQueue());
    if (!hadError) {
      setToast("Fila sincronizada.");
    }
    setIsSyncing(false);
  };

  return (
    <section className="grid gap-5">
      <div>
        <h2 className="text-[1.4rem] font-title">Sincronização</h2>
        <p className="text-sm text-muted">
          Itens salvos localmente aguardando envio.
        </p>
      </div>

      {toast ? (
        <div className="sticky top-[72px] rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-accent-contrast shadow-soft">
          {toast}
        </div>
      ) : null}

      <div className="grid gap-4 rounded-card border border-border bg-bg-strong p-5 shadow-card">
        <div className="flex items-center justify-between gap-4">
          <strong className="text-sm font-semibold">
            {items.length} pendências
          </strong>
          <button
            className="rounded-pill bg-accent px-5 py-2 text-sm font-bold text-accent-contrast shadow-soft transition active:translate-y-px active:shadow-none disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            disabled={isSyncing || items.length === 0}
            onClick={handleResendAll}
          >
            {isSyncing ? "Reenviando..." : "Reenviar tudo"}
          </button>
        </div>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
      </div>

      {items.length === 0 ? (
        <div className="rounded-card border border-border bg-bg-strong p-5 shadow-card">
          <p className="text-sm text-muted">Nenhum item pendente.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {summary.map((item) => (
            <div
              className="rounded-card border border-border bg-bg-strong p-5 shadow-card"
              key={item.id}
            >
              <strong className="text-sm font-semibold">{item.address}</strong>
              <p className="mt-1 text-sm text-muted">{item.responsible}</p>
              <p className="text-sm text-muted">Salvo em {item.created_at}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
