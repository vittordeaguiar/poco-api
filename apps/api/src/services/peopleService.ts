import { normalizePhone } from "../lib/phone";
import {
  buildInsertPersonStatement,
  findPersonByPhone,
  listPeople as listPeopleRepo
} from "../repositories/peopleRepository";
import { createAuditStatement } from "../utils/audit";

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
