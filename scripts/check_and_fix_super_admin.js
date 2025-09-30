const { Pool } = require('pg')

async function checkAndFixSuperAdmin() {
  const DATABASE_URL = process.env.DATABASE_URL

  if (!DATABASE_URL) {
    console.log('❌ DATABASE_URL not found')
    process.exit(1)
  }

  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: false
  })

  try {
    console.log('🔍 Checking current database state...')

    // 1. Check if users table exists and its structure
    const tableInfo = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'users' AND table_schema = 'public'
      ORDER BY ordinal_position;
    `)

    if (tableInfo.rows.length === 0) {
      console.log('❌ Users table not found')
      process.exit(1)
    }

    console.log('📊 Users table structure:')
    tableInfo.rows.forEach(row => {
      console.log(`   ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`)
    })

    // 2. Check current role constraint
    const constraints = await pool.query(`
      SELECT conname, consrc
      FROM pg_constraint
      WHERE conrelid = 'users'::regclass AND contype = 'c'
    `)

    console.log('\n🔒 Current constraints:')
    constraints.rows.forEach(row => {
      console.log(`   ${row.conname}: ${row.consrc}`)
    })

    // 3. Check existing users and their roles
    const existingUsers = await pool.query(`
      SELECT id, email, role, is_active, first_name, last_name
      FROM users
      ORDER BY id
    `)

    console.log('\n👥 Existing users:')
    existingUsers.rows.forEach(row => {
      console.log(`   ID: ${row.id}, Email: ${row.email}, Role: ${row.role}, Active: ${row.is_active}`)
    })

    // 4. Check if super admin already exists
    const superAdmin = await pool.query(`
      SELECT * FROM users WHERE email = 'bakiucartasarim@gmail.com'
    `)

    if (superAdmin.rows.length > 0) {
      console.log('\n✅ Super admin user already exists:')
      const user = superAdmin.rows[0]
      console.log(`   Email: ${user.email}`)
      console.log(`   Role: ${user.role}`)
      console.log(`   Active: ${user.is_active}`)

      // Update role if not super_admin
      if (user.role !== 'super_admin') {
        console.log('\n🔄 Updating role to super_admin...')

        // First, temporarily remove constraint
        await pool.query('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check')

        // Update the user
        await pool.query(`
          UPDATE users
          SET role = 'super_admin',
              first_name = 'Baki',
              last_name = 'Ucar',
              is_active = true,
              email_verified = true,
              updated_at = CURRENT_TIMESTAMP
          WHERE email = 'bakiucartasarim@gmail.com'
        `)

        // Add new constraint
        await pool.query(`
          ALTER TABLE users ADD CONSTRAINT users_role_check
          CHECK (role IN ('admin', 'manager', 'user', 'super_admin'))
        `)

        console.log('✅ User updated to super_admin')
      }
    } else {
      console.log('\n🆕 Creating new super admin user...')

      // Remove constraint first
      await pool.query('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check')

      // Insert new user
      await pool.query(`
        INSERT INTO users (email, first_name, last_name, password_hash, role, is_active, email_verified)
        VALUES (
          'bakiucartasarim@gmail.com',
          'Baki',
          'Ucar',
          '$2b$12$LQv3c1yqBwlVHpPjrh.Oku.zQB1YLmjfGPvgOTYqCGaI4VYZ5HUtS',
          'super_admin',
          TRUE,
          TRUE
        )
      `)

      // Add new constraint
      await pool.query(`
        ALTER TABLE users ADD CONSTRAINT users_role_check
        CHECK (role IN ('admin', 'manager', 'user', 'super_admin'))
      `)

      console.log('✅ Super admin user created')
    }

    // 5. Final verification
    const finalCheck = await pool.query(`
      SELECT id, email, first_name, last_name, role, is_active, email_verified
      FROM users
      WHERE email = 'bakiucartasarim@gmail.com'
    `)

    if (finalCheck.rows.length > 0) {
      const user = finalCheck.rows[0]
      console.log('\n🎉 Final verification - Super Admin User:')
      console.log(`   ID: ${user.id}`)
      console.log(`   Email: ${user.email}`)
      console.log(`   Name: ${user.first_name} ${user.last_name}`)
      console.log(`   Role: ${user.role}`)
      console.log(`   Active: ${user.is_active}`)
      console.log(`   Verified: ${user.email_verified}`)
      console.log('\n🔐 Default password: admin123')
      console.log('🌐 Mail Engine access: /dashboard/mail-engine')
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

checkAndFixSuperAdmin().catch(console.error)