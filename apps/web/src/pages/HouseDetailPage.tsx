import {
  ArrowLeft,
  ClipboardList,
  CreditCard,
  Home,
  Pencil,
  Receipt,
  Trash2,
  User,
  Users
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { formatCurrency, formatPeriod } from "../lib/format";
import { Modal } from "../ui/Modal";

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
  const navigate = useNavigate();
  const [data, setData] = useState<HouseResponse["data"] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [paying, setPaying] = useState<Record<string, boolean>>({});
  const [methods, setMethods] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [editStreet, setEditStreet] = useState("");
  const [editHouseNumber, setEditHouseNumber] = useState("");
  const [editComplement, setEditComplement] = useState("");
  const [editCep, setEditCep] = useState("");
  const [editReference, setEditReference] = useState("");
  const [editMonthlyAmount, setEditMonthlyAmount] = useState("");
  const [editStatus, setEditStatus] =
    useState<HouseDetail["status"]>("active");

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

  const houseStatusLabel = (status: HouseDetail["status"]) => {
    switch (status) {
      case "active":
        return "ATIVO";
      case "inactive":
        return "INATIVO";
      case "pending":
        return "PENDENTE";
    }
  };

  const openEditModal = () => {
    if (!data?.house) {
      return;
    }
    setEditStreet(data.house.street ?? "");
    setEditHouseNumber(data.house.house_number ?? "");
    setEditComplement(data.house.complement ?? "");
    setEditCep(data.house.cep ?? "");
    setEditReference(data.house.reference ?? "");
    setEditMonthlyAmount(
      String((data.house.monthly_amount_cents ?? 0) / 100)
    );
    setEditStatus(data.house.status);
    setEditError(null);
    setIsEditOpen(true);
  };

  const handleUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!id) {
      return;
    }

    setEditError(null);
    const amountValue = Number.parseFloat(
      editMonthlyAmount.replace(",", ".")
    );
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      setEditError("Informe uma mensalidade válida.");
      return;
    }

    setIsSaving(true);
    try {
      await apiFetch(`/houses/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          house: {
            street: editStreet,
            house_number: editHouseNumber,
            complement: editComplement,
            cep: editCep,
            reference: editReference,
            monthly_amount_cents: Math.round(amountValue * 100),
            status: editStatus
          }
        })
      });
      setToast("Casa atualizada com sucesso.");
      setIsEditOpen(false);
      await loadHouse();
    } catch (err) {
      setEditError(
        err instanceof Error ? err.message : "Falha ao atualizar casa."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) {
      return;
    }

    setDeleteError(null);
    setIsDeleting(true);
    try {
      await apiFetch(`/houses/${id}`, { method: "DELETE" });
      navigate("/houses");
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : "Falha ao excluir casa."
      );
    } finally {
      setIsDeleting(false);
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
        <div className="flex flex-wrap items-center gap-2">
          <button
            className="inline-flex items-center gap-2 rounded-pill border border-border bg-bg-strong px-4 py-2 text-sm font-semibold text-text"
            type="button"
            onClick={openEditModal}
          >
            <Pencil className="h-4 w-4" />
            Editar
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-pill border border-danger/40 bg-bg-strong px-4 py-2 text-sm font-semibold text-danger"
            type="button"
            onClick={() => {
              setDeleteError(null);
              setIsDeleteOpen(true);
            }}
          >
            <Trash2 className="h-4 w-4" />
            Excluir
          </button>
          <Link
            className="inline-flex items-center gap-2 text-sm font-semibold text-text"
            to="/houses"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
        </div>
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
                  {houseStatusLabel(data.house.status)}
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
              Últimas faturas
            </p>
            {data.invoices.length === 0 ? (
              <p className="text-sm text-muted">Nenhuma fatura encontrada.</p>
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

      <Modal
        isOpen={isEditOpen}
        title="Editar casa"
        eyebrow="Atualização"
        onClose={() => setIsEditOpen(false)}
        footer={
          <button
            className="inline-flex items-center gap-2 rounded-pill bg-accent px-5 py-2 text-sm font-bold text-accent-contrast shadow-soft transition active:translate-y-px active:shadow-none disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            form="edit-house-form"
            disabled={isSaving}
          >
            <Pencil className="h-4 w-4" />
            {isSaving ? "Salvando..." : "Salvar alterações"}
          </button>
        }
      >
        <form
          className="grid gap-4"
          id="edit-house-form"
          onSubmit={handleUpdate}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm">
              <span>Rua</span>
              <input
                type="text"
                value={editStreet}
                onChange={(event) => setEditStreet(event.target.value)}
                className="rounded-2xl border border-border bg-bg-strong px-3.5 py-2.5 text-base text-text focus:border-accent focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
              />
            </label>
            <label className="grid gap-2 text-sm">
              <span>Número</span>
              <input
                type="text"
                value={editHouseNumber}
                onChange={(event) => setEditHouseNumber(event.target.value)}
                className="rounded-2xl border border-border bg-bg-strong px-3.5 py-2.5 text-base text-text focus:border-accent focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm">
              <span>CEP</span>
              <input
                type="text"
                value={editCep}
                onChange={(event) => setEditCep(event.target.value)}
                className="rounded-2xl border border-border bg-bg-strong px-3.5 py-2.5 text-base text-text focus:border-accent focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
              />
            </label>
            <label className="grid gap-2 text-sm">
              <span>Referência</span>
              <input
                type="text"
                value={editReference}
                onChange={(event) => setEditReference(event.target.value)}
                className="rounded-2xl border border-border bg-bg-strong px-3.5 py-2.5 text-base text-text focus:border-accent focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
              />
            </label>
          </div>

          <label className="grid gap-2 text-sm">
            <span>Complemento</span>
            <input
              type="text"
              value={editComplement}
              onChange={(event) => setEditComplement(event.target.value)}
              className="rounded-2xl border border-border bg-bg-strong px-3.5 py-2.5 text-base text-text focus:border-accent focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm">
              <span>Mensalidade (R$)</span>
              <input
                type="text"
                inputMode="decimal"
                value={editMonthlyAmount}
                onChange={(event) => setEditMonthlyAmount(event.target.value)}
                className="rounded-2xl border border-border bg-bg-strong px-3.5 py-2.5 text-base text-text focus:border-accent focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
              />
            </label>
            <label className="grid gap-2 text-sm">
              <span>Status</span>
              <select
                value={editStatus}
                onChange={(event) =>
                  setEditStatus(event.target.value as HouseDetail["status"])
                }
                className="rounded-2xl border border-border bg-bg-strong px-3.5 py-2.5 text-base text-text focus:border-accent focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
              >
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
                <option value="pending">Pendente</option>
              </select>
            </label>
          </div>

          {editError ? (
            <p className="text-sm text-danger">{editError}</p>
          ) : null}
        </form>
      </Modal>

      <Modal
        isOpen={isDeleteOpen}
        title="Excluir casa"
        eyebrow="Atenção"
        onClose={() => setIsDeleteOpen(false)}
        footer={
          <button
            className="inline-flex items-center gap-2 rounded-pill bg-danger px-5 py-2 text-sm font-bold text-danger-contrast shadow-soft transition active:translate-y-px active:shadow-none disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4" />
            {isDeleting ? "Excluindo..." : "Confirmar exclusão"}
          </button>
        }
      >
        <div className="grid gap-3 text-sm text-muted">
          <p>Essa ação remove a casa e seus registros vinculados.</p>
          <p>Não é possível desfazer.</p>
          {deleteError ? (
            <p className="text-sm text-danger">{deleteError}</p>
          ) : null}
        </div>
      </Modal>
    </section>
  );
};
