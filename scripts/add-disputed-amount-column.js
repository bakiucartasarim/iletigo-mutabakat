const { Pool } = require('pg')

const pool = new Pool({
  connectionString: 'postgres://postgres:cA3U0JURbsbl95Y0Yf4DObCfmZO1tU4oA5IieoDYCHVExHMuYP2oDnYd3wNUt8qh@178.18.206.227:5438/postgres',
  ssl: false
})

async function addColumn() {
  try {
    console.log('📊 Adding disputed_amount column to reconciliation_links table...\n')

    // Check if column exists
    const checkColumn = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'reconciliation_links'
      AND column_name = 'disputed_amount'
    `)

    if (checkColumn.rows.length > 0) {
      console.log('✅ Column disputed_amount already exists!')
    } else {
      // Add column
      await pool.query(`
        ALTER TABLE reconciliation_links
        ADD COLUMN disputed_amount DECIMAL(15, 2)
      `)
      console.log('✅ Column disputed_amount added successfully!')
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await pool.end()
  }
}

addColumn()
