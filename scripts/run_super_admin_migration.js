const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

async function runSuperAdminMigration() {
  const migrationPath = path.join(__dirname, '..', 'database', 'migrations', 'create_super_admin_user.sql')

  if (!fs.existsSync(migrationPath)) {
    console.error('❌ Migration file not found:', migrationPath)
    process.exit(1)
  }

  const migrationSQL = fs.readFileSync(migrationPath, 'utf8')

  if (!process.env.DATABASE_URL) {
    console.log('⚠️  DATABASE_URL not found - running in mock mode')
    console.log('📝 Migration SQL:')
    console.log(migrationSQL)
    console.log('\n✅ Mock migration completed')
    return
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false
  })

  try {
    console.log('🚀 Running super admin migration...')

    // Execute the migration
    await pool.query(migrationSQL)

    console.log('✅ Super admin migration completed successfully!')

    // Verify the super admin user was created
    const result = await pool.query(`
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
      WHERE u.email = 'bakiucartasarim@gmail.com'
    `)

    if (result.rows.length > 0) {
      const user = result.rows[0]
      console.log('\n👤 Super Admin User Created:')
      console.log(`   Email: ${user.email}`)
      console.log(`   Name: ${user.first_name} ${user.last_name}`)
      console.log(`   Role: ${user.role}`)
      console.log(`   Active: ${user.is_active}`)
      console.log(`   Verified: ${user.email_verified}`)
      console.log(`   Role Assigned: ${user.role_assigned_at}`)
      console.log('\n🔐 Default password: admin123 (should be changed)')
      console.log('🌐 Mail Engine access: /dashboard/mail-engine')
    } else {
      console.log('⚠️  User created but role verification failed')
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

// Run the migration
runSuperAdminMigration().catch(console.error)