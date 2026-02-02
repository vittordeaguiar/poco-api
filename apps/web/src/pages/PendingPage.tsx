import {
  AlertTriangle,
  Search,
  SlidersHorizontal,
  UserPlus
} from "lucide-react";
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
    <section className="grid gap-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="inline-flex items-center gap-2 text-[1.4rem] font-title">
            <AlertTriangle className="h-5 w-5 text-accent" />
            Pendências
          </h2>
          <p className="text-sm text-muted">Casas com dados incompletos.</p>
        </div>
      </div>

      {toast ? (
        <div className="sticky top-[72px] rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-accent-contrast shadow-soft">
          {toast}
        </div>
      ) : null}

      <div className="grid gap-4 rounded-card border border-border bg-bg-strong p-5 shadow-card">
        <label className="grid gap-2 text-sm">
          <span className="inline-flex items-center gap-2">
            <Search className="h-4 w-4 text-accent" />
            Buscar
          </span>
          <input
            type="text"
            placeholder="Rua, número ou responsável"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="rounded-2xl border border-border bg-bg-strong px-3.5 py-2.5 text-base text-text focus:border-accent focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
          />
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
            <SlidersHorizontal className="h-4 w-4 text-accent" />
            Filtros
          </span>
          {Object.entries(reasonLabels).map(([key, label]) => (
            <label className="flex items-center gap-2 text-sm text-muted" key={key}>
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
        <div className="rounded-card border border-border bg-bg-strong p-5 shadow-card">
          <p className="text-sm text-muted">Carregando pendências...</p>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-card border border-border bg-bg-strong p-5 shadow-card">
          <p className="text-sm text-danger">{error}</p>
        </div>
      ) : null}

      {!isLoading && !error && filteredItems.length === 0 ? (
        <div className="rounded-card border border-border bg-bg-strong p-5 shadow-card">
          <p className="text-sm text-muted">Nenhuma pendência encontrada.</p>
        </div>
      ) : null}

      {!isLoading && !error
        ? filteredItems.map((item) => (
            <div
              className="grid gap-4 rounded-card border border-border bg-bg-strong p-5 shadow-card"
              key={item.id}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <strong className="text-sm font-semibold">
                    {item.street ?? "(sem rua)"}, {item.house_number ?? "s/n"}
                  </strong>
                  <p className="text-sm text-muted">
                    {item.responsible_current
                      ? `Responsável: ${item.responsible_current.name}`
                      : "Sem responsável atual"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {item.pending_reasons.map((reason) => (
                    <span
                      className="inline-flex items-center rounded-pill bg-accent-soft px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.04em] text-warning"
                      key={reason}
                    >
                      {reasonLabels[reason] ?? reason}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  className="inline-flex items-center gap-2 rounded-pill border border-border bg-bg-strong px-4 py-2 text-sm font-semibold text-text"
                  to={`/houses/${item.id}`}
                >
                  <UserPlus className="h-4 w-4" />
                  Editar casa
                </Link>
              </div>

              <div className="grid gap-4 rounded-card border border-border bg-accent-soft p-5">
                <strong className="inline-flex items-center gap-2 text-sm font-semibold">
                  <UserPlus className="h-4 w-4 text-accent" />
                  Definir responsável
                </strong>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="grid gap-2 text-sm">
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
                      className="rounded-2xl border border-border bg-bg-strong px-3.5 py-2.5 text-base text-text focus:border-accent focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
                    />
                  </label>
                  <label className="grid gap-2 text-sm">
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
                      className="rounded-2xl border border-border bg-bg-strong px-3.5 py-2.5 text-base text-text focus:border-accent focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
                    />
                  </label>
                </div>
                {assignError[item.id] ? (
                  <p className="text-sm text-danger">{assignError[item.id]}</p>
                ) : null}
                <div className="flex justify-end">
                  <button
                    className="inline-flex items-center gap-2 rounded-pill bg-accent px-5 py-2 text-sm font-bold text-accent-contrast shadow-soft transition active:translate-y-px active:shadow-none disabled:cursor-not-allowed disabled:opacity-60"
                    type="button"
                    disabled={assignLoading[item.id]}
                    onClick={() => handleAssign(item.id)}
                  >
                    <UserPlus className="h-4 w-4" />
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
