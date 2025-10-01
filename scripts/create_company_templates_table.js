const { Client } = require('pg')

async function createCompanyTemplatesTable() {
  const connectionString = process.env.DATABASE_URL || 'postgres://postgres:cA3U0JURbsbl95Y0Yf4DObCfmZO1tU4oA5IieoDYCHVExHMuYP2oDnYd3wNUt8qh@178.18.206.227:5438/postgres'
  const client = new Client({ connectionString })

  try {
    await client.connect()
    console.log('✅ Connected to database')

    // Create company_templates table
    await client.query(`
      CREATE TABLE IF NOT EXISTS company_templates (
        id SERIAL PRIMARY KEY,
        company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        template_name VARCHAR(255) NOT NULL DEFAULT 'Cari Mutabakat',
        header_text TEXT,
        intro_text TEXT,
        note1 TEXT,
        note2 TEXT,
        note3 TEXT,
        note4 TEXT,
        note5 TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✅ company_templates table created successfully')

    // Create index for faster lookups
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_company_templates_company_id
      ON company_templates(company_id)
    `)
    console.log('✅ Index created on company_id')

    // Insert default template for company ID 1
    const checkExisting = await client.query(
      'SELECT id FROM company_templates WHERE company_id = 1'
    )

    if (checkExisting.rows.length === 0) {
      await client.query(`
        INSERT INTO company_templates (
          company_id,
          template_name,
          header_text,
          intro_text,
          note1,
          note2,
          note3,
          note4,
          note5
        ) VALUES (
          1,
          'Cari Mutabakat',
          '',
          'Giriş metnindeki cari hesabımız %DÖNEM% tarihi itibarıyle %TUTAR% %BORÇALACAK% bakiyesi vermektedir.',
          'Hata ve Unutma Müstesnadır.',
          'Mutabakat veya itirazınız 30 gün içinde bildirmedığiniz takdirde TTK''nın 94. maddesi uyarınca mutabık sayılacağınızı hatırlatırız.',
          'Mutabakat ile ilgili sorunlarınız için nolu telefondan Sayın ile görüşebilirsiniz.',
          'Mutabık olmanızız durumunda cari hesap ekstrenizi www.kolaymutabakat.com sitesine yüklemenizi yada asım.koc@dorufinansol.com adresine e-posta olarak göndermenizi rica ederiz.',
          ''
        )
      `)
      console.log('✅ Default template inserted for company ID 1')
    } else {
      console.log('ℹ️  Default template already exists for company ID 1')
    }

    console.log('\n✅ Migration completed successfully!')

  } catch (error) {
    console.error('❌ Migration error:', error)
    throw error
  } finally {
    await client.end()
  }
}

createCompanyTemplatesTable()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
