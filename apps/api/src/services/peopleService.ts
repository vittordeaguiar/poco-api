import { normalizePhone } from "../lib/phone";
import {
  buildInsertPersonStatement,
  buildUpdatePersonStatement,
  findPersonByPhone,
  findPersonById,
  listPeople as listPeopleRepo
} from "../repositories/peopleRepository";
import { createAuditStatement } from "../utils/audit";
import { ServiceError } from "./serviceError";

export const listPeople = async (db: D1Database, search?: string) =>
  listPeopleRepo(db, search);

export const createPerson = async (
  db: D1Database,
  data: {
    name: string;
    phone?: string;
    mobile?: string;
    cpf?: string;
    email?: string;
    rg?: string;
    notes?: string;
  }
) => {
  const { name, phone, mobile, cpf, email, rg, notes } = data;
  let reusedPerson = false;
  let personId: string;

  if (phone) {
    const existing = await findPersonByPhone(db, phone);
    if (existing) {
      reusedPerson = true;
      personId = existing.id;
    } else {
      personId = crypto.randomUUID();
    }
  } else {
    personId = crypto.randomUUID();
  }

  if (!reusedPerson) {
    const normalizedPhone = normalizePhone(phone);
    const normalizedMobile = normalizePhone(mobile);
    const insertStatement = buildInsertPersonStatement(db, {
      id: personId,
      name,
      phone: normalizedPhone,
      mobile: normalizedMobile,
      cpf: cpf ?? null,
      email: email ?? null,
      rg: rg ?? null,
      notes: notes ?? null
    });

    const auditStatement = createAuditStatement(
      db,
      "create_person",
      "person",
      personId,
      {
        name,
        phone: normalizedPhone,
        mobile: normalizedMobile,
        cpf: cpf ?? null,
        email: email ?? null,
        rg: rg ?? null,
        notes: notes ?? null
      }
    );

    await db.batch([insertStatement, auditStatement]);
  }

  return {
    id: personId,
    reused_person: reusedPerson
  };
};

export const updatePerson = async (
  db: D1Database,
  personId: string,
  update: {
    name?: string;
    phone?: string | null;
    mobile?: string | null;
    cpf?: string | null;
    email?: string | null;
    rg?: string | null;
    notes?: string | null;
  }
) => {
  const current = await findPersonById(db, personId);
  if (!current) {
    throw new ServiceError(404, "Person not found");
  }

  const hasKey = (key: string) =>
    Object.prototype.hasOwnProperty.call(update, key);

  const normalizeText = (value: string | null | undefined) => {
    if (value === null) {
      return null;
    }
    const trimmed = value?.trim() ?? "";
    return trimmed ? trimmed : null;
  };

  const next = { ...current };

  if (hasKey("name")) {
    const trimmed = update.name?.trim() ?? "";
    if (!trimmed) {
      throw new ServiceError(400, "Name is required");
    }
    next.name = trimmed;
  }

  if (hasKey("phone")) {
    next.phone = normalizePhone(update.phone ?? null);
  }
  if (hasKey("mobile")) {
    next.mobile = normalizePhone(update.mobile ?? null);
  }
  if (hasKey("cpf")) {
    next.cpf = normalizeText(update.cpf);
  }
  if (hasKey("email")) {
    next.email = normalizeText(update.email);
  }
  if (hasKey("rg")) {
    next.rg = normalizeText(update.rg);
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

  trackChange("name", current.name, next.name);
  trackChange("phone", current.phone, next.phone);
  trackChange("mobile", current.mobile, next.mobile);
  trackChange("cpf", current.cpf, next.cpf);
  trackChange("email", current.email, next.email);
  trackChange("rg", current.rg, next.rg);
  trackChange("notes", current.notes, next.notes);

  const now = new Date().toISOString();
  const updateStatement = buildUpdatePersonStatement(db, {
    id: personId,
    name: next.name,
    phone: next.phone,
    mobile: next.mobile,
    cpf: next.cpf,
    email: next.email,
    rg: next.rg,
    notes: next.notes,
    updated_at: now
  });

  const auditStatement = createAuditStatement(
    db,
    "update_person",
    "person",
    personId,
    { changes }
  );

  await db.batch([updateStatement, auditStatement]);

  return { id: personId };
};
