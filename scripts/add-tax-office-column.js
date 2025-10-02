const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
})

async function addColumn() {
  try {
    console.log('📊 Adding tax_office column to companies table...\n')

    // Check if column exists
    const checkColumn = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'companies'
      AND column_name = 'tax_office'
    `)

    if (checkColumn.rows.length > 0) {
      console.log('✅ Column tax_office already exists!')
    } else {
      // Add column
      await pool.query(`
        ALTER TABLE companies
        ADD COLUMN tax_office VARCHAR(255)
      `)
      console.log('✅ Column tax_office added successfully!')
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await pool.end()
  }
}

addColumn()
