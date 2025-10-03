const { Pool } = require('pg')

async function checkBrevoSettings() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgres://postgres:cA3U0JURbsbl95Y0Yf4DObCfmZO1tU4oA5IieoDYCHVExHMuYP2oDnYd3wNUt8qh@178.18.206.227:5438/postgres',
    ssl: false
  })

  try {
    const result = await pool.query(`
      SELECT id, from_email, from_name, is_active, created_at, updated_at
      FROM brevo_settings
      ORDER BY id DESC
    `)

    console.log('📊 Brevo Settings:')
    console.table(result.rows)
    console.log(`\n Total: ${result.rows.length} record(s)`)

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await pool.end()
  }
}

checkBrevoSettings()
