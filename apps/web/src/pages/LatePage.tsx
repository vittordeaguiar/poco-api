import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
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
    <section className="stack">
      <div>
        <h2>Casas em atraso</h2>
        <p className="muted">Lista de pendências até este mês.</p>
      </div>

      {isLoading ? (
        <div className="card">
          <p className="muted">Carregando lista...</p>
        </div>
      ) : null}

      {error ? (
        <div className="card">
          <p className="error">{error}</p>
        </div>
      ) : null}

      {!isLoading && !error && items.length === 0 ? (
        <div className="card">
          <p className="muted">Nenhuma casa em atraso por enquanto.</p>
        </div>
      ) : null}

      {!isLoading && !error
        ? items.map((item) => (
            <div className="card stack" key={item.house.id}>
              <div className="section-header">
                <div>
                  <strong>
                    {item.house.street ?? "(sem rua)"},{" "}
                    {item.house.house_number ?? "s/n"}
                  </strong>
                  <p className="muted">
                    {item.responsible_current
                      ? `Responsável: ${item.responsible_current.name}`
                      : "Sem responsável atual"}
                  </p>
                </div>
                <span className="status-pill status-open">
                  {item.months_late} meses em atraso
                </span>
              </div>

              <div>
                <p className="metric-label">Contato</p>
                <strong className="metric-value">
                  {item.responsible_current?.phone ?? "Sem telefone"}
                </strong>
              </div>

              <div>
                <p className="metric-label">Invoices em aberto</p>
                <div className="stack">
                  {item.invoices_open.map((invoice) => (
                    <div className="invoice-row" key={invoice.id}>
                      <span>{formatPeriod(invoice.year, invoice.month)}</span>
                      <span className="muted">
                        {invoice.due_date ? `Venc. ${invoice.due_date}` : "-"}
                      </span>
                      <strong>{formatCurrency(invoice.amount_cents)}</strong>
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
