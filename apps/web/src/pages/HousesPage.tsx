import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { apiDownload, apiFetch } from "../lib/api";
import { addToQueue, getQueueCount, isNetworkError } from "../lib/offlineQueue";
import { Modal } from "../ui/Modal";

const defaultMonthlyAmount = "90";
const quadraStorageKey = "poco_quadra";

type HouseListItem = {
  id: string;
  street: string | null;
  house_number: string | null;
  status: "active" | "inactive" | "pending";
  responsible_current: { name: string; phone: string | null } | null;
};

type HousesResponse = {
  data: {
    items: HouseListItem[];
  };
};

type AddressSnapshot = {
  street: string;
  cep: string;
  reference: string;
  complement: string;
};

export const HousesPage = () => {
  const formId = useId();
  const [houses, setHouses] = useState<HouseListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [street, setStreet] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [cep, setCep] = useState("");
  const [reference, setReference] = useState("");
  const [complement, setComplement] = useState("");
  const [monthlyAmount, setMonthlyAmount] = useState(defaultMonthlyAmount);
  const [responsibleName, setResponsibleName] = useState("");
  const [responsiblePhone, setResponsiblePhone] = useState("");

  const [reuseAddress, setReuseAddress] = useState(false);
  const [modeQuadra, setModeQuadra] = useState(false);
  const [lastAddress, setLastAddress] = useState<AddressSnapshot | null>(null);

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);

  const addressSnapshot = useMemo(
    () => ({ street, cep, reference, complement }),
    [street, cep, reference, complement]
  );

  const loadHouses = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const response = (await apiFetch("/houses")) as HousesResponse;
      setHouses(response.data.items ?? []);
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Falha ao carregar casas."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHouses();
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(quadraStorageKey);
    if (!stored) {
      return;
    }

    try {
      const parsed = JSON.parse(stored) as Partial<AddressSnapshot>;
      if (parsed.street) {
        setStreet(parsed.street);
      }
      if (parsed.cep) {
        setCep(parsed.cep);
      }
      if (parsed.reference) {
        setReference(parsed.reference);
      }
      setModeQuadra(true);
    } catch {
      localStorage.removeItem(quadraStorageKey);
    }
  }, []);

  useEffect(() => {
    if (reuseAddress && lastAddress) {
      setStreet(lastAddress.street);
      setCep(lastAddress.cep);
      setReference(lastAddress.reference);
      setComplement(lastAddress.complement);
    }
  }, [reuseAddress, lastAddress]);

  useEffect(() => {
    if (!modeQuadra) {
      localStorage.removeItem(quadraStorageKey);
      return;
    }

    localStorage.setItem(
      quadraStorageKey,
      JSON.stringify({ street, cep, reference })
    );
  }, [modeQuadra, street, cep, reference]);

  const showToast = (message: string) => {
    setToast(message);
    if (toastTimer.current) {
      window.clearTimeout(toastTimer.current);
    }
    toastTimer.current = window.setTimeout(() => setToast(null), 2500);
  };

  const resetAfterSave = (savedAddress: AddressSnapshot) => {
    setHouseNumber("");
    setResponsibleName("");
    setResponsiblePhone("");

    if (reuseAddress) {
      setStreet(savedAddress.street);
      setCep(savedAddress.cep);
      setReference(savedAddress.reference);
      setComplement(savedAddress.complement);
    }
  };

  const validateForm = () => {
    if (!houseNumber.trim()) {
      return "Informe o número da casa.";
    }

    if (responsiblePhone.trim() && !responsibleName.trim()) {
      return "Informe o nome do responsável ao preencher o telefone.";
    }

    if (monthlyAmount.trim()) {
      const value = Number.parseFloat(monthlyAmount.replace(",", "."));
      if (!Number.isFinite(value) || value <= 0) {
        return "Informe um valor mensal válido.";
      }
    }

    return null;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    const amountValue = monthlyAmount.trim()
      ? Number.parseFloat(monthlyAmount.replace(",", "."))
      : NaN;
    const monthly_amount_cents = Number.isFinite(amountValue)
      ? Math.round(amountValue * 100)
      : undefined;

    const payload: {
      house: {
        street?: string;
        house_number?: string;
        cep?: string;
        reference?: string;
        complement?: string;
        monthly_amount_cents?: number;
      };
      responsible?: {
        name: string;
        phone?: string;
      };
    } = {
      house: {
        street: street.trim() || undefined,
        house_number: houseNumber.trim() || undefined,
        cep: cep.trim() || undefined,
        reference: reference.trim() || undefined,
        complement: complement.trim() || undefined,
        monthly_amount_cents
      }
    };

    if (responsibleName.trim()) {
      payload.responsible = {
        name: responsibleName.trim(),
        phone: responsiblePhone.trim() || undefined
      };
    }

    setIsSubmitting(true);
    try {
      await apiFetch("/houses/quick", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      setLastAddress(addressSnapshot);
      resetAfterSave(addressSnapshot);
      showToast("Casa cadastrada com sucesso!");
      loadHouses();
    } catch (error) {
      if (isNetworkError(error)) {
        addToQueue({
          id: crypto.randomUUID(),
          type: "houses_quick",
          payload,
          created_at: new Date().toISOString()
        });
        setLastAddress(addressSnapshot);
        resetAfterSave(addressSnapshot);
        const count = getQueueCount();
        showToast(
          `Sem conexão. Salvo na fila para sincronizar (${count} pendências).`
        );
      } else {
        setFormError(
          error instanceof Error ? error.message : "Falha ao salvar casa."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="grid gap-5">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[1.4rem] font-title">Casas</h2>
          <p className="text-sm text-muted">Busca rápida e status das casas</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="rounded-pill border border-border bg-bg-strong px-4 py-2 text-sm font-semibold text-text"
            type="button"
            onClick={() => apiDownload("/export/houses.csv", "houses.csv")}
          >
            Exportar CSV
          </button>
          <button
            className="rounded-pill bg-accent px-5 py-2 text-sm font-bold text-accent-contrast shadow-soft transition active:translate-y-px active:shadow-none"
            onClick={() => setIsModalOpen(true)}
          >
            + Nova casa
          </button>
        </div>
      </header>

      {toast ? (
        <div className="sticky top-[72px] rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-accent-contrast shadow-soft">
          {toast}
        </div>
      ) : null}

      <div className="rounded-card border border-border bg-bg-strong p-5 shadow-card">
        {isLoading ? <p className="text-sm text-muted">Carregando...</p> : null}
        {loadError ? <p className="text-sm text-danger">{loadError}</p> : null}
        {!isLoading && !loadError && houses.length === 0 ? (
          <p className="text-sm text-muted">Nenhuma casa cadastrada ainda.</p>
        ) : null}

        {!isLoading &&
          !loadError &&
          houses.map((house) => (
            <div
              className="flex items-center justify-between gap-4 border-b border-dashed border-border py-3 last:border-b-0"
              key={house.id}
            >
              <div>
                <strong className="text-sm font-semibold">
                  {house.street ?? "(sem rua)"}, {house.house_number ?? "s/n"}
                </strong>
                <p className="text-sm text-muted">
                  {house.responsible_current
                    ? `Responsável: ${house.responsible_current.name}`
                    : "Sem responsável"}
                </p>
              </div>
              <Link
                className="text-sm font-semibold text-text transition hover:opacity-80"
                to={`/houses/${house.id}`}
              >
                Ver
              </Link>
            </div>
          ))}
      </div>

      <Modal
        isOpen={isModalOpen}
        title="Nova casa"
        eyebrow="Cadastro rápido"
        onClose={() => setIsModalOpen(false)}
        footer={
          <div className="flex justify-end">
            <button
              className="rounded-pill bg-accent px-5 py-2 text-sm font-bold text-accent-contrast shadow-soft transition active:translate-y-px active:shadow-none disabled:cursor-not-allowed disabled:opacity-60"
              type="submit"
              form={formId}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Salvando..." : "Salvar"}
            </button>
          </div>
        }
      >
        <form className="grid gap-4" id={formId} onSubmit={handleSubmit}>
          <div className="grid gap-2 text-sm">
            <span>Rua</span>
            <input
              type="text"
              placeholder="Rua principal"
              value={street}
              onChange={(event) => setStreet(event.target.value)}
              className="rounded-2xl border border-border bg-bg-strong px-3.5 py-2.5 text-base text-text focus:border-accent focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm">
              <span>Número</span>
              <input
                type="text"
                placeholder="123"
                value={houseNumber}
                onChange={(event) => setHouseNumber(event.target.value)}
                required
                className="rounded-2xl border border-border bg-bg-strong px-3.5 py-2.5 text-base text-text focus:border-accent focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
              />
            </label>
            <label className="grid gap-2 text-sm">
              <span>CEP</span>
              <input
                type="text"
                placeholder="00000-000"
                value={cep}
                onChange={(event) => setCep(event.target.value)}
                className="rounded-2xl border border-border bg-bg-strong px-3.5 py-2.5 text-base text-text focus:border-accent focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm">
              <span>Referência</span>
              <input
                type="text"
                placeholder="Perto do mercado"
                value={reference}
                onChange={(event) => setReference(event.target.value)}
                className="rounded-2xl border border-border bg-bg-strong px-3.5 py-2.5 text-base text-text focus:border-accent focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
              />
            </label>
            <label className="grid gap-2 text-sm">
              <span>Complemento</span>
              <input
                type="text"
                placeholder="Casa A"
                value={complement}
                onChange={(event) => setComplement(event.target.value)}
                className="rounded-2xl border border-border bg-bg-strong px-3.5 py-2.5 text-base text-text focus:border-accent focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
              />
            </label>
          </div>

          <label className="grid gap-2 text-sm">
            <span>Mensalidade (R$)</span>
            <input
              type="text"
              inputMode="decimal"
              value={monthlyAmount}
              onChange={(event) => setMonthlyAmount(event.target.value)}
              className="rounded-2xl border border-border bg-bg-strong px-3.5 py-2.5 text-base text-text focus:border-accent focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
            />
          </label>

          <div className="grid gap-4 rounded-card border border-border bg-accent-soft p-5">
            <strong className="text-sm font-semibold">Responsável (opcional)</strong>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm">
                <span>Nome</span>
                <input
                  type="text"
                  placeholder="Nome do responsável"
                  value={responsibleName}
                  onChange={(event) => setResponsibleName(event.target.value)}
                  className="rounded-2xl border border-border bg-bg-strong px-3.5 py-2.5 text-base text-text focus:border-accent focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
                />
              </label>
              <label className="grid gap-2 text-sm">
                <span>Telefone</span>
                <input
                  type="text"
                  placeholder="(11) 99999-9999"
                  value={responsiblePhone}
                  onChange={(event) => setResponsiblePhone(event.target.value)}
                  className="rounded-2xl border border-border bg-bg-strong px-3.5 py-2.5 text-base text-text focus:border-accent focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
                />
              </label>
            </div>
          </div>

          <div className="grid gap-2">
            <label className="flex items-center gap-2 text-sm text-muted">
              <input
                type="checkbox"
                checked={reuseAddress}
                onChange={(event) => setReuseAddress(event.target.checked)}
              />
              <span>Reutilizar endereço anterior</span>
            </label>
            <label className="flex items-center gap-2 text-sm text-muted">
              <input
                type="checkbox"
                checked={modeQuadra}
                onChange={(event) => setModeQuadra(event.target.checked)}
              />
              <span>Modo quadra</span>
            </label>
          </div>

          {modeQuadra ? (
            <p className="text-sm text-muted">
              Modo quadra ativo: rua, CEP e referência permanecem até desligar.
            </p>
          ) : null}

          {reuseAddress && !lastAddress ? (
            <p className="text-sm text-muted">Nenhum endereço salvo ainda.</p>
          ) : null}

          {formError ? <p className="text-sm text-danger">{formError}</p> : null}
        </form>
      </Modal>
    </section>
  );
};
