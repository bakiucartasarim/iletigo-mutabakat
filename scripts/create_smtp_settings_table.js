const { Pool } = require('pg')

async function createSmtpSettingsTable() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgres://postgres:cA3U0JURbsbl95Y0Yf4DObCfmZO1tU4oA5IieoDYCHVExHMuYP2oDnYd3wNUt8qh@178.18.206.227:5438/postgres',
    ssl: false
  })

  try {
    console.log('🔄 Creating smtp_settings table...')

    await pool.query(`
      CREATE TABLE IF NOT EXISTS smtp_settings (
        id SERIAL PRIMARY KEY,
        smtp_host VARCHAR(255) NOT NULL,
        smtp_port INTEGER NOT NULL,
        smtp_user VARCHAR(255) NOT NULL,
        smtp_password VARCHAR(500) NOT NULL,
        from_email VARCHAR(255) NOT NULL,
        from_name VARCHAR(255) NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `)

    console.log('✅ smtp_settings table created successfully')

    // Create trigger for updated_at
    await pool.query(`
      DROP TRIGGER IF EXISTS update_smtp_settings_updated_at ON smtp_settings;
      CREATE TRIGGER update_smtp_settings_updated_at
      BEFORE UPDATE ON smtp_settings
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
    `)

    console.log('✅ Trigger created successfully')

    // Check if table exists and show structure
    const result = await pool.query(`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'smtp_settings'
      ORDER BY ordinal_position;
    `)

    console.log('\n📋 Table structure:')
    console.table(result.rows)

  } catch (error) {
    console.error('❌ Error:', error.message)
    throw error
  } finally {
    await pool.end()
  }
}

createSmtpSettingsTable()
