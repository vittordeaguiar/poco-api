import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../lib/api";

const reasonLabels: Record<string, string> = {
  missing_street: "Rua",
  missing_house_number: "Número",
  missing_responsible: "Responsável"
};

type PendingItem = {
  id: string;
  street: string | null;
  house_number: string | null;
  status: string;
  responsible_current: { id: string; name: string; phone: string | null } | null;
  pending_reasons: string[];
};

type PendingResponse = {
  data: {
    items: PendingItem[];
  };
};

export const PendingPage = () => {
  const [items, setItems] = useState<PendingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [filters, setFilters] = useState({
    missing_street: true,
    missing_house_number: true,
    missing_responsible: true
  });

  const [assignName, setAssignName] = useState<Record<string, string>>({});
  const [assignPhone, setAssignPhone] = useState<Record<string, string>>({});
  const [assignLoading, setAssignLoading] = useState<Record<string, boolean>>({});
  const [assignError, setAssignError] = useState<Record<string, string | null>>(
    {}
  );

  const loadPending = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = (await apiFetch("/houses/pending")) as PendingResponse;
      setItems(response.data.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPending();
  }, []);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timer = window.setTimeout(() => setToast(null), 2500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchesFilter = item.pending_reasons.some(
        (reason) => filters[reason as keyof typeof filters]
      );
      if (!matchesFilter) {
        return false;
      }
      if (!term) {
        return true;
      }
      const address = `${item.street ?? ""} ${item.house_number ?? ""}`
        .trim()
        .toLowerCase();
      const responsible = item.responsible_current?.name?.toLowerCase() ?? "";
      return address.includes(term) || responsible.includes(term);
    });
  }, [items, filters, search]);

  const handleAssign = async (houseId: string) => {
    const name = assignName[houseId]?.trim() ?? "";
    const phone = assignPhone[houseId]?.trim() ?? "";

    if (!name) {
      setAssignError((prev) => ({
        ...prev,
        [houseId]: "Informe o nome do responsável."
      }));
      return;
    }

    setAssignError((prev) => ({ ...prev, [houseId]: null }));
    setAssignLoading((prev) => ({ ...prev, [houseId]: true }));

    try {
      await apiFetch(`/houses/${houseId}/responsible`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name, phone: phone || undefined })
      });
      setToast("Responsável atualizado.");
      setAssignName((prev) => ({ ...prev, [houseId]: "" }));
      setAssignPhone((prev) => ({ ...prev, [houseId]: "" }));
      await loadPending();
    } catch (err) {
      setAssignError((prev) => ({
        ...prev,
        [houseId]: err instanceof Error ? err.message : "Falha ao salvar."
      }));
    } finally {
      setAssignLoading((prev) => ({ ...prev, [houseId]: false }));
    }
  };

  return (
    <section className="stack">
      <div className="section-header">
        <div>
          <h2>Pendências</h2>
          <p className="muted">Casas com dados incompletos.</p>
        </div>
      </div>

      {toast ? <div className="toast">{toast}</div> : null}

      <div className="card stack">
        <label className="field">
          <span>Buscar</span>
          <input
            type="text"
            placeholder="Rua, número ou responsável"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>

        <div className="filter-row">
          {Object.entries(reasonLabels).map(([key, label]) => (
            <label className="toggle" key={key}>
              <input
                type="checkbox"
                checked={filters[key as keyof typeof filters]}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    [key]: event.target.checked
                  }))
                }
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="card">
          <p className="muted">Carregando pendências...</p>
        </div>
      ) : null}

      {error ? (
        <div className="card">
          <p className="error">{error}</p>
        </div>
      ) : null}

      {!isLoading && !error && filteredItems.length === 0 ? (
        <div className="card">
          <p className="muted">Nenhuma pendência encontrada.</p>
        </div>
      ) : null}

      {!isLoading && !error
        ? filteredItems.map((item) => (
            <div className="card stack" key={item.id}>
              <div className="section-header">
                <div>
                  <strong>
                    {item.street ?? "(sem rua)"}, {item.house_number ?? "s/n"}
                  </strong>
                  <p className="muted">
                    {item.responsible_current
                      ? `Responsável: ${item.responsible_current.name}`
                      : "Sem responsável atual"}
                  </p>
                </div>
                <div className="pill-row">
                  {item.pending_reasons.map((reason) => (
                    <span className="status-pill status-pending" key={reason}>
                      {reasonLabels[reason] ?? reason}
                    </span>
                  ))}
                </div>
              </div>

              <div className="action-row">
                <Link className="ghost" to={`/houses/${item.id}`}>
                  Editar casa
                </Link>
              </div>

              <div className="card muted-card">
                <strong>Definir responsável</strong>
                <div className="form-row">
                  <label className="field">
                    <span>Nome</span>
                    <input
                      type="text"
                      value={assignName[item.id] ?? ""}
                      onChange={(event) =>
                        setAssignName((prev) => ({
                          ...prev,
                          [item.id]: event.target.value
                        }))
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Telefone</span>
                    <input
                      type="text"
                      value={assignPhone[item.id] ?? ""}
                      onChange={(event) =>
                        setAssignPhone((prev) => ({
                          ...prev,
                          [item.id]: event.target.value
                        }))
                      }
                    />
                  </label>
                </div>
                {assignError[item.id] ? (
                  <p className="error">{assignError[item.id]}</p>
                ) : null}
                <div className="form-actions">
                  <button
                    className="primary"
                    type="button"
                    disabled={assignLoading[item.id]}
                    onClick={() => handleAssign(item.id)}
                  >
                    {assignLoading[item.id]
                      ? "Salvando..."
                      : "Salvar responsável"}
                  </button>
                </div>
              </div>
            </div>
          ))
        : null}
    </section>
  );
};
