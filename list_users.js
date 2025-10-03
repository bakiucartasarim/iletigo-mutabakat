const { Pool } = require('pg')

async function listUsers() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgres://postgres:cA3U0JURbsbl95Y0Yf4DObCfmZO1tU4oA5IieoDYCHVExHMuYP2oDnYd3wNUt8qh@178.18.206.227:5438/postgres',
    ssl: false
  })

  try {
    const result = await pool.query(`
      SELECT id, email, first_name, last_name, role, is_active, company_id
      FROM users
      ORDER BY id;
    `)

    console.log('\n📋 Tüm kullanıcılar:')
    console.table(result.rows)

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await pool.end()
  }
}

listUsers()
