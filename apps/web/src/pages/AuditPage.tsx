import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

type AuditItem = {
  id: string;
  action: string;
  entity: string;
  entity_id: string;
  summary: unknown;
  created_at: string;
};

type AuditResponse = {
  data: {
    items: AuditItem[];
  };
};

export const AuditPage = () => {
  const [items, setItems] = useState<AuditItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = (await apiFetch("/audit?limit=50")) as AuditResponse;
        setItems(response.data.items ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Falha ao carregar.");
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  return (
    <section className="grid gap-5">
      <div>
        <h2 className="text-[1.4rem] font-title">Audit log</h2>
        <p className="text-sm text-muted">Últimas ações registradas.</p>
      </div>

      {isLoading ? (
        <div className="rounded-card border border-border bg-bg-strong p-5 shadow-card">
          <p className="text-sm text-muted">Carregando logs...</p>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-card border border-border bg-bg-strong p-5 shadow-card">
          <p className="text-sm text-danger">{error}</p>
        </div>
      ) : null}

      {!isLoading && !error && items.length === 0 ? (
        <div className="rounded-card border border-border bg-bg-strong p-5 shadow-card">
          <p className="text-sm text-muted">Nenhum registro encontrado.</p>
        </div>
      ) : null}

      {!isLoading && !error
        ? items.map((item) => (
            <div
              className="grid gap-4 rounded-card border border-border bg-bg-strong p-5 shadow-card"
              key={item.id}
            >
              <div className="flex items-start justify-between gap-4">
                <strong className="text-sm font-semibold">{item.action}</strong>
                <span className="text-xs text-muted">{item.created_at}</span>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <span className="text-xs text-muted">Entidade</span>
                  <strong className="mt-1 block text-base font-semibold">
                    {item.entity} • {item.entity_id}
                  </strong>
                </div>
              </div>
              <div>
                <span className="text-xs text-muted">Resumo</span>
                <pre className="mt-2 rounded-xl border border-border bg-accent-soft p-3 text-xs">
                  {JSON.stringify(item.summary, null, 2)}
                </pre>
              </div>
            </div>
          ))
        : null}
    </section>
  );
};
