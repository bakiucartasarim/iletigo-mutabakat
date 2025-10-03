const { Pool } = require('pg')

async function checkUser() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgres://postgres:cA3U0JURbsbl95Y0Yf4DObCfmZO1tU4oA5IieoDYCHVExHMuYP2oDnYd3wNUt8qh@178.18.206.227:5438/postgres',
    ssl: false
  })

  try {
    const result = await pool.query(`
      SELECT id, email, first_name, last_name, role, is_active, company_id, 
             LENGTH(password_hash) as hash_length,
             created_at
      FROM users
      WHERE email = 'hakanyildirim@atwork.com.tr';
    `)

    if (result.rows.length === 0) {
      console.log('❌ Kullanıcı bulunamadı!')
    } else {
      console.log('\n📋 Kullanıcı bilgileri:')
      console.table(result.rows)
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await pool.end()
  }
}

checkUser()
