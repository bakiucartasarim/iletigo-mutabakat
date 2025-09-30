-- Add super_admin role to existing users table
-- This uses the existing role column instead of creating new tables

-- First, update the role check constraint to include super_admin
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('admin', 'manager', 'user', 'super_admin'));

-- Insert or update the super admin user
INSERT INTO users (email, first_name, last_name, password_hash, role, is_active, email_verified)
VALUES (
  'bakiucartasarim@gmail.com',
  'Baki',
  'Ucar',
  '$2b$12$LQv3c1yqBwlVHpPjrh.Oku.zQB1YLmjfGPvgOTYqCGaI4VYZ5HUtS', -- Default password: 'admin123'
  'super_admin',
  TRUE,
  TRUE
)
ON CONFLICT (email) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  email_verified = EXCLUDED.email_verified,
  updated_at = CURRENT_TIMESTAMP;

-- Verify the super admin user
SELECT
  id,
  email,
  first_name,
  last_name,
  role,
  is_active,
  email_verified,
  created_at
FROM users
WHERE email = 'bakiucartasarim@gmail.com';