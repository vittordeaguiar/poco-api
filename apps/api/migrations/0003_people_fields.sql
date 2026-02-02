ALTER TABLE people ADD COLUMN cpf TEXT;
ALTER TABLE people ADD COLUMN email TEXT;
ALTER TABLE people ADD COLUMN mobile TEXT;
ALTER TABLE people ADD COLUMN rg TEXT;

CREATE INDEX idx_people_cpf ON people(cpf);
CREATE INDEX idx_people_email ON people(email);
CREATE INDEX idx_people_mobile ON people(mobile);
CREATE INDEX idx_people_rg ON people(rg);
