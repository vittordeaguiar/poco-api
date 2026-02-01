import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import { formatCurrency, formatMonthLabel } from "../lib/format";

type DashboardResponse = {
  data: {
    received_cents: number;
    open_cents: number;
    houses_late_count: number;
  };
};

export const DashboardPage = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const monthLabel = formatMonthLabel(year, month);

  const [data, setData] = useState<DashboardResponse["data"] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = (await apiFetch(
          `/dashboard?year=${year}&month=${month}`
        )) as DashboardResponse;
        setData(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Falha ao carregar.");
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [year, month]);

  return (
    <section className="stack">
      <div>
        <h2>Dashboard</h2>
        <p className="muted">Resumo de {monthLabel}</p>
      </div>

      {isLoading ? (
        <div className="card">
          <p className="muted">Carregando dados...</p>
        </div>
      ) : null}

      {error ? (
        <div className="card">
          <p className="error">{error}</p>
        </div>
      ) : null}

      {data ? (
        <div className="card-grid">
          <div className="card">
            <span className="metric-label">Recebido</span>
            <strong className="metric-value">
              {formatCurrency(data.received_cents)}
            </strong>
          </div>
          <div className="card">
            <span className="metric-label">Em aberto</span>
            <strong className="metric-value">
              {formatCurrency(data.open_cents)}
            </strong>
          </div>
          <div className="card">
            <span className="metric-label">Casas em atraso</span>
            <strong className="metric-value">{data.houses_late_count}</strong>
          </div>
        </div>
      ) : null}
    </section>
  );
};
