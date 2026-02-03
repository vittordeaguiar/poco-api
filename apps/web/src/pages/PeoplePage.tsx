import {
  Eye,
  Link2,
  Pencil,
  Save,
  Search,
  UserPlus,
  Users
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "../lib/api";
import { Modal } from "../ui/Modal";

type Person = {
  id: string;
  name: string;
  phone: string | null;
  mobile: string | null;
  cpf: string | null;
  email: string | null;
  rg: string | null;
  notes: string | null;
  active_houses: number;
};

type PeopleResponse = {
  data: {
    items: Person[];
  };
};

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

export const PeoplePage = () => {
  const [people, setPeople] = useState<Person[]>([]);
  const [houses, setHouses] = useState<HouseListItem[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [mobile, setMobile] = useState("");
  const [cpf, setCpf] = useState("");
  const [email, setEmail] = useState("");
  const [rg, setRg] = useState("");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);

  const [linkingPerson, setLinkingPerson] = useState<Person | null>(null);
  const [selectedHouseId, setSelectedHouseId] = useState("");
  const [linkError, setLinkError] = useState<string | null>(null);
  const [isLinking, setIsLinking] = useState(false);

  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [isEditingPerson, setIsEditingPerson] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editMobile, setEditMobile] = useState("");
  const [editCpf, setEditCpf] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRg, setEditRg] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const houseOptions = useMemo(
    () =>
      houses.map((house) => {
        const address = `${house.street ?? "(sem rua)"}, ${
          house.house_number ?? "s/n"
        }`;
        const responsible = house.responsible_current
          ? ` — atual: ${house.responsible_current.name}`
          : "";
        return {
          value: house.id,
          label: `${address}${responsible}`
        };
      }),
    [houses]
  );

  const showToast = (message: string) => {
    setToast(message);
    if (toastTimer.current) {
      window.clearTimeout(toastTimer.current);
    }
    toastTimer.current = window.setTimeout(() => setToast(null), 2500);
  };

  const loadPeople = async (query = "") => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const params = query.trim() ? `?search=${encodeURIComponent(query)}` : "";
      const response = (await apiFetch(`/people${params}`)) as PeopleResponse;
      setPeople(response.data.items ?? []);
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Falha ao carregar responsáveis."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const loadHouses = async () => {
    try {
      const response = (await apiFetch("/houses")) as HousesResponse;
      setHouses(response.data.items ?? []);
    } catch {
      setHouses([]);
    }
  };

  useEffect(() => {
    loadPeople();
    loadHouses();
  }, []);

  const validateForm = () => {
    if (!name.trim()) {
      return "Informe o nome do responsável.";
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

    setIsSubmitting(true);
    try {
      await apiFetch("/people", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim() || undefined,
          mobile: mobile.trim() || undefined,
          cpf: cpf.trim() || undefined,
          email: email.trim() || undefined,
          rg: rg.trim() || undefined,
          notes: notes.trim() || undefined
        })
      });
      showToast("Responsável cadastrado com sucesso!");
      setName("");
      setPhone("");
      setMobile("");
      setCpf("");
      setEmail("");
      setRg("");
      setNotes("");
      loadPeople(search);
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Falha ao salvar responsável."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSearch = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    loadPeople(search);
  };

  const openLinkModal = (person: Person) => {
    setLinkingPerson(person);
    setSelectedHouseId("");
    setLinkError(null);
  };

  const closeLinkModal = () => {
    setLinkingPerson(null);
    setSelectedHouseId("");
    setLinkError(null);
  };

  const handleLink = async () => {
    if (!linkingPerson) {
      return;
    }
    if (!selectedHouseId) {
      setLinkError("Selecione uma casa para vincular.");
      return;
    }

    setIsLinking(true);
    setLinkError(null);

    try {
      await apiFetch(`/houses/${selectedHouseId}/responsible`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ person_id: linkingPerson.id })
      });
      showToast("Responsável vinculado à casa com sucesso!");
      closeLinkModal();
      loadPeople(search);
      loadHouses();
    } catch (error) {
      setLinkError(
        error instanceof Error ? error.message : "Falha ao vincular responsável."
      );
    } finally {
      setIsLinking(false);
    }
  };

  const openPersonModal = (person: Person) => {
    setSelectedPerson(person);
    setIsEditingPerson(false);
    setEditName(person.name ?? "");
    setEditPhone(person.phone ?? "");
    setEditMobile(person.mobile ?? "");
    setEditCpf(person.cpf ?? "");
    setEditEmail(person.email ?? "");
    setEditRg(person.rg ?? "");
    setEditNotes(person.notes ?? "");
    setUpdateError(null);
  };

  const closePersonModal = () => {
    setSelectedPerson(null);
    setIsEditingPerson(false);
    setUpdateError(null);
  };

  const startPersonEdit = () => {
    setIsEditingPerson(true);
    setUpdateError(null);
  };

  const handleUpdatePerson = async () => {
    if (!selectedPerson) {
      return;
    }

    if (!editName.trim()) {
      setUpdateError("Informe o nome do responsável.");
      return;
    }

    setIsUpdating(true);
    setUpdateError(null);

    try {
      await apiFetch(`/people/${selectedPerson.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: editName.trim(),
          phone: editPhone.trim() ? editPhone.trim() : null,
          mobile: editMobile.trim() ? editMobile.trim() : null,
          cpf: editCpf.trim() ? editCpf.trim() : null,
          email: editEmail.trim() ? editEmail.trim() : null,
          rg: editRg.trim() ? editRg.trim() : null,
          notes: editNotes.trim() ? editNotes.trim() : null
        })
      });
      showToast("Responsável atualizado com sucesso!");
      closePersonModal();
      loadPeople(search);
      loadHouses();
    } catch (error) {
      setUpdateError(
        error instanceof Error ? error.message : "Falha ao atualizar responsável."
      );
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <section className="grid gap-5">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="inline-flex items-center gap-2 text-[1.3rem] font-title">
            <Users className="h-5 w-5 text-accent" />
            Responsáveis
          </h2>
          <p className="text-sm text-muted">
            Cadastre pessoas e vincule com casas quando precisar.
          </p>
        </div>
      </header>

      {toast ? (
        <div className="sticky top-[72px] rounded-lg border border-border bg-bg-strong px-4 py-3 text-sm font-semibold text-text">
          {toast}
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
        <div className="card rounded-card p-5">
          <p className="inline-flex items-center gap-2 text-sm text-muted">
            <UserPlus className="h-4 w-4 text-accent" />
            Novo responsável
          </p>
          <form className="mt-4 grid gap-4" onSubmit={handleSubmit}>
            <label className="grid gap-2 text-sm">
              <span>Nome</span>
              <input
                type="text"
                placeholder="Nome completo"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="form-input"
                required
              />
            </label>
            <label className="grid gap-2 text-sm">
              <span>Telefone</span>
              <input
                type="tel"
                placeholder="(00) 00000-0000"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="form-input"
              />
            </label>
            <label className="grid gap-2 text-sm">
              <span>Celular</span>
              <input
                type="tel"
                placeholder="(00) 90000-0000"
                value={mobile}
                onChange={(event) => setMobile(event.target.value)}
                className="form-input"
              />
            </label>
            <label className="grid gap-2 text-sm">
              <span>Email</span>
              <input
                type="email"
                placeholder="exemplo@email.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="form-input"
              />
            </label>
            <label className="grid gap-2 text-sm">
              <span>CPF</span>
              <input
                type="text"
                inputMode="numeric"
                placeholder="000.000.000-00"
                value={cpf}
                onChange={(event) => setCpf(event.target.value)}
                className="form-input"
              />
            </label>
            <label className="grid gap-2 text-sm">
              <span>RG</span>
              <input
                type="text"
                placeholder="00.000.000-0"
                value={rg}
                onChange={(event) => setRg(event.target.value)}
                className="form-input"
              />
            </label>
            <label className="grid gap-2 text-sm">
              <span>Observações</span>
              <textarea
                placeholder="Ex: prefere contato por WhatsApp"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                className="form-textarea"
              />
            </label>
            {formError ? (
              <p className="rounded-lg border border-dashed border-danger/50 bg-danger/10 px-3 py-2 text-xs text-danger">
                {formError}
              </p>
            ) : null}
            <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
              <Save className="h-4 w-4" />
              {isSubmitting ? "Salvando..." : "Salvar"}
            </button>
          </form>
        </div>

        <div className="card rounded-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="inline-flex items-center gap-2 text-sm text-muted">
              <Users className="h-4 w-4 text-accent" />
              Lista de responsáveis
            </p>
            <form
              className="flex w-full flex-wrap items-center gap-2 md:w-auto"
              onSubmit={handleSearch}
            >
              <div className="flex w-full items-center gap-2 rounded-lg border border-border bg-bg-strong px-3 py-2 text-sm md:w-[240px]">
                <Search className="h-4 w-4 text-muted" />
                <input
                  type="search"
                  placeholder="Buscar por nome"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="w-full bg-transparent text-sm text-text focus:outline-none"
                />
              </div>
              <button
                className="btn btn-sm"
                type="submit"
              >
                Filtrar
              </button>
            </form>
          </div>

          <div className="mt-4 grid gap-3">
            {isLoading ? (
              <p className="text-sm text-muted">Carregando...</p>
            ) : null}
            {loadError ? (
              <p className="text-sm text-danger">{loadError}</p>
            ) : null}
            {!isLoading && !loadError && people.length === 0 ? (
              <p className="text-sm text-muted">
                Nenhum responsável cadastrado ainda.
              </p>
            ) : null}

            {!isLoading &&
              !loadError &&
              people.map((person) => (
                <div
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-bg-strong px-4 py-3"
                  key={person.id}
                >
                  <div>
                    <strong className="text-sm font-semibold">
                      {person.name}
                    </strong>
                    <p className="text-sm text-muted">
                      {person.phone ?? "Sem telefone"}
                      {person.mobile ? ` · Cel: ${person.mobile}` : ""}
                    </p>
                    <p className="text-sm text-muted">
                      {person.email ?? "Sem email"}
                    </p>
                    <p className="text-xs text-muted">
                      {person.cpf ? `CPF: ${person.cpf}` : "CPF não informado"}
                      {person.rg ? ` · RG: ${person.rg}` : ""}
                    </p>
                    <p className="text-xs text-muted">
                      Casas ativas: {person.active_houses}
                    </p>
                  </div>
                  <button
                    className="btn btn-sm"
                    type="button"
                    onClick={() => openLinkModal(person)}
                  >
                    <Link2 className="h-4 w-4" />
                    Vincular casa
                  </button>
                </div>
              ))}
          </div>
        </div>
      </div>

      <Modal
        isOpen={Boolean(selectedPerson)}
        title="Detalhes do responsável"
        eyebrow="Cadastro"
        onClose={closePersonModal}
        footer={
          isEditingPerson ? (
            <>
              <button
                className="inline-flex items-center gap-2 rounded-pill border border-border bg-bg-strong px-4 py-2 text-sm font-semibold text-text"
                type="button"
                onClick={() => setIsEditingPerson(false)}
                disabled={isUpdating}
              >
                Cancelar edição
              </button>
              <button
                className="inline-flex items-center gap-2 rounded-pill bg-accent px-5 py-2 text-sm font-bold text-accent-contrast shadow-soft transition active:translate-y-px active:shadow-none disabled:cursor-not-allowed disabled:opacity-60"
                type="button"
                onClick={handleUpdatePerson}
                disabled={isUpdating}
              >
                <Save className="h-4 w-4" />
                {isUpdating ? "Salvando..." : "Salvar alterações"}
              </button>
            </>
          ) : (
            <>
              <button
                className="inline-flex items-center gap-2 rounded-pill border border-border bg-bg-strong px-4 py-2 text-sm font-semibold text-text"
                type="button"
                onClick={closePersonModal}
              >
                Fechar
              </button>
              <button
                className="inline-flex items-center gap-2 rounded-pill bg-accent px-5 py-2 text-sm font-bold text-accent-contrast shadow-soft transition active:translate-y-px active:shadow-none"
                type="button"
                onClick={startPersonEdit}
              >
                <Pencil className="h-4 w-4" />
                Editar
              </button>
            </>
          )
        }
      >
        {isEditingPerson ? (
          <div className="grid gap-4">
            <label className="grid gap-2 text-sm">
              <span>Nome</span>
              <input
                type="text"
                placeholder="Nome completo"
                value={editName}
                onChange={(event) => setEditName(event.target.value)}
                className="rounded-2xl border border-border bg-bg-strong px-3.5 py-2.5 text-base text-text focus:border-accent focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
                required
              />
            </label>
            <label className="grid gap-2 text-sm">
              <span>Telefone</span>
              <input
                type="tel"
                placeholder="(00) 00000-0000"
                value={editPhone}
                onChange={(event) => setEditPhone(event.target.value)}
                className="rounded-2xl border border-border bg-bg-strong px-3.5 py-2.5 text-base text-text focus:border-accent focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
              />
            </label>
            <label className="grid gap-2 text-sm">
              <span>Celular</span>
              <input
                type="tel"
                placeholder="(00) 90000-0000"
                value={editMobile}
                onChange={(event) => setEditMobile(event.target.value)}
                className="rounded-2xl border border-border bg-bg-strong px-3.5 py-2.5 text-base text-text focus:border-accent focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
              />
            </label>
            <label className="grid gap-2 text-sm">
              <span>Email</span>
              <input
                type="email"
                placeholder="exemplo@email.com"
                value={editEmail}
                onChange={(event) => setEditEmail(event.target.value)}
                className="rounded-2xl border border-border bg-bg-strong px-3.5 py-2.5 text-base text-text focus:border-accent focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
              />
            </label>
            <label className="grid gap-2 text-sm">
              <span>CPF</span>
              <input
                type="text"
                inputMode="numeric"
                placeholder="000.000.000-00"
                value={editCpf}
                onChange={(event) => setEditCpf(event.target.value)}
                className="rounded-2xl border border-border bg-bg-strong px-3.5 py-2.5 text-base text-text focus:border-accent focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
              />
            </label>
            <label className="grid gap-2 text-sm">
              <span>RG</span>
              <input
                type="text"
                placeholder="00.000.000-0"
                value={editRg}
                onChange={(event) => setEditRg(event.target.value)}
                className="rounded-2xl border border-border bg-bg-strong px-3.5 py-2.5 text-base text-text focus:border-accent focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
              />
            </label>
            <label className="grid gap-2 text-sm">
              <span>Observações</span>
              <textarea
                placeholder="Ex: prefere contato por WhatsApp"
                value={editNotes}
                onChange={(event) => setEditNotes(event.target.value)}
                className="min-h-[90px] rounded-2xl border border-border bg-bg-strong px-3.5 py-2.5 text-base text-text focus:border-accent focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
              />
            </label>
            {updateError ? (
              <p className="rounded-xl border border-dashed border-danger/50 bg-danger/10 px-3 py-2 text-xs text-danger">
                {updateError}
              </p>
            ) : null}
          </div>
        ) : (
          <div className="grid gap-4 text-sm text-text">
            <div className="grid gap-1">
              <span className="text-xs text-muted">Nome</span>
              <strong className="text-base font-semibold">
                {selectedPerson?.name}
              </strong>
            </div>
            <div className="grid gap-1">
              <span className="text-xs text-muted">Telefone</span>
              <span>{selectedPerson?.phone ?? "Sem telefone"}</span>
            </div>
            <div className="grid gap-1">
              <span className="text-xs text-muted">Celular</span>
              <span>{selectedPerson?.mobile ?? "Sem celular"}</span>
            </div>
            <div className="grid gap-1">
              <span className="text-xs text-muted">Email</span>
              <span>{selectedPerson?.email ?? "Sem email"}</span>
            </div>
            <div className="grid gap-1">
              <span className="text-xs text-muted">CPF</span>
              <span>{selectedPerson?.cpf ?? "CPF não informado"}</span>
            </div>
            <div className="grid gap-1">
              <span className="text-xs text-muted">RG</span>
              <span>{selectedPerson?.rg ?? "RG não informado"}</span>
            </div>
            <div className="grid gap-1">
              <span className="text-xs text-muted">Observações</span>
              <span>{selectedPerson?.notes ?? "Sem observações"}</span>
            </div>
            <div className="grid gap-1">
              <span className="text-xs text-muted">Casas ativas</span>
              <span>{selectedPerson?.active_houses ?? 0}</span>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={Boolean(linkingPerson)}
        title="Vincular responsável"
        eyebrow="Sincronizar com casa"
        onClose={closeLinkModal}
        footer={
          <div className="flex justify-end gap-2">
            <button className="btn" type="button" onClick={closeLinkModal}>
              Cancelar
            </button>
            <button
              className="btn btn-primary"
              type="button"
              onClick={handleLink}
              disabled={isLinking}
            >
              <Link2 className="h-4 w-4" />
              {isLinking ? "Vinculando..." : "Vincular"}
            </button>
          </div>
        }
      >
        <div className="grid gap-4">
          <div>
            <span className="text-xs text-muted">Responsável selecionado</span>
            <strong className="mt-1 block text-base font-semibold">
              {linkingPerson?.name}
            </strong>
            <p className="text-sm text-muted">
              {linkingPerson?.phone ?? "Sem telefone"}
            </p>
          </div>
          <label className="grid gap-2 text-sm">
            <span>Selecione a casa</span>
            <select
              value={selectedHouseId}
              onChange={(event) => setSelectedHouseId(event.target.value)}
              className="form-select"
            >
              <option value="">Escolha a casa</option>
              {houseOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          {linkError ? (
            <p className="rounded-lg border border-dashed border-danger/50 bg-danger/10 px-3 py-2 text-xs text-danger">
              {linkError}
            </p>
          ) : null}
        </div>
      </Modal>
    </section>
  );
};
