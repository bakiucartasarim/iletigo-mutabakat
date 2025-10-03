const { Pool } = require('pg')

async function addVerificationSettings() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgres://postgres:cA3U0JURbsbl95Y0Yf4DObCfmZO1tU4oA5IieoDYCHVExHMuYP2oDnYd3wNUt8qh@178.18.206.227:5438/postgres',
    ssl: false
  })

  try {
    console.log('🔧 Adding verification settings to companies table...')

    // Add verification settings columns
    await pool.query(`
      ALTER TABLE companies
      ADD COLUMN IF NOT EXISTS require_tax_verification BOOLEAN DEFAULT true,
      ADD COLUMN IF NOT EXISTS require_otp_verification BOOLEAN DEFAULT false;
    `)

    console.log('✅ Verification settings columns added successfully!')

    // Update existing companies to have tax verification enabled by default
    await pool.query(`
      UPDATE companies
      SET
        require_tax_verification = true,
        require_otp_verification = false
      WHERE require_tax_verification IS NULL;
    `)

    console.log('✅ Existing companies updated with default settings!')

    // Show current settings
    const result = await pool.query(`
      SELECT id, name, require_tax_verification, require_otp_verification
      FROM companies
      ORDER BY id;
    `)

    console.log('\n📋 Current verification settings:')
    console.table(result.rows)

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

addVerificationSettings()
