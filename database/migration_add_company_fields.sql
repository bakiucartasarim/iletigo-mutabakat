-- Migration: Add website and description fields to companies table
-- Date: 2024

-- Add website field
ALTER TABLE companies ADD COLUMN IF NOT EXISTS website VARCHAR(255);

-- Add description field
ALTER TABLE companies ADD COLUMN IF NOT EXISTS description TEXT;

-- Update existing records with default values if needed
UPDATE companies SET website = '' WHERE website IS NULL;
UPDATE companies SET description = '' WHERE description IS NULL;

-- Add index for better performance (optional)
CREATE INDEX IF NOT EXISTS idx_companies_website ON companies(website);

-- Verify the changes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'companies'
AND column_name IN ('website', 'description')
ORDER BY column_name;