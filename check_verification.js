const { Pool } = require('pg')

async function checkVerification() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgres://postgres:cA3U0JURbsbl95Y0Yf4DObCfmZO1tU4oA5IieoDYCHVExHMuYP2oDnYd3wNUt8qh@178.18.206.227:5438/postgres',
    ssl: false
  })

  try {
    const result = await pool.query(`
      SELECT id, name, require_tax_verification, require_otp_verification
      FROM companies
      ORDER BY id;
    `)

    console.log('\n📋 Firma doğrulama ayarları:')
    console.table(result.rows)

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await pool.end()
  }
}

checkVerification()
