-- D1/SQLite Schema - Gestão de Poço/Comunidade

-- 1. TABELA DE CASAS
CREATE TABLE houses (
    id TEXT PRIMARY KEY,
    street TEXT,
    house_number TEXT,
    complement TEXT,
    cep TEXT,
    reference TEXT,
    monthly_amount_cents INTEGER NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'pending')),
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX idx_houses_street_number ON houses(street, house_number);
CREATE INDEX idx_houses_status ON houses(status);

-- 2. TABELA DE PESSOAS
CREATE TABLE people (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX idx_people_name ON people(name);
CREATE INDEX idx_people_phone ON people(phone);

-- 3. HISTÓRICO de RESPONSÁVEL (Relacionamento N:N com histórico)
CREATE TABLE house_responsibilities (
    id TEXT PRIMARY KEY,
    house_id TEXT NOT NULL,
    person_id TEXT NOT NULL,
    start_at TEXT NOT NULL,
    end_at TEXT,
    reason TEXT,
    FOREIGN KEY (house_id) REFERENCES houses(id) ON DELETE CASCADE,
    FOREIGN KEY (person_id) REFERENCES people(id) ON DELETE CASCADE
);

CREATE INDEX idx_house_resp_house ON house_responsibilities(house_id);
CREATE INDEX idx_house_resp_person ON house_responsibilities(person_id);
CREATE INDEX idx_house_resp_current ON house_responsibilities(house_id) WHERE end_at IS NULL;

-- 4. MENSALIDADES (Invoices)
CREATE TABLE invoices (
    id TEXT PRIMARY KEY,
    house_id TEXT NOT NULL,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    amount_cents INTEGER NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('open', 'paid', 'void')),
    due_date TEXT,
    paid_at TEXT,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    UNIQUE (house_id, year, month),
    FOREIGN KEY (house_id) REFERENCES houses(id) ON DELETE CASCADE
);

CREATE INDEX idx_invoices_period_status ON invoices(year, month, status);
CREATE INDEX idx_invoices_house_period ON invoices(house_id, year, month);

-- 5. PAGAMENTOS
CREATE TABLE payments (
    id TEXT PRIMARY KEY,
    house_id TEXT NOT NULL,
    invoice_id TEXT,
    amount_cents INTEGER NOT NULL,
    method TEXT NOT NULL CHECK (method IN ('cash', 'pix', 'transfer', 'other')),
    paid_at TEXT NOT NULL,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    FOREIGN KEY (house_id) REFERENCES houses(id),
    FOREIGN KEY (invoice_id) REFERENCES invoices(id)
);

CREATE INDEX idx_payments_house_date ON payments(house_id, paid_at);
CREATE INDEX idx_payments_invoice ON payments(invoice_id);

-- 6. EVENTOS DO POÇO (Manutenção/Ocorrências)
CREATE TABLE well_events (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    happened_at TEXT NOT NULL,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX idx_well_events_date ON well_events(happened_at);
