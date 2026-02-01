import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../lib/api";

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
      setFormError(
        error instanceof Error ? error.message : "Falha ao salvar casa."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="stack">
      <header className="section-header">
        <div>
          <h2>Casas</h2>
          <p className="muted">Busca rápida e status das casas</p>
        </div>
        <button className="primary" onClick={() => setIsModalOpen(true)}>
          + Nova casa
        </button>
      </header>

      {toast ? <div className="toast">{toast}</div> : null}

      <div className="card">
        {isLoading ? <p className="muted">Carregando...</p> : null}
        {loadError ? <p className="error">{loadError}</p> : null}
        {!isLoading && !loadError && houses.length === 0 ? (
          <p className="muted">Nenhuma casa cadastrada ainda.</p>
        ) : null}

        {!isLoading &&
          !loadError &&
          houses.map((house) => (
            <div className="list-item" key={house.id}>
              <div>
                <strong>
                  {house.street ?? "(sem rua)"}, {house.house_number ?? "s/n"}
                </strong>
                <p className="muted">
                  {house.responsible_current
                    ? `Responsável: ${house.responsible_current.name}`
                    : "Sem responsável"}
                </p>
              </div>
              <Link className="link" to={`/houses/${house.id}`}>
                Ver
              </Link>
            </div>
          ))}
      </div>

      {isModalOpen ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="modal-header">
              <div>
                <p className="eyebrow">Cadastro rápido</p>
                <h3>Nova casa</h3>
              </div>
              <button
                className="link button-link"
                onClick={() => setIsModalOpen(false)}
              >
                Fechar
              </button>
            </div>

            <form className="stack" onSubmit={handleSubmit}>
              <div className="field">
                <span>Rua</span>
                <input
                  type="text"
                  placeholder="Rua principal"
                  value={street}
                  onChange={(event) => setStreet(event.target.value)}
                />
              </div>

              <div className="form-row">
                <label className="field">
                  <span>Número</span>
                  <input
                    type="text"
                    placeholder="123"
                    value={houseNumber}
                    onChange={(event) => setHouseNumber(event.target.value)}
                    required
                  />
                </label>
                <label className="field">
                  <span>CEP</span>
                  <input
                    type="text"
                    placeholder="00000-000"
                    value={cep}
                    onChange={(event) => setCep(event.target.value)}
                  />
                </label>
              </div>

              <div className="form-row">
                <label className="field">
                  <span>Referência</span>
                  <input
                    type="text"
                    placeholder="Perto do mercado"
                    value={reference}
                    onChange={(event) => setReference(event.target.value)}
                  />
                </label>
                <label className="field">
                  <span>Complemento</span>
                  <input
                    type="text"
                    placeholder="Casa A"
                    value={complement}
                    onChange={(event) => setComplement(event.target.value)}
                  />
                </label>
              </div>

              <label className="field">
                <span>Mensalidade (R$)</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={monthlyAmount}
                  onChange={(event) => setMonthlyAmount(event.target.value)}
                />
              </label>

              <div className="card muted-card">
                <strong>Responsável (opcional)</strong>
                <div className="form-row">
                  <label className="field">
                    <span>Nome</span>
                    <input
                      type="text"
                      placeholder="Nome do responsável"
                      value={responsibleName}
                      onChange={(event) => setResponsibleName(event.target.value)}
                    />
                  </label>
                  <label className="field">
                    <span>Telefone</span>
                    <input
                      type="text"
                      placeholder="(11) 99999-9999"
                      value={responsiblePhone}
                      onChange={(event) => setResponsiblePhone(event.target.value)}
                    />
                  </label>
                </div>
              </div>

              <div className="toggle-row">
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={reuseAddress}
                    onChange={(event) => setReuseAddress(event.target.checked)}
                  />
                  <span>Reutilizar endereço anterior</span>
                </label>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={modeQuadra}
                    onChange={(event) => setModeQuadra(event.target.checked)}
                  />
                  <span>Modo quadra</span>
                </label>
              </div>

              {modeQuadra ? (
                <p className="muted">
                  Modo quadra ativo: rua, CEP e referência permanecem até
                  desligar.
                </p>
              ) : null}

              {reuseAddress && !lastAddress ? (
                <p className="muted">Nenhum endereço salvo ainda.</p>
              ) : null}

              {formError ? <p className="error">{formError}</p> : null}

              <div className="form-actions">
                <button className="primary" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
};
