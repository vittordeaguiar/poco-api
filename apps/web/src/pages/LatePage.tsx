import { FileDown, Phone, Receipt, Timer } from "lucide-react";
import { useEffect, useState } from "react";
import { apiDownload, apiFetch } from "../lib/api";
import { formatCurrency, formatPeriod } from "../lib/format";

type LateItem = {
  house: {
    id: string;
    street: string | null;
    house_number: string | null;
    status: string;
  };
  responsible_current: {
    id: string;
    name: string;
    phone: string | null;
  } | null;
  months_late: number;
  invoices_open: Array<{
    id: string;
    year: number;
    month: number;
    amount_cents: number;
    status: string;
    due_date: string | null;
  }>;
};

type LateResponse = {
  data: {
    items: LateItem[];
  };
};

export const LatePage = () => {
  const now = new Date();
  const as_of_year = now.getFullYear();
  const as_of_month = now.getMonth() + 1;

  const [items, setItems] = useState<LateItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = (await apiFetch(
          `/late?as_of_year=${as_of_year}&as_of_month=${as_of_month}`
        )) as LateResponse;
        setItems(response.data.items ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Falha ao carregar.");
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [as_of_year, as_of_month]);

  return (
    <section className="grid gap-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="inline-flex items-center gap-2 text-[1.4rem] font-title">
            <Timer className="h-5 w-5 text-accent" />
            Casas em atraso
          </h2>
          <p className="text-sm text-muted">Lista de pendências até este mês.</p>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-pill border border-border bg-bg-strong px-4 py-2 text-sm font-semibold text-text"
          type="button"
          onClick={() =>
            apiDownload(
              "/export/late.csv",
              `late-${as_of_year}-${String(as_of_month).padStart(2, "0")}.csv`
            )
          }
        >
          <FileDown className="h-4 w-4" />
          Exportar CSV
        </button>
      </div>

      {isLoading ? (
        <div className="rounded-card surface-panel p-5">
          <p className="text-sm text-muted">Carregando lista...</p>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-card surface-panel p-5">
          <p className="text-sm text-danger">{error}</p>
        </div>
      ) : null}

      {!isLoading && !error && items.length === 0 ? (
        <div className="rounded-card surface-panel p-5">
          <p className="text-sm text-muted">Nenhuma casa em atraso por enquanto.</p>
        </div>
      ) : null}

      {!isLoading && !error
        ? items.map((item) => (
            <div
              className="grid gap-4 rounded-card surface-panel p-5"
              key={item.house.id}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <strong className="text-sm font-semibold">
                    {item.house.street ?? "(sem rua)"},{" "}
                    {item.house.house_number ?? "s/n"}
                  </strong>
                  <p className="text-sm text-muted">
                    {item.responsible_current
                      ? `Responsável: ${item.responsible_current.name}`
                      : "Sem responsável atual"}
                  </p>
                </div>
                <span className="inline-flex items-center rounded-pill bg-accent-soft px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.04em] text-warning">
                  {item.months_late} meses em atraso
                </span>
              </div>

              <div>
                <p className="inline-flex items-center gap-2 text-xs text-muted">
                  <Phone className="h-4 w-4 text-accent" />
                  Contato
                </p>
                <strong className="mt-1 block text-base font-semibold">
                  {item.responsible_current?.phone ?? "Sem telefone"}
                </strong>
              </div>

              <div>
                <p className="inline-flex items-center gap-2 text-xs text-muted">
                  <Receipt className="h-4 w-4 text-accent" />
                  Invoices em aberto
                </p>
                <div className="mt-2 grid gap-3">
                  {item.invoices_open.map((invoice) => (
                    <div
                      className="grid gap-2 border-b border-dashed border-border pb-3 last:border-b-0 last:pb-0 md:grid-cols-[1.2fr_0.8fr_auto] md:items-center"
                      key={invoice.id}
                    >
                      <span className="text-sm">
                        {formatPeriod(invoice.year, invoice.month)}
                      </span>
                      <span className="text-sm text-muted">
                        {invoice.due_date ? `Venc. ${invoice.due_date}` : "-"}
                      </span>
                      <strong className="text-sm font-semibold">
                        {formatCurrency(invoice.amount_cents)}
                      </strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        : null}
    </section>
  );
};
