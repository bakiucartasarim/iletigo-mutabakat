-- Add missing columns to tables
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS code VARCHAR(255) UNIQUE;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);