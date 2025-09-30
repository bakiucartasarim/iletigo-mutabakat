const { Pool } = require('pg')

async function simpleResetDatabase() {
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
    console.log('🚀 Simple database reset and setup...')

    // 1. Drop all tables with CASCADE
    console.log('🗑️  Dropping all tables...')
    await pool.query('DROP SCHEMA public CASCADE')
    await pool.query('CREATE SCHEMA public')
    await pool.query('GRANT ALL ON SCHEMA public TO postgres')
    await pool.query('GRANT ALL ON SCHEMA public TO public')
    console.log('✅ Schema reset completed')

    // 2. Create basic tables in correct order
    console.log('🏗️  Creating basic tables...')

    // Companies first (no dependencies)
    await pool.query(`
      CREATE TABLE companies (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        tax_number VARCHAR(50) UNIQUE,
        email VARCHAR(255),
        contact_person VARCHAR(255),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Users with proper role support
    await pool.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255),
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        phone VARCHAR(20),
        role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user', 'super_admin')),
        department VARCHAR(100),
        company_id INTEGER REFERENCES companies(id),
        is_active BOOLEAN DEFAULT true,
        email_verified BOOLEAN DEFAULT false,
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Reconciliation periods
    await pool.query(`
      CREATE TABLE reconciliation_periods (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        status VARCHAR(50) DEFAULT 'draft',
        description TEXT,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Reconciliations
    await pool.query(`
      CREATE TABLE reconciliations (
        id SERIAL PRIMARY KEY,
        period_id INTEGER REFERENCES reconciliation_periods(id),
        user_id INTEGER REFERENCES users(id),
        company_id INTEGER REFERENCES companies(id),
        period VARCHAR(255),
        status VARCHAR(50) DEFAULT 'pending',
        total_count INTEGER DEFAULT 0,
        matched INTEGER DEFAULT 0,
        unmatched INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Excel data table
    await pool.query(`
      CREATE TABLE reconciliation_excel_data (
        id SERIAL PRIMARY KEY,
        reconciliation_id INTEGER REFERENCES reconciliations(id),
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
      )
    `)

    // Mail engine settings
    await pool.query(`
      CREATE TABLE mail_engine_settings (
        id INTEGER PRIMARY KEY DEFAULT 1,
        api_key TEXT,
        from_email VARCHAR(255),
        from_name VARCHAR(255),
        is_active BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `)

    console.log('✅ All tables created')

    // 3. Insert sample data
    console.log('📊 Inserting sample data...')

    // Sample company
    await pool.query(`
      INSERT INTO companies (name, tax_number, email, contact_person, is_active)
      VALUES ('İletigo Teknoloji A.Ş.', '1234567890', 'info@iletigo.com', 'Baki Ucar', TRUE)
    `)

    // Super admin user
    await pool.query(`
      INSERT INTO users (email, first_name, last_name, password_hash, role, is_active, email_verified, company_id)
      VALUES (
        'bakiucartasarim@gmail.com',
        'Baki',
        'Ucar',
        '$2b$12$LQv3c1yqBwlVHpPjrh.Oku.zQB1YLmjfGPvgOTYqCGaI4VYZ5HUtS',
        'super_admin',
        TRUE,
        TRUE,
        1
      )
    `)

    console.log('✅ Sample data inserted')

    // 4. Final verification
    console.log('🔍 Final verification...')

    const tables = await pool.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `)

    const user = await pool.query(`
      SELECT id, email, first_name, last_name, role, is_active
      FROM users WHERE email = 'bakiucartasarim@gmail.com'
    `)

    const company = await pool.query(`
      SELECT id, name, tax_number FROM companies
    `)

    console.log('\n🎉 Database setup completed!')
    console.log('\n📊 Created tables:')
    tables.rows.forEach(row => {
      console.log(`   ✓ ${row.table_name}`)
    })

    if (user.rows.length > 0) {
      const u = user.rows[0]
      console.log('\n👤 Super Admin User:')
      console.log(`   ID: ${u.id}`)
      console.log(`   Email: ${u.email}`)
      console.log(`   Name: ${u.first_name} ${u.last_name}`)
      console.log(`   Role: ${u.role}`)
      console.log(`   Active: ${u.is_active}`)
    }

    if (company.rows.length > 0) {
      const c = company.rows[0]
      console.log('\n🏢 Company:')
      console.log(`   ID: ${c.id}`)
      console.log(`   Name: ${c.name}`)
      console.log(`   Tax Number: ${c.tax_number}`)
    }

    console.log('\n🔐 Default password: admin123')
    console.log('🌐 Mail Engine access: /dashboard/mail-engine')
    console.log('📱 Application ready!')

  } catch (error) {
    console.error('❌ Setup failed:', error.message)
    console.error('Full error:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

simpleResetDatabase().catch(console.error)