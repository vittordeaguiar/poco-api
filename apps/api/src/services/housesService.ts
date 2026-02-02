import { normalizePhone } from "../lib/phone";
import * as houseRepo from "../repositories/houseRepository";
import {
  buildInsertPersonStatement,
  findPeopleByName,
  findPersonById,
  findPersonByPhone
} from "../repositories/peopleRepository";
import { createAuditStatement } from "../utils/audit";
import { ServiceError } from "./serviceError";

export const listHouses = async (
  db: D1Database,
  params: {
    search?: string;
    status?: "active" | "inactive" | "pending";
    page: number;
    pageSize: number;
  }
) => {
  const { search, status, page, pageSize } = params;
  const offset = (page - 1) * pageSize;

  const where: string[] = [];
  const bindings: unknown[] = [];

  if (status) {
    where.push("h.status = ?");
    bindings.push(status);
  }

  if (search) {
    const like = `%${search}%`;
    where.push(
      "(h.street LIKE ? OR h.house_number LIKE ? OR p.name LIKE ? OR p.phone LIKE ?)"
    );
    bindings.push(like, like, like, like);
  }

  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const countResult = await houseRepo.countHouses(db, whereClause, bindings);
  const total = countResult?.total ?? 0;

  const rowsResult = await houseRepo.listHouses(
    db,
    whereClause,
    bindings,
    pageSize,
    offset
  );

  const items = rowsResult.results.map((row) => ({
    id: row.id,
    street: row.street,
    house_number: row.house_number,
    complement: row.complement,
    cep: row.cep,
    reference: row.reference,
    monthly_amount_cents: row.monthly_amount_cents,
    status: row.status,
    notes: row.notes,
    created_at: row.created_at,
    updated_at: row.updated_at,
    responsible_current: row.responsible_id
      ? {
          id: row.responsible_id,
          name: row.responsible_name,
          phone: row.responsible_phone
        }
      : null
  }));

  return {
    items,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / pageSize)
    }
  };
};

export const listPendingHouses = async (db: D1Database) => {
  const rows = await houseRepo.listPendingHouses(db);

  const items = rows.results.map((row) => {
    const pending_reasons: string[] = [];
    if (!row.street || String(row.street).trim() === "") {
      pending_reasons.push("missing_street");
    }
    if (!row.house_number || String(row.house_number).trim() === "") {
      pending_reasons.push("missing_house_number");
    }
    if (!row.responsible_id) {
      pending_reasons.push("missing_responsible");
    }

    return {
      id: row.id,
      house_id: row.id,
      street: row.street,
      house_number: row.house_number,
      complement: row.complement,
      cep: row.cep,
      reference: row.reference,
      monthly_amount_cents: row.monthly_amount_cents,
      status: row.status,
      notes: row.notes,
      created_at: row.created_at,
      updated_at: row.updated_at,
      responsible_current: row.responsible_id
        ? {
            id: row.responsible_id,
            name: row.responsible_name,
            phone: row.responsible_phone
          }
        : null,
      pending_reasons
    };
  });

  return { items };
};

export const getHouseDetails = async (db: D1Database, houseId: string) => {
  const house = await houseRepo.getHouse(db, houseId);
  if (!house) {
    throw new ServiceError(404, "House not found");
  }

  const responsibleCurrent = await houseRepo.getCurrentResponsible(db, houseId);
  const historyResult = await houseRepo.listResponsibilityHistory(db, houseId);
  const invoicesResult = await houseRepo.listHouseInvoices(db, houseId);

  return {
    house,
    responsible_current: responsibleCurrent ?? null,
    responsible_history: historyResult.results.map((row) => ({
      id: row.id,
      house_id: row.house_id,
      person_id: row.person_id,
      start_at: row.start_at,
      end_at: row.end_at,
      reason: row.reason,
      person: {
        name: row.name,
        phone: row.phone
      }
    })),
    invoices: invoicesResult.results
  };
};

export const updateHouse = async (
  db: D1Database,
  houseId: string,
  update: {
    street?: string;
    house_number?: string;
    complement?: string;
    cep?: string;
    reference?: string;
    monthly_amount_cents?: number;
    status?: "active" | "inactive" | "pending";
    notes?: string;
  }
) => {
  const current = await houseRepo.getHouseForUpdate(db, houseId);
  if (!current) {
    throw new ServiceError(404, "House not found");
  }

  const hasKey = (key: string) =>
    Object.prototype.hasOwnProperty.call(update, key);
  const normalizeText = (value: string | undefined) => {
    const trimmed = value?.trim() ?? "";
    return trimmed ? trimmed : null;
  };

  const next = { ...current };
  if (hasKey("street")) {
    next.street = normalizeText(update.street);
  }
  if (hasKey("house_number")) {
    next.house_number = normalizeText(update.house_number);
  }
  if (hasKey("complement")) {
    next.complement = normalizeText(update.complement);
  }
  if (hasKey("cep")) {
    next.cep = normalizeText(update.cep);
  }
  if (hasKey("reference")) {
    next.reference = normalizeText(update.reference);
  }
  if (hasKey("monthly_amount_cents")) {
    next.monthly_amount_cents =
      update.monthly_amount_cents ?? next.monthly_amount_cents;
  }
  if (hasKey("status") && update.status) {
    next.status = update.status;
  }
  if (hasKey("notes")) {
    next.notes = normalizeText(update.notes);
  }

  const changes: Record<string, { from: unknown; to: unknown }> = {};
  const trackChange = (key: string, from: unknown, to: unknown) => {
    if (from !== to) {
      changes[key] = { from, to };
    }
  };

  trackChange("street", current.street, next.street);
  trackChange("house_number", current.house_number, next.house_number);
  trackChange("complement", current.complement, next.complement);
  trackChange("cep", current.cep, next.cep);
  trackChange("reference", current.reference, next.reference);
  trackChange(
    "monthly_amount_cents",
    current.monthly_amount_cents,
    next.monthly_amount_cents
  );
  trackChange("status", current.status, next.status);
  trackChange("notes", current.notes, next.notes);

  const now = new Date().toISOString();
  const updateStatement = houseRepo.buildUpdateHouseStatement(db, {
    id: houseId,
    street: next.street,
    house_number: next.house_number,
    complement: next.complement,
    cep: next.cep,
    reference: next.reference,
    monthly_amount_cents: next.monthly_amount_cents,
    status: next.status,
    notes: next.notes,
    updated_at: now
  });

  const auditStatement = createAuditStatement(
    db,
    "update_house",
    "house",
    houseId,
    { changes }
  );

  await db.batch([updateStatement, auditStatement]);

  return { id: houseId };
};

export const deleteHouse = async (db: D1Database, houseId: string) => {
  const house = await houseRepo.getHouseForDelete(db, houseId);
  if (!house) {
    throw new ServiceError(404, "House not found");
  }

  const statements = houseRepo
    .buildDeleteHouseStatements(db, houseId)
    .concat([
      createAuditStatement(db, "delete_house", "house", houseId, {
        street: house.street,
        house_number: house.house_number,
        status: house.status,
        monthly_amount_cents: house.monthly_amount_cents
      })
    ]);

  await db.batch(statements);

  return { id: houseId };
};

export const assignResponsible = async (
  db: D1Database,
  houseId: string,
  input: { person_id: string } | { name: string; phone?: string }
) => {
  const house = await houseRepo.houseExists(db, houseId);
  if (!house) {
    throw new ServiceError(404, "House not found");
  }

  let personId: string | null = null;
  let reusedPerson = false;
  let suggestions: Array<{ id: string; name: string; phone: string | null }> =
    [];
  let name: string;
  let phone: string | undefined;

  if ("person_id" in input) {
    const person = await findPersonById(db, input.person_id);
    if (!person) {
      throw new ServiceError(404, "Responsible person not found");
    }
    personId = person.id;
    name = person.name;
    phone = person.phone ?? undefined;
    reusedPerson = true;
  } else {
    name = input.name;
    phone = input.phone;
    if (phone) {
      const existing = await findPersonByPhone(db, phone);
      if (existing) {
        personId = existing.id;
        reusedPerson = true;
      }
    } else {
      suggestions = await findPeopleByName(db, name);
    }

    if (!personId) {
      personId = crypto.randomUUID();
    }
  }

  const now = new Date().toISOString();
  const statements = [];

  if (!reusedPerson && personId) {
    const normalizedPhone = normalizePhone(phone);
    statements.push(
      buildInsertPersonStatement(db, {
        id: personId,
        name,
        phone: normalizedPhone,
        mobile: null,
        cpf: null,
        email: null,
        rg: null,
        notes: null
      })
    );
  }

  statements.push(houseRepo.buildCloseResponsibilitiesStatement(db, houseId, now));

  const responsibilityId = crypto.randomUUID();
  statements.push(
    houseRepo.buildInsertResponsibilityStatement(db, {
      id: responsibilityId,
      house_id: houseId,
      person_id: personId,
      start_at: now
    })
  );

  statements.push(
    createAuditStatement(db, "set_responsible", "house", houseId, {
      person_id: personId,
      name,
      phone: normalizePhone(phone),
      reused_person: reusedPerson
    })
  );

  await db.batch(statements);

  const data: Record<string, unknown> = {
    house_id: houseId,
    person_id: personId,
    reused_person: reusedPerson
  };
  if (suggestions.length) {
    data.suggestions = suggestions;
  }

  return data;
};

export const quickCreateHouse = async (
  db: D1Database,
  data: {
    house: {
      street?: string;
      house_number?: string;
      cep?: string;
      reference?: string;
      complement?: string;
      monthly_amount_cents?: number;
    };
    responsible?: { person_id: string } | { name: string; phone?: string };
  },
  defaultAmountCents?: string
) => {
  const { house, responsible } = data;
  const hasStreet = Boolean(house.street?.trim());
  const hasNumber = Boolean(house.house_number?.trim());
  const hasResponsible =
    !!responsible && ("person_id" in responsible || responsible.name?.trim());

  const status = hasStreet && hasNumber && hasResponsible ? "active" : "pending";

  const envDefaultRaw = defaultAmountCents?.trim();
  const envDefault = envDefaultRaw ? Number(envDefaultRaw) : NaN;
  const monthlyAmount =
    house.monthly_amount_cents ??
    (Number.isFinite(envDefault) && envDefault > 0 ? envDefault : 9000);

  const now = new Date().toISOString();
  const houseId = crypto.randomUUID();
  let personId: string | null = null;
  let reusedPerson = false;
  let suggestions: Array<{ id: string; name: string; phone: string | null }> =
    [];
  let responsibleName: string | null = null;
  let responsiblePhone: string | null = null;

  if (responsible) {
    if ("person_id" in responsible) {
      const person = await findPersonById(db, responsible.person_id);
      if (!person) {
        throw new ServiceError(404, "Responsible person not found");
      }
      personId = person.id;
      reusedPerson = true;
      responsibleName = person.name;
      responsiblePhone = person.phone ?? null;
    } else {
      responsibleName = responsible.name;
      responsiblePhone = responsible.phone ?? null;
      if (responsible.phone) {
        const existing = await findPersonByPhone(db, responsible.phone);
        if (existing) {
          personId = existing.id;
          reusedPerson = true;
        }
      } else {
        suggestions = await findPeopleByName(db, responsible.name);
      }

      if (!personId) {
        personId = crypto.randomUUID();
      }
    }
  }

  const statements = [
    houseRepo.buildInsertHouseStatement(db, {
      id: houseId,
      street: house.street ?? null,
      house_number: house.house_number ?? null,
      cep: house.cep ?? null,
      reference: house.reference ?? null,
      complement: house.complement ?? null,
      monthly_amount_cents: monthlyAmount,
      status
    })
  ];

  if (responsible && personId) {
    if (!reusedPerson) {
      const normalizedPhone = normalizePhone(responsiblePhone);
      statements.push(
        buildInsertPersonStatement(db, {
          id: personId,
          name: responsibleName ?? "",
          phone: normalizedPhone,
          mobile: null,
          cpf: null,
          email: null,
          rg: null,
          notes: null
        })
      );
    }

    statements.push(
      houseRepo.buildCloseResponsibilitiesStatement(db, houseId, now)
    );

    const responsibilityId = crypto.randomUUID();
    statements.push(
      houseRepo.buildInsertResponsibilityStatement(db, {
        id: responsibilityId,
        house_id: houseId,
        person_id: personId,
        start_at: now
      })
    );
  }

  statements.push(
    createAuditStatement(db, "create_house", "house", houseId, {
      street: house.street ?? null,
      house_number: house.house_number ?? null,
      status,
      monthly_amount_cents: monthlyAmount,
      responsible_name: responsibleName ?? null,
      responsible_phone: normalizePhone(responsiblePhone) ?? null,
      person_id: personId
    })
  );

  await db.batch(statements);

  const response: Record<string, unknown> = { house_id: houseId };
  if (personId) {
    response.person_id = personId;
    response.reused_person = reusedPerson;
  }
  if (suggestions.length) {
    response.suggestions = suggestions;
  }

  return response;
};
