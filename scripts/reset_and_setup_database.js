const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

async function resetAndSetupDatabase() {
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
    console.log('🚀 Starting database reset and setup...')

    // 1. Drop all existing tables
    console.log('🗑️  Dropping existing tables...')

    const dropTablesSQL = `
      -- Drop tables in correct order (considering foreign key dependencies)
      DROP TABLE IF EXISTS reconciliation_excel_data CASCADE;
      DROP TABLE IF EXISTS user_sessions CASCADE;
      DROP TABLE IF EXISTS activity_logs CASCADE;
      DROP TABLE IF EXISTS comments CASCADE;
      DROP TABLE IF EXISTS attachments CASCADE;
      DROP TABLE IF EXISTS reconciliation_details CASCADE;
      DROP TABLE IF EXISTS reconciliations CASCADE;
      DROP TABLE IF EXISTS reconciliation_periods CASCADE;
      DROP TABLE IF EXISTS settings CASCADE;
      DROP TABLE IF EXISTS user_roles CASCADE;
      DROP TABLE IF EXISTS roles CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
      DROP TABLE IF EXISTS companies CASCADE;
      DROP TABLE IF EXISTS mail_engine_settings CASCADE;

      -- Drop any remaining views
      DROP VIEW IF EXISTS reconciliation_stats CASCADE;
      DROP VIEW IF EXISTS user_activity_summary CASCADE;

      -- Drop functions
      DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
    `

    await pool.query(dropTablesSQL)
    console.log('✅ All tables dropped')

    // 2. Create fresh schema
    console.log('🏗️  Creating fresh schema...')

    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql')
    if (fs.existsSync(schemaPath)) {
      const schemaSQL = fs.readFileSync(schemaPath, 'utf8')
      await pool.query(schemaSQL)
      console.log('✅ Base schema created')
    }

    // 3. Add reconciliation_excel_data table
    console.log('📊 Adding reconciliation_excel_data table...')

    const excelDataSQL = `
      CREATE TABLE IF NOT EXISTS reconciliation_excel_data (
        id SERIAL PRIMARY KEY,
        reconciliation_id INTEGER,
        sira_no INTEGER,
        cari_hesap_kodu VARCHAR(100),
        cari_hesap_adi VARCHAR(255),
        sube VARCHAR(100),
        cari_hesap_turu VARCHAR(100),
        tutar DECIMAL(15,2) DEFAULT 0,
        birim VARCHAR(10) DEFAULT 'TRY',
        borc_alacak VARCHAR(20),
        vergi_dairesi VARCHAR(255),
        vergi_no VARCHAR(50),
        fax_numarasi VARCHAR(50),
        ilgili_kisi_eposta VARCHAR(255),
        hata TEXT,
        mail_status VARCHAR(20) DEFAULT 'gonderilmedi',
        updated_at TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `

    await pool.query(excelDataSQL)
    console.log('✅ reconciliation_excel_data table created')

    // 4. Add mail_engine_settings table
    console.log('📧 Adding mail_engine_settings table...')

    const mailEngineSQL = `
      CREATE TABLE IF NOT EXISTS mail_engine_settings (
        id INTEGER PRIMARY KEY DEFAULT 1,
        api_key TEXT,
        from_email VARCHAR(255),
        from_name VARCHAR(255),
        is_active BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `

    await pool.query(mailEngineSQL)
    console.log('✅ mail_engine_settings table created')

    // 5. Update users table to support super_admin
    console.log('👤 Updating users table for super_admin...')

    await pool.query(`
      ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
      ALTER TABLE users ADD CONSTRAINT users_role_check
        CHECK (role IN ('admin', 'manager', 'user', 'super_admin'));
    `)
    console.log('✅ Users table updated')

    // 6. Create super admin user
    console.log('🔑 Creating super admin user...')

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
    console.log('✅ Super admin user created')

    // 7. Create a sample company
    console.log('🏢 Creating sample company...')

    await pool.query(`
      INSERT INTO companies (name, tax_number, email, contact_person, is_active)
      VALUES (
        'İletigo Teknoloji A.Ş.',
        '1234567890',
        'info@iletigo.com',
        'Baki Ucar',
        TRUE
      )
    `)
    console.log('✅ Sample company created')

    // 8. Final verification
    console.log('🔍 Final verification...')

    const userCheck = await pool.query(`
      SELECT id, email, first_name, last_name, role, is_active
      FROM users
      WHERE email = 'bakiucartasarim@gmail.com'
    `)

    const companyCheck = await pool.query(`
      SELECT id, name, tax_number FROM companies
    `)

    const tableCheck = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `)

    console.log('\n🎉 Database setup completed!')
    console.log('\n📊 Created tables:')
    tableCheck.rows.forEach(row => {
      console.log(`   ✓ ${row.table_name}`)
    })

    if (userCheck.rows.length > 0) {
      const user = userCheck.rows[0]
      console.log('\n👤 Super Admin User:')
      console.log(`   ID: ${user.id}`)
      console.log(`   Email: ${user.email}`)
      console.log(`   Name: ${user.first_name} ${user.last_name}`)
      console.log(`   Role: ${user.role}`)
      console.log(`   Active: ${user.is_active}`)
    }

    if (companyCheck.rows.length > 0) {
      const company = companyCheck.rows[0]
      console.log('\n🏢 Sample Company:')
      console.log(`   ID: ${company.id}`)
      console.log(`   Name: ${company.name}`)
      console.log(`   Tax Number: ${company.tax_number}`)
    }

    console.log('\n🔐 Default password: admin123')
    console.log('🌐 Mail Engine access: /dashboard/mail-engine')
    console.log('📱 Application ready at: http://localhost:3000')

  } catch (error) {
    console.error('❌ Setup failed:', error.message)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

resetAndSetupDatabase().catch(console.error)