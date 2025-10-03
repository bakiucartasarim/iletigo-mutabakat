const { Pool } = require('pg')

async function checkLatestUser() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgres://postgres:cA3U0JURbsbl95Y0Yf4DObCfmZO1tU4oA5IieoDYCHVExHMuYP2oDnYd3wNUt8qh@178.18.206.227:5438/postgres',
    ssl: false
  })

  try {
    const result = await pool.query(`
      SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.is_active, 
             u.company_id, c.name as company_name,
             LENGTH(u.password_hash) as hash_length,
             u.created_at
      FROM users u
      LEFT JOIN companies c ON u.company_id = c.id
      ORDER BY u.created_at DESC
      LIMIT 5;
    `)

    console.log('\n📋 Son kaydedilen kullanıcılar:')
    console.table(result.rows)

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await pool.end()
  }
}

checkLatestUser()
