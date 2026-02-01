import { useEffect, useState } from "react";
import { apiDownload, apiFetch } from "../lib/api";
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

  const handleExportInvoices = () => {
    apiDownload(
      `/export/invoices.csv?year=${year}&month=${month}`,
      `invoices-${year}-${String(month).padStart(2, "0")}.csv`
    );
  };

  const handleExportPayments = () => {
    const from = new Date(year, month - 1, 1);
    const to = new Date(year, month, 0);
    const fromIso = from.toISOString().slice(0, 10);
    const toIso = to.toISOString().slice(0, 10);
    apiDownload(
      `/export/payments.csv?from=${fromIso}&to=${toIso}`,
      `payments-${fromIso}-to-${toIso}.csv`
    );
  };

  return (
    <section className="stack">
      <div className="section-header">
        <div>
          <h2>Dashboard</h2>
          <p className="muted">Resumo de {monthLabel}</p>
        </div>
        <div className="header-actions">
          <button className="ghost" type="button" onClick={handleExportInvoices}>
            Exportar invoices
          </button>
          <button className="ghost" type="button" onClick={handleExportPayments}>
            Exportar pagamentos
          </button>
        </div>
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
