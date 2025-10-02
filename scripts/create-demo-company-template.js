const { Pool } = require('pg')

const pool = new Pool({
  connectionString: 'postgres://postgres:cA3U0JURbsbl95Y0Yf4DObCfmZO1tU4oA5IieoDYCHVExHMuYP2oDnYd3wNUt8qh@178.18.206.227:5438/postgres',
  ssl: false
})

const demoTemplateHtml = `
<div style="text-align: center; padding: 20px;">
  <h1 style="color: #2563eb; font-size: 32px; font-weight: bold; margin-bottom: 10px;">
    İletiGo Teknoloji
  </h1>
  <p style="color: #64748b; font-size: 16px; margin-bottom: 20px;">
    Cari Hesap Mutabakat Sistemi
  </p>
  <div style="border-top: 3px solid #2563eb; width: 100px; margin: 0 auto;"></div>
</div>
`

async function createDemoTemplate() {
  try {
    console.log('📝 Demo company template oluşturuluyor...\n')

    // First, check if company_templates table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'company_templates'
      );
    `)

    if (!tableCheck.rows[0].exists) {
      console.log('📊 company_templates tablosu oluşturuluyor...')
      await pool.query(`
        CREATE TABLE company_templates (
          id SERIAL PRIMARY KEY,
          company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
          template_name VARCHAR(255) NOT NULL,
          template_html TEXT,
          logo_url VARCHAR(500),
          primary_color VARCHAR(20) DEFAULT '#2563eb',
          secondary_color VARCHAR(20) DEFAULT '#4f46e5',
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `)
      console.log('✅ company_templates tablosu oluşturuldu!')
    }

    // Get first company
    const companyResult = await pool.query('SELECT id, name FROM companies LIMIT 1')

    if (companyResult.rows.length === 0) {
      console.log('❌ Hiç şirket bulunamadı!')
      return
    }

    const company = companyResult.rows[0]
    console.log(`🏢 Şirket: ${company.name} (ID: ${company.id})`)

    // Check if template already exists
    const existingTemplate = await pool.query(`
      SELECT id FROM company_templates
      WHERE company_id = $1
    `, [company.id])

    if (existingTemplate.rows.length > 0) {
      // Update existing template
      await pool.query(`
        UPDATE company_templates
        SET
          template_html = $1,
          template_name = $2,
          primary_color = $3,
          secondary_color = $4,
          is_active = true,
          updated_at = NOW()
        WHERE company_id = $5
      `, [
        demoTemplateHtml,
        'İletiGo Varsayılan Şablon',
        '#2563eb',
        '#4f46e5',
        company.id
      ])
      console.log('✅ Mevcut template güncellendi!')
    } else {
      // Insert new template
      await pool.query(`
        INSERT INTO company_templates
        (company_id, template_name, template_html, primary_color, secondary_color, is_active)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        company.id,
        'İletiGo Varsayılan Şablon',
        demoTemplateHtml,
        '#2563eb',
        '#4f46e5',
        true
      ])
      console.log('✅ Yeni template oluşturuldu!')
    }

    // Show the result
    const result = await pool.query(`
      SELECT * FROM company_templates WHERE company_id = $1
    `, [company.id])

    console.log('\n📄 Template bilgileri:')
    console.log(result.rows[0])

  } catch (error) {
    console.error('❌ Hata:', error)
  } finally {
    await pool.end()
  }
}

createDemoTemplate()
