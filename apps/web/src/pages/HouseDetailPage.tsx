import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { formatCurrency, formatPeriod } from "../lib/format";

type HouseDetail = {
  id: string;
  street: string | null;
  house_number: string | null;
  complement: string | null;
  cep: string | null;
  reference: string | null;
  monthly_amount_cents: number;
  status: "active" | "inactive" | "pending";
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type HouseResponse = {
  data: {
    house: HouseDetail;
    responsible_current: {
      id: string;
      name: string;
      phone: string | null;
      start_at: string;
    } | null;
    responsible_history: Array<{
      id: string;
      start_at: string;
      end_at: string | null;
      reason: string | null;
      person: { name: string; phone: string | null };
    }>;
    invoices: Array<{
      id: string;
      year: number;
      month: number;
      amount_cents: number;
      status: "open" | "paid" | "void";
      due_date: string | null;
      paid_at: string | null;
    }>;
  };
};

const paymentMethods = [
  { value: "pix", label: "PIX" },
  { value: "cash", label: "Dinheiro" },
  { value: "transfer", label: "Transferência" },
  { value: "other", label: "Outro" }
];

export const HouseDetailPage = () => {
  const { id } = useParams();
  const [data, setData] = useState<HouseResponse["data"] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [paying, setPaying] = useState<Record<string, boolean>>({});
  const [methods, setMethods] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});

  const loadHouse = async () => {
    if (!id) {
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = (await apiFetch(`/houses/${id}`)) as HouseResponse;
      setData(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHouse();
  }, [id]);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timer = window.setTimeout(() => setToast(null), 2500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const addressLabel = useMemo(() => {
    if (!data?.house) {
      return "";
    }
    return `${data.house.street ?? "(sem rua)"}, ${
      data.house.house_number ?? "s/n"
    }`;
  }, [data]);

  const handlePay = async (invoiceId: string) => {
    const method = methods[invoiceId] ?? "pix";
    const note = notes[invoiceId]?.trim();

    setPaying((prev) => ({ ...prev, [invoiceId]: true }));
    setError(null);

    try {
      await apiFetch(`/invoices/${invoiceId}/pay`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          method,
          notes: note || undefined
        })
      });
      setToast("Pagamento registrado.");
      await loadHouse();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Falha ao registrar pagamento."
      );
    } finally {
      setPaying((prev) => ({ ...prev, [invoiceId]: false }));
    }
  };

  return (
    <section className="stack">
      <header className="section-header">
        <div>
          <h2>Casa</h2>
          <p className="muted">Detalhes da casa {id}</p>
        </div>
        <Link className="link" to="/houses">
          Voltar
        </Link>
      </header>

      {toast ? <div className="toast">{toast}</div> : null}

      {isLoading ? (
        <div className="card">
          <p className="muted">Carregando...</p>
        </div>
      ) : null}

      {error ? (
        <div className="card">
          <p className="error">{error}</p>
        </div>
      ) : null}

      {data ? (
        <>
          <div className="card">
            <p className="muted">Informações principais</p>
            <div className="grid">
              <div>
                <span className="metric-label">Endereço</span>
                <strong className="metric-value">{addressLabel}</strong>
              </div>
              <div>
                <span className="metric-label">Status</span>
                <span className={`status-pill status-${data.house.status}`}>
                  {data.house.status}
                </span>
              </div>
              <div>
                <span className="metric-label">Mensalidade</span>
                <strong className="metric-value">
                  {formatCurrency(data.house.monthly_amount_cents)}
                </strong>
              </div>
              <div>
                <span className="metric-label">CEP</span>
                <strong className="metric-value">
                  {data.house.cep ?? "-"}
                </strong>
              </div>
            </div>
          </div>

          <div className="card">
            <p className="muted">Responsável atual</p>
            {data.responsible_current ? (
              <div className="grid">
                <div>
                  <span className="metric-label">Nome</span>
                  <strong className="metric-value">
                    {data.responsible_current.name}
                  </strong>
                </div>
                <div>
                  <span className="metric-label">Telefone</span>
                  <strong className="metric-value">
                    {data.responsible_current.phone ?? "-"}
                  </strong>
                </div>
              </div>
            ) : (
              <p className="muted">Sem responsável atual.</p>
            )}
          </div>

          <div className="card stack">
            <p className="muted">Últimas invoices</p>
            {data.invoices.length === 0 ? (
              <p className="muted">Nenhuma invoice encontrada.</p>
            ) : (
              data.invoices.map((invoice) => (
                <div className="invoice-row" key={invoice.id}>
                  <div>
                    <strong>{formatPeriod(invoice.year, invoice.month)}</strong>
                    <p className="muted">
                      {formatCurrency(invoice.amount_cents)}
                    </p>
                  </div>
                  <div className="invoice-actions">
                    <span className={`status-pill status-${invoice.status}`}>
                      {invoice.status}
                    </span>
                    {invoice.status === "paid" ? (
                      <span className="muted">
                        {invoice.paid_at ? `Pago em ${invoice.paid_at}` : ""}
                      </span>
                    ) : null}
                    {invoice.status === "open" ? (
                      <div className="pay-controls">
                        <select
                          value={methods[invoice.id] ?? "pix"}
                          onChange={(event) =>
                            setMethods((prev) => ({
                              ...prev,
                              [invoice.id]: event.target.value
                            }))
                          }
                        >
                          {paymentMethods.map((item) => (
                            <option key={item.value} value={item.value}>
                              {item.label}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          placeholder="Observações"
                          value={notes[invoice.id] ?? ""}
                          onChange={(event) =>
                            setNotes((prev) => ({
                              ...prev,
                              [invoice.id]: event.target.value
                            }))
                          }
                        />
                        <button
                          className="primary"
                          type="button"
                          disabled={paying[invoice.id]}
                          onClick={() => handlePay(invoice.id)}
                        >
                          {paying[invoice.id] ? "Pagando..." : "Pagar"}
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="card stack">
            <p className="muted">Histórico de responsáveis</p>
            {data.responsible_history.length === 0 ? (
              <p className="muted">Sem histórico registrado.</p>
            ) : (
              data.responsible_history.map((item) => (
                <div className="list-item" key={item.id}>
                  <div>
                    <strong>{item.person.name}</strong>
                    <p className="muted">
                      {item.person.phone ?? "-"} • {item.start_at}
                    </p>
                  </div>
                  <span className="muted">
                    {item.end_at ? `Até ${item.end_at}` : "Atual"}
                  </span>
                </div>
              ))
            )}
          </div>
        </>
      ) : null}
    </section>
  );
};
