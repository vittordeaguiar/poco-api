import { ListChecks, RefreshCw, UploadCloud } from "lucide-react";
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
        <h2 className="inline-flex items-center gap-2 text-[1.3rem] font-title">
          <RefreshCw className="h-5 w-5 text-accent" />
          Sincronização
        </h2>
        <p className="text-sm text-muted">
          Itens salvos localmente aguardando envio.
        </p>
      </div>

      {toast ? (
        <div className="sticky top-[72px] rounded-lg border border-border bg-bg-strong px-4 py-3 text-sm font-semibold text-text">
          {toast}
        </div>
      ) : null}

      <div className="card grid gap-4 rounded-card p-5">
        <div className="flex items-center justify-between gap-4">
          <strong className="inline-flex items-center gap-2 text-sm font-semibold">
            <ListChecks className="h-4 w-4 text-accent" />
            {items.length} pendências
          </strong>
          <button
            className="btn btn-primary"
            type="button"
            disabled={isSyncing || items.length === 0}
            onClick={handleResendAll}
          >
            <UploadCloud className="h-4 w-4" />
            {isSyncing ? "Reenviando..." : "Reenviar tudo"}
          </button>
        </div>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
      </div>

      {items.length === 0 ? (
        <div className="card rounded-card p-5">
          <p className="text-sm text-muted">Nenhum item pendente.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {summary.map((item) => (
            <div
              className="card rounded-card p-5"
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
