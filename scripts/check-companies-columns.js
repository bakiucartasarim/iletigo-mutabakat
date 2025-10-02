const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
})

async function checkColumns() {
  try {
    console.log('📊 Checking companies table columns...\n')

    const columns = await pool.query(`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'companies'
      ORDER BY ordinal_position;
    `)

    console.log('📋 Columns:')
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}${col.character_maximum_length ? `(${col.character_maximum_length})` : ''}`)
    })

    // Get sample data
    const data = await pool.query('SELECT * FROM companies LIMIT 1')
    console.log('\n📄 Sample data:')
    console.log(data.rows[0])

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await pool.end()
  }
}

checkColumns()
