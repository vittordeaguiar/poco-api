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
    <section className="stack">
      <div>
        <h2>Audit log</h2>
        <p className="muted">Últimas ações registradas.</p>
      </div>

      {isLoading ? (
        <div className="card">
          <p className="muted">Carregando logs...</p>
        </div>
      ) : null}

      {error ? (
        <div className="card">
          <p className="error">{error}</p>
        </div>
      ) : null}

      {!isLoading && !error && items.length === 0 ? (
        <div className="card">
          <p className="muted">Nenhum registro encontrado.</p>
        </div>
      ) : null}

      {!isLoading && !error
        ? items.map((item) => (
            <div className="card stack" key={item.id}>
              <div className="section-header">
                <strong>{item.action}</strong>
                <span className="muted">{item.created_at}</span>
              </div>
              <div className="grid">
                <div>
                  <span className="metric-label">Entidade</span>
                  <strong className="metric-value">
                    {item.entity} • {item.entity_id}
                  </strong>
                </div>
              </div>
              <div>
                <span className="metric-label">Resumo</span>
                <pre className="code-block">
                  {JSON.stringify(item.summary, null, 2)}
                </pre>
              </div>
            </div>
          ))
        : null}
    </section>
  );
};
