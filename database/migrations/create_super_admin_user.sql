-- Create super admin user and role system
-- This migration creates the user roles system and assigns super admin role to bakiucartasarim@gmail.com

-- First, create roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  permissions JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create users table if it doesn't exist (with proper structure)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  password_hash VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create user_roles junction table
CREATE TABLE IF NOT EXISTS user_roles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, role_id)
);

-- Insert default roles
INSERT INTO roles (name, description, permissions) VALUES
  ('super_admin', 'Super Administrator - Full system access', '["*"]'),
  ('admin', 'Administrator - System management access', '["users.manage", "companies.manage", "reconciliations.manage"]'),
  ('user', 'Standard User - Basic access', '["reconciliations.view", "reconciliations.create"]')
ON CONFLICT (name) DO NOTHING;

-- Insert or update the super admin user
INSERT INTO users (email, first_name, last_name, password_hash, is_active, email_verified)
VALUES (
  'bakiucartasarim@gmail.com',
  'Baki',
  'Ucar',
  '$2b$12$LQv3c1yqBwlVHpPjrh.Oku.zQB1YLmjfGPvgOTYqCGaI4VYZ5HUtS', -- Default password: 'admin123' (should be changed)
  TRUE,
  TRUE
)
ON CONFLICT (email) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  is_active = EXCLUDED.is_active,
  email_verified = EXCLUDED.email_verified,
  updated_at = NOW();

-- Assign super_admin role to the user
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.email = 'bakiucartasarim@gmail.com'
  AND r.name = 'super_admin'
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Update the super admin check API to use this structure
COMMENT ON TABLE roles IS 'User roles and permissions system';
COMMENT ON TABLE user_roles IS 'Junction table for user role assignments';
COMMENT ON COLUMN roles.permissions IS 'JSON array of permissions for this role';

-- Display confirmation
SELECT
  u.email,
  u.first_name,
  u.last_name,
  r.name as role,
  u.is_active,
  u.email_verified,
  ur.created_at as role_assigned_at
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE u.email = 'bakiucartasarim@gmail.com';