-- Migration: Add logo and stamp fields to companies table
-- Date: 2024

-- Add logo field
ALTER TABLE companies ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500);

-- Add stamp field
ALTER TABLE companies ADD COLUMN IF NOT EXISTS stamp_url VARCHAR(500);

-- Update existing records with default values if needed
UPDATE companies SET logo_url = '' WHERE logo_url IS NULL;
UPDATE companies SET stamp_url = '' WHERE stamp_url IS NULL;

-- Add index for better performance (optional)
CREATE INDEX IF NOT EXISTS idx_companies_logo ON companies(logo_url);
CREATE INDEX IF NOT EXISTS idx_companies_stamp ON companies(stamp_url);

-- Verify the changes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'companies'
AND column_name IN ('logo_url', 'stamp_url')
ORDER BY column_name;