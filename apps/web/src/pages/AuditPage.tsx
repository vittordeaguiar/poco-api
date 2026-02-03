import { ClipboardCheck, Clock, FileText } from "lucide-react";
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
        <h2 className="inline-flex items-center gap-2 text-[1.3rem] font-title">
          <ClipboardCheck className="h-5 w-5 text-accent" />
          Audit log
        </h2>
        <p className="text-sm text-muted">Últimas ações registradas.</p>
      </div>

      {isLoading ? (
        <div className="card rounded-card p-5">
          <p className="text-sm text-muted">Carregando logs...</p>
        </div>
      ) : null}

      {error ? (
        <div className="card rounded-card p-5">
          <p className="text-sm text-danger">{error}</p>
        </div>
      ) : null}

      {!isLoading && !error && items.length === 0 ? (
        <div className="card rounded-card p-5">
          <p className="text-sm text-muted">Nenhum registro encontrado.</p>
        </div>
      ) : null}

      {!isLoading && !error
        ? items.map((item) => (
            <div className="card grid gap-4 rounded-card p-5" key={item.id}>
              <div className="flex items-start justify-between gap-4">
                <strong className="inline-flex items-center gap-2 text-sm font-semibold">
                  <FileText className="h-4 w-4 text-accent" />
                  {item.action}
                </strong>
                <span className="inline-flex items-center gap-2 text-xs text-muted">
                  <Clock className="h-3.5 w-3.5" />
                  {item.created_at}
                </span>
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
                <pre className="mt-2 rounded-lg border border-border bg-bg-soft p-3 text-xs">
                  {JSON.stringify(item.summary, null, 2)}
                </pre>
              </div>
            </div>
          ))
        : null}
    </section>
  );
};
