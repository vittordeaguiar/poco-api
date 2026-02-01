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
    <section className="stack">
      <div>
        <h2>Sincronização</h2>
        <p className="muted">Itens salvos localmente aguardando envio.</p>
      </div>

      {toast ? <div className="toast">{toast}</div> : null}

      <div className="card stack">
        <div className="section-header">
          <strong>{items.length} pendências</strong>
          <button
            className="primary"
            type="button"
            disabled={isSyncing || items.length === 0}
            onClick={handleResendAll}
          >
            {isSyncing ? "Reenviando..." : "Reenviar tudo"}
          </button>
        </div>
        {error ? <p className="error">{error}</p> : null}
      </div>

      {items.length === 0 ? (
        <div className="card">
          <p className="muted">Nenhum item pendente.</p>
        </div>
      ) : (
        <div className="stack">
          {summary.map((item) => (
            <div className="card" key={item.id}>
              <strong>{item.address}</strong>
              <p className="muted">{item.responsible}</p>
              <p className="muted">Salvo em {item.created_at}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
