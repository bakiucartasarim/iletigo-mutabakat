const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
})

async function checkTable() {
  try {
    // Check if table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'company_templates'
      );
    `)

    console.log('Table exists:', tableCheck.rows[0].exists)

    if (tableCheck.rows[0].exists) {
      // Get column info
      const columns = await pool.query(`
        SELECT column_name, data_type, character_maximum_length
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'company_templates'
        ORDER BY ordinal_position;
      `)

      console.log('\n📊 Columns:')
      columns.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type}${col.character_maximum_length ? `(${col.character_maximum_length})` : ''}`)
      })

      // Get data
      const data = await pool.query('SELECT * FROM company_templates LIMIT 5')
      console.log('\n📄 Data:')
      console.log(data.rows)
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await pool.end()
  }
}

checkTable()
