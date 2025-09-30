const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

async function addSuperAdminToExistingSchema() {
  const migrationPath = path.join(__dirname, '..', 'database', 'migrations', 'add_super_admin_to_existing_schema.sql')

  if (!fs.existsSync(migrationPath)) {
    console.error('❌ Migration file not found:', migrationPath)
    process.exit(1)
  }

  const migrationSQL = fs.readFileSync(migrationPath, 'utf8')

  if (!process.env.DATABASE_URL) {
    console.log('⚠️  DATABASE_URL not found - running in mock mode')
    console.log('📝 Migration SQL that would be executed:')
    console.log(migrationSQL)
    console.log('\n✅ Mock migration completed')
    console.log('👤 Super admin user will be created in users table:')
    console.log('   Email: bakiucartasarim@gmail.com')
    console.log('   Role: super_admin (in users.role column)')
    console.log('   Password: admin123')
    return
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false
  })

  try {
    console.log('🚀 Adding super admin to existing schema...')

    // Execute the migration
    await pool.query(migrationSQL)

    console.log('✅ Super admin migration completed successfully!')

    // Verify the super admin user was created
    const result = await pool.query(`
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
      WHERE email = 'bakiucartasarim@gmail.com'
    `)

    if (result.rows.length > 0) {
      const user = result.rows[0]
      console.log('\n👤 Super Admin User:')
      console.log(`   ID: ${user.id}`)
      console.log(`   Email: ${user.email}`)
      console.log(`   Name: ${user.first_name} ${user.last_name}`)
      console.log(`   Role: ${user.role}`)
      console.log(`   Active: ${user.is_active}`)
      console.log(`   Verified: ${user.email_verified}`)
      console.log(`   Created: ${user.created_at}`)
      console.log('\n🔐 Default password: admin123 (should be changed)')
      console.log('🌐 Mail Engine access: /dashboard/mail-engine')

      // Show the query to check super admin
      console.log('\n🔍 To verify super admin in database:')
      console.log("SELECT * FROM users WHERE email = 'bakiucartasarim@gmail.com';")

    } else {
      console.log('⚠️  User not found after migration')
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message)

    if (error.message.includes('constraint')) {
      console.log('\n💡 Tip: If users table already has different constraints, you may need to:')
      console.log('   1. Check existing constraints: \\d users')
      console.log('   2. Update existing user manually')
    }

    process.exit(1)
  } finally {
    await pool.end()
  }
}

// Run the migration
addSuperAdminToExistingSchema().catch(console.error)