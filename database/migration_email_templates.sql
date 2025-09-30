-- Email Templates Table Migration
-- Şirket bazlı mail şablonları için tablo

-- First, create the trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TABLE IF NOT EXISTS email_templates (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    variables JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_by INTEGER REFERENCES users(id),
    updated_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for company-based queries
CREATE INDEX IF NOT EXISTS idx_email_templates_company ON email_templates(company_id);
CREATE INDEX IF NOT EXISTS idx_email_templates_active ON email_templates(is_active);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_email_templates_updated_at ON email_templates;
CREATE TRIGGER update_email_templates_updated_at
BEFORE UPDATE ON email_templates
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Insert sample template for testing
INSERT INTO email_templates (company_id, name, subject, content, variables, is_active, created_at, updated_at)
SELECT
    1, -- company_id 1 için örnek şablon
    'Cari Mutabakat Mektubu',
    'Mutabakat Mektubu - {{referansKodu}}',
    '<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <p>Sayın {{sirketAdi}},</p>
        <p>Şirketimiz nezdinizde cari hesabımız {{tarih}} tarihli itibariyle <strong>{{tutar}} TRY {{bakiyeTipi}}</strong> bakiye vermektedir.</p>
        <p>Mutabakat referans numaranız: <strong>{{referansKodu}}</strong></p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="font-size: 12px; color: #666;">Bu email otomatik olarak oluşturulmuştur.</p>
    </div>',
    '["sirketAdi", "referansKodu", "tarih", "tutar", "bakiyeTipi"]'::jsonb,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE EXISTS (SELECT 1 FROM companies WHERE id = 1);
