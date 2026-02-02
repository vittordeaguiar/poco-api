import {
  ArrowLeft,
  ClipboardList,
  CreditCard,
  Home,
  Receipt,
  User,
  Users
} from "lucide-react";
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

  const statusClass = (status: string) => {
    switch (status) {
      case "active":
        return "bg-accent-soft text-success";
      case "pending":
      case "open":
        return "bg-accent-soft text-warning";
      case "inactive":
      case "void":
        return "bg-accent-soft text-muted";
      case "paid":
        return "bg-accent-soft text-success";
      default:
        return "bg-accent-soft text-muted";
    }
  };

  return (
    <section className="grid gap-5">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h2 className="inline-flex items-center gap-2 text-[1.4rem] font-title">
            <Home className="h-5 w-5 text-accent" />
            Casa
          </h2>
          <p className="text-sm text-muted">Detalhes da casa {id}</p>
        </div>
        <Link className="inline-flex items-center gap-2 text-sm font-semibold text-text" to="/houses">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
      </header>

      {toast ? (
        <div className="sticky top-[72px] rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-accent-contrast shadow-soft">
          {toast}
        </div>
      ) : null}

      {isLoading ? (
        <div className="rounded-card surface-panel p-5">
          <p className="text-sm text-muted">Carregando...</p>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-card surface-panel p-5">
          <p className="text-sm text-danger">{error}</p>
        </div>
      ) : null}

      {data ? (
        <>
          <div className="rounded-card surface-panel p-5">
            <p className="inline-flex items-center gap-2 text-sm text-muted">
              <ClipboardList className="h-4 w-4 text-accent" />
              Informações principais
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <span className="text-xs text-muted">Endereço</span>
                <strong className="mt-1 block text-base font-semibold">
                  {addressLabel}
                </strong>
              </div>
              <div>
                <span className="text-xs text-muted">Status</span>
                <span
                  className={`mt-2 inline-flex items-center rounded-pill px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.04em] ${statusClass(
                    data.house.status
                  )}`}
                >
                  {data.house.status}
                </span>
              </div>
              <div>
                <span className="text-xs text-muted">Mensalidade</span>
                <strong className="mt-1 block text-base font-semibold">
                  {formatCurrency(data.house.monthly_amount_cents)}
                </strong>
              </div>
              <div>
                <span className="text-xs text-muted">CEP</span>
                <strong className="mt-1 block text-base font-semibold">
                  {data.house.cep ?? "-"}
                </strong>
              </div>
            </div>
          </div>

          <div className="rounded-card surface-panel p-5">
            <p className="inline-flex items-center gap-2 text-sm text-muted">
              <User className="h-4 w-4 text-accent" />
              Responsável atual
            </p>
            {data.responsible_current ? (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <span className="text-xs text-muted">Nome</span>
                  <strong className="mt-1 block text-base font-semibold">
                    {data.responsible_current.name}
                  </strong>
                </div>
                <div>
                  <span className="text-xs text-muted">Telefone</span>
                  <strong className="mt-1 block text-base font-semibold">
                    {data.responsible_current.phone ?? "-"}
                  </strong>
                </div>
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted">Sem responsável atual.</p>
            )}
          </div>

          <div className="grid gap-4 rounded-card surface-panel p-5">
            <p className="inline-flex items-center gap-2 text-sm text-muted">
              <Receipt className="h-4 w-4 text-accent" />
              Últimas invoices
            </p>
            {data.invoices.length === 0 ? (
              <p className="text-sm text-muted">Nenhuma invoice encontrada.</p>
            ) : (
              data.invoices.map((invoice) => (
                <div
                  className="grid gap-3 border-b border-dashed border-border pb-3 last:border-b-0 last:pb-0 md:grid-cols-[1.2fr_0.8fr] md:items-center"
                  key={invoice.id}
                >
                  <div>
                    <strong className="text-sm font-semibold">
                      {formatPeriod(invoice.year, invoice.month)}
                    </strong>
                    <p className="text-sm text-muted">
                      {formatCurrency(invoice.amount_cents)}
                    </p>
                  </div>
                  <div className="grid gap-2 md:justify-items-end">
                    <span
                      className={`inline-flex items-center rounded-pill px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.04em] ${statusClass(
                        invoice.status
                      )}`}
                    >
                      {invoice.status}
                    </span>
                    {invoice.status === "paid" ? (
                      <span className="text-sm text-muted">
                        {invoice.paid_at ? `Pago em ${invoice.paid_at}` : ""}
                      </span>
                    ) : null}
                    {invoice.status === "open" ? (
                      <div className="grid gap-2 md:grid-cols-[140px_1fr_auto] md:items-center">
                        <select
                          value={methods[invoice.id] ?? "pix"}
                          onChange={(event) =>
                            setMethods((prev) => ({
                              ...prev,
                              [invoice.id]: event.target.value
                            }))
                          }
                          className="rounded-xl border border-border bg-bg-strong px-2.5 py-2 text-sm"
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
                          className="rounded-xl border border-border bg-bg-strong px-2.5 py-2 text-sm text-text"
                        />
                        <button
                          className="inline-flex items-center gap-2 rounded-pill bg-accent px-4 py-2 text-sm font-bold text-accent-contrast shadow-soft transition active:translate-y-px active:shadow-none disabled:cursor-not-allowed disabled:opacity-60"
                          type="button"
                          disabled={paying[invoice.id]}
                          onClick={() => handlePay(invoice.id)}
                        >
                          <CreditCard className="h-4 w-4" />
                          {paying[invoice.id] ? "Pagando..." : "Pagar"}
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="grid gap-4 rounded-card surface-panel p-5">
            <p className="inline-flex items-center gap-2 text-sm text-muted">
              <Users className="h-4 w-4 text-accent" />
              Histórico de responsáveis
            </p>
            {data.responsible_history.length === 0 ? (
              <p className="text-sm text-muted">Sem histórico registrado.</p>
            ) : (
              data.responsible_history.map((item) => (
                <div
                  className="flex items-center justify-between gap-4 border-b border-dashed border-border py-3 last:border-b-0"
                  key={item.id}
                >
                  <div>
                    <strong className="text-sm font-semibold">
                      {item.person.name}
                    </strong>
                    <p className="text-sm text-muted">
                      {item.person.phone ?? "-"} • {item.start_at}
                    </p>
                  </div>
                  <span className="text-sm text-muted">
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
