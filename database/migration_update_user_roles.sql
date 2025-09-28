-- Migration: Update user roles system
-- Date: 2024

-- First, update the CHECK constraint to include new roles
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add new CHECK constraint with updated roles
ALTER TABLE users ADD CONSTRAINT users_role_check
CHECK (role IN ('super_admin', 'company_admin', 'company_user'));

-- Migrate existing data
-- Map old roles to new roles:
-- 'admin' -> 'super_admin'
-- 'manager' -> 'company_admin'
-- 'user' -> 'company_user'

UPDATE users SET role = 'super_admin' WHERE role = 'admin';
UPDATE users SET role = 'company_admin' WHERE role = 'manager';
UPDATE users SET role = 'company_user' WHERE role = 'user';

-- Add any missing columns that might be needed
ALTER TABLE users ADD COLUMN IF NOT EXISTS position VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}';

-- Create index for role-based queries
CREATE INDEX IF NOT EXISTS idx_users_role_company ON users(role, company_id);

-- Update default role for new users
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'company_user';

-- Verify the changes
SELECT role, COUNT(*) as count
FROM users
GROUP BY role
ORDER BY role;