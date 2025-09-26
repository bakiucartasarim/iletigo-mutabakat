-- Kullanıcılar tablosu
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
    company_id INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Şirketler tablosu
CREATE TABLE IF NOT EXISTS companies (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    mobile_phone VARCHAR(20),
    address TEXT,
    tax_office VARCHAR(255),
    tax_number VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Mutabakatlar tablosu
CREATE TABLE IF NOT EXISTS reconciliations (
    id SERIAL PRIMARY KEY,
    reference_number VARCHAR(50) UNIQUE NOT NULL,
    user_id INTEGER REFERENCES users(id),
    company_id INTEGER REFERENCES companies(id),
    type VARCHAR(50) NOT NULL CHECK (type IN ('cari_mutabakat', 'ba_mutabakat', 'bs_mutabakat', 'bakiyesiz_mutabakat')),
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'approved', 'rejected', 'completed')),
    reconciliation_period VARCHAR(100),
    end_date DATE,
    related_type VARCHAR(100),
    reminder_days VARCHAR(100),
    sender_branch VARCHAR(100),
    language VARCHAR(10) DEFAULT 'tr',
    template VARCHAR(100),
    settings JSONB,
    total_amount DECIMAL(15,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'TRY',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Mutabakat detayları tablosu
CREATE TABLE IF NOT EXISTS reconciliation_details (
    id SERIAL PRIMARY KEY,
    reconciliation_id INTEGER REFERENCES reconciliations(id) ON DELETE CASCADE,
    row_number INTEGER,
    account_code VARCHAR(50),
    account_name VARCHAR(255),
    branch VARCHAR(100),
    amount DECIMAL(15,2),
    currency VARCHAR(3) DEFAULT 'TRY',
    debt_credit VARCHAR(10) CHECK (debt_credit IN ('BORÇ', 'ALACAK')),
    tax_office VARCHAR(255),
    tax_number VARCHAR(20),
    fax_number VARCHAR(20),
    email VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_companies_code ON companies(code);
CREATE INDEX IF NOT EXISTS idx_reconciliations_reference ON reconciliations(reference_number);
CREATE INDEX IF NOT EXISTS idx_reconciliations_user ON reconciliations(user_id);
CREATE INDEX IF NOT EXISTS idx_reconciliations_company ON reconciliations(company_id);
CREATE INDEX IF NOT EXISTS idx_reconciliation_details_reconciliation ON reconciliation_details(reconciliation_id);

-- Varsayılan admin kullanıcı ekle (şifre: admin123)
INSERT INTO users (email, password_hash, first_name, last_name, role)
VALUES ('admin@iletigo.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBDwpsDukeHjq6', 'Admin', 'User', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Örnek şirket verileri
INSERT INTO companies (code, name, contact_person, email, phone, tax_office, tax_number) VALUES
('KM01', 'KM_01 Test Cari', 'Test Kişi', 'test@kolaymuhasebat.com', '2123120000', 'Kadıköy', '7999919985'),
('KM05', 'KM_05 Test Cari', 'Test Kişi 2', 'muhasebat@km05test.com', '', 'Kadıköy', '8100002233'),
('KM07', 'KM_07 Test Cari', 'Test Kişi 3', 'muhasebat@kolay0test.com', '', '', '5123440001')
ON CONFLICT (code) DO NOTHING;