const { Pool } = require('pg')

async function checkConstraint() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgres://postgres:cA3U0JURbsbl95Y0Yf4DObCfmZO1tU4oA5IieoDYCHVExHMuYP2oDnYd3wNUt8qh@178.18.206.227:5438/postgres',
    ssl: false
  })

  try {
    const result = await pool.query(`
      SELECT constraint_name, check_clause
      FROM information_schema.check_constraints
      WHERE constraint_name LIKE '%role%'
        AND constraint_schema = 'public';
    `)

    console.log('\n📋 Role constraints:')
    console.table(result.rows)

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await pool.end()
  }
}

checkConstraint()
