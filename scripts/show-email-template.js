const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
})

async function showEmailTemplate() {
  try {
    console.log('📧 Email Template İçeriği:\n')

    const result = await pool.query(`
      SELECT id, company_id, name, subject, content, is_active
      FROM email_templates
      WHERE company_id = 1
      ORDER BY created_at DESC
      LIMIT 1
    `)

    if (result.rows.length === 0) {
      console.log('❌ Email template bulunamadı')
      return
    }

    const template = result.rows[0]
    console.log('Template ID:', template.id)
    console.log('Template Name:', template.name)
    console.log('Subject:', template.subject)
    console.log('Active:', template.is_active)
    console.log('\n📄 Content:')
    console.log('=' .repeat(80))
    console.log(template.content)
    console.log('=' .repeat(80))

  } catch (error) {
    console.error('❌ Hata:', error)
  } finally {
    await pool.end()
  }
}

showEmailTemplate()
