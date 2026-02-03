import { BarChart3, FilePlus2, Download } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { apiDownload, apiFetch } from "../lib/api";
import { formatCurrency, formatMonthLabel } from "../lib/format";
import { Modal } from "../ui/Modal";

type DashboardResponse = {
  data: {
    received_cents: number;
    open_cents: number;
    houses_late_count: number;
  };
};

type GenerateInvoicesResponse = {
  data: {
    created: number;
    skipped_existing: number;
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
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [generateYear, setGenerateYear] = useState(year);
  const [generateMonth, setGenerateMonth] = useState(month);
  const [includePending, setIncludePending] = useState(false);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [generateResult, setGenerateResult] =
    useState<GenerateInvoicesResponse["data"] | null>(null);

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
      `faturas-${year}-${String(month).padStart(2, "0")}.csv`
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

  const monthOptions = useMemo(() => {
    return Array.from({ length: 12 }, (_, index) => {
      const value = index + 1;
      const label = new Intl.DateTimeFormat("pt-BR", {
        month: "long"
      }).format(new Date(2024, index, 1));
      return { value, label };
    });
  }, []);

  const handleOpenGenerate = () => {
    setGenerateYear(year);
    setGenerateMonth(month);
    setIncludePending(false);
    setGenerateError(null);
    setGenerateResult(null);
    setIsGenerateOpen(true);
  };

  const handleGenerateInvoices = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setGenerateError(null);
    setGenerateResult(null);
    setGenerateLoading(true);

    try {
      const response = (await apiFetch("/invoices/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year: generateYear,
          month: generateMonth,
          include_pending: includePending
        })
      })) as GenerateInvoicesResponse;
      setGenerateResult(response.data);
    } catch (err) {
      setGenerateError(
        err instanceof Error ? err.message : "Falha ao gerar faturas."
      );
    } finally {
      setGenerateLoading(false);
    }
  };

  return (
    <section className="grid gap-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="inline-flex items-center gap-2 text-[1.3rem] font-title">
            <BarChart3 className="h-5 w-5 text-accent" />
            Dashboard
          </h2>
          <p className="text-sm text-muted">Resumo de {monthLabel}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="btn"
            type="button"
            onClick={handleOpenGenerate}
          >
            <FilePlus2 className="h-4 w-4" />
            Gerar faturas do mês
          </button>
          <button
            className="btn"
            type="button"
            onClick={handleExportInvoices}
          >
            <Download className="h-4 w-4" />
            Exportar faturas
          </button>
          <button
            className="btn"
            type="button"
            onClick={handleExportPayments}
          >
            <Download className="h-4 w-4" />
            Exportar pagamentos
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="card rounded-card p-5">
          <p className="text-sm text-muted">Carregando dados...</p>
        </div>
      ) : null}

      {error ? (
        <div className="card rounded-card p-5">
          <p className="text-sm text-danger">{error}</p>
        </div>
      ) : null}

      {data ? (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="card rounded-card p-5">
            <span className="text-xs text-muted">Recebido</span>
            <strong className="mt-1 block text-lg font-semibold">
              {formatCurrency(data.received_cents)}
            </strong>
          </div>
          <div className="card rounded-card p-5">
            <span className="text-xs text-muted">Em aberto</span>
            <strong className="mt-1 block text-lg font-semibold">
              {formatCurrency(data.open_cents)}
            </strong>
          </div>
          <div className="card rounded-card p-5">
            <span className="text-xs text-muted">Casas em atraso</span>
            <strong className="mt-1 block text-lg font-semibold">
              {data.houses_late_count}
            </strong>
          </div>
        </div>
      ) : null}

      <Modal
        isOpen={isGenerateOpen}
        title="Gerar faturas do mês"
        eyebrow="Operação mensal"
        onClose={() => setIsGenerateOpen(false)}
        footer={
          <button
            className="btn btn-primary"
            type="submit"
            form="generate-invoices-form"
            disabled={generateLoading}
          >
            <FilePlus2 className="h-4 w-4" />
            {generateLoading ? "Gerando..." : "Confirmar geração"}
          </button>
        }
      >
        <form
          className="grid gap-4"
          id="generate-invoices-form"
          onSubmit={handleGenerateInvoices}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm">
              <span>Mês</span>
              <select
                value={generateMonth}
                onChange={(event) =>
                  setGenerateMonth(Number(event.target.value))
                }
                className="form-select"
              >
                {monthOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm">
              <span>Ano</span>
              <input
                type="number"
                min={2020}
                value={generateYear}
                onChange={(event) =>
                  setGenerateYear(Number(event.target.value))
                }
                className="form-input"
              />
            </label>
          </div>

          <label className="flex items-center gap-2 text-sm text-muted">
            <input
              type="checkbox"
              checked={includePending}
              onChange={(event) => setIncludePending(event.target.checked)}
            />
            <span>Incluir casas pendentes</span>
          </label>

          <p className="text-sm text-muted">
            Esta operação é idempotente: rodar novamente não cria faturas
            duplicadas.
          </p>

          {generateResult ? (
            <div className="rounded-card border border-border bg-accent-soft p-4 text-sm">
              <p className="font-semibold text-text">Geração concluída.</p>
              <p className="text-muted">
                Criadas: {generateResult.created} • Já existentes:{" "}
                {generateResult.skipped_existing}
              </p>
            </div>
          ) : null}

          {generateError ? (
            <p className="text-sm text-danger">{generateError}</p>
          ) : null}
        </form>
      </Modal>
    </section>
  );
};
