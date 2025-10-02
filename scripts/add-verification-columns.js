const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
})

async function addColumns() {
  try {
    console.log('📊 Adding verification columns to reconciliation_links table...\n')

    // Check existing columns
    const checkColumns = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'reconciliation_links'
      AND column_name IN ('verification_attempts', 'verification_locked_until', 'verification_code', 'verification_code_expires_at', 'is_verified', 'verified_at')
    `)

    const existingColumns = checkColumns.rows.map(row => row.column_name)
    console.log('📋 Existing verification columns:', existingColumns)

    // Add verification_attempts
    if (!existingColumns.includes('verification_attempts')) {
      await pool.query(`
        ALTER TABLE reconciliation_links
        ADD COLUMN verification_attempts INTEGER DEFAULT 0
      `)
      console.log('✅ verification_attempts column added')
    }

    // Add verification_locked_until
    if (!existingColumns.includes('verification_locked_until')) {
      await pool.query(`
        ALTER TABLE reconciliation_links
        ADD COLUMN verification_locked_until TIMESTAMP
      `)
      console.log('✅ verification_locked_until column added')
    }

    // Add verification_code
    if (!existingColumns.includes('verification_code')) {
      await pool.query(`
        ALTER TABLE reconciliation_links
        ADD COLUMN verification_code VARCHAR(6)
      `)
      console.log('✅ verification_code column added')
    }

    // Add verification_code_expires_at
    if (!existingColumns.includes('verification_code_expires_at')) {
      await pool.query(`
        ALTER TABLE reconciliation_links
        ADD COLUMN verification_code_expires_at TIMESTAMP
      `)
      console.log('✅ verification_code_expires_at column added')
    }

    // Add is_verified
    if (!existingColumns.includes('is_verified')) {
      await pool.query(`
        ALTER TABLE reconciliation_links
        ADD COLUMN is_verified BOOLEAN DEFAULT FALSE
      `)
      console.log('✅ is_verified column added')
    }

    // Add verified_at
    if (!existingColumns.includes('verified_at')) {
      await pool.query(`
        ALTER TABLE reconciliation_links
        ADD COLUMN verified_at TIMESTAMP
      `)
      console.log('✅ verified_at column added')
    }

    console.log('\n✅ All verification columns added successfully!')

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await pool.end()
  }
}

addColumns()
