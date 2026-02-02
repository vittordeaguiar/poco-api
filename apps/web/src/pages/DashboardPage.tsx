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
    <section className="grid gap-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[1.4rem] font-title">Dashboard</h2>
          <p className="text-sm text-muted">Resumo de {monthLabel}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="rounded-pill border border-border bg-bg-strong px-4 py-2 text-sm font-semibold text-text"
            type="button"
            onClick={handleExportInvoices}
          >
            Exportar invoices
          </button>
          <button
            className="rounded-pill border border-border bg-bg-strong px-4 py-2 text-sm font-semibold text-text"
            type="button"
            onClick={handleExportPayments}
          >
            Exportar pagamentos
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-card border border-border bg-bg-strong p-5 shadow-card">
          <p className="text-sm text-muted">Carregando dados...</p>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-card border border-border bg-bg-strong p-5 shadow-card">
          <p className="text-sm text-danger">{error}</p>
        </div>
      ) : null}

      {data ? (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-card border border-border bg-bg-strong p-5 shadow-card">
            <span className="text-xs text-muted">Recebido</span>
            <strong className="mt-1 block text-lg font-semibold">
              {formatCurrency(data.received_cents)}
            </strong>
          </div>
          <div className="rounded-card border border-border bg-bg-strong p-5 shadow-card">
            <span className="text-xs text-muted">Em aberto</span>
            <strong className="mt-1 block text-lg font-semibold">
              {formatCurrency(data.open_cents)}
            </strong>
          </div>
          <div className="rounded-card border border-border bg-bg-strong p-5 shadow-card">
            <span className="text-xs text-muted">Casas em atraso</span>
            <strong className="mt-1 block text-lg font-semibold">
              {data.houses_late_count}
            </strong>
          </div>
        </div>
      ) : null}
    </section>
  );
};
