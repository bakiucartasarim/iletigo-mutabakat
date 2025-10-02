const { Pool } = require('pg')

const pool = new Pool({
  connectionString: 'postgres://postgres:cA3U0JURbsbl95Y0Yf4DObCfmZO1tU4oA5IieoDYCHVExHMuYP2oDnYd3wNUt8qh@178.18.206.227:5438/postgres',
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
