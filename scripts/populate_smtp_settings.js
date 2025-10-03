const { Pool } = require('pg')

async function populateSmtpSettings() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgres://postgres:cA3U0JURbsbl95Y0Yf4DObCfmZO1tU4oA5IieoDYCHVExHMuYP2oDnYd3wNUt8qh@178.18.206.227:5438/postgres',
    ssl: false
  })

  try {
    console.log('🔄 Populating smtp_settings table...')

    // Check if settings already exist
    const existing = await pool.query('SELECT id FROM smtp_settings LIMIT 1')

    if (existing.rows.length > 0) {
      console.log('⚠️  SMTP settings already exist in database')
      console.log('Do you want to update them? (This will overwrite existing settings)')

      // For now, we'll just show existing settings
      const result = await pool.query(`
        SELECT smtp_host, smtp_port, smtp_user, from_email, from_name, is_active, created_at
        FROM smtp_settings
        ORDER BY id DESC
        LIMIT 1
      `)

      console.log('\n📋 Current SMTP Settings:')
      console.table(result.rows)
      return
    }

    // Insert initial SMTP settings from .env values
    await pool.query(`
      INSERT INTO smtp_settings (smtp_host, smtp_port, smtp_user, smtp_password, from_email, from_name, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      'smtpout.secureserver.net',
      465,
      'socialhub@atalga.com',
      'ba*1919*/*/*/',
      'socialhub@atalga.com',
      'İletigo Mail Engine',
      true
    ])

    console.log('✅ SMTP settings populated successfully')

    // Verify insertion
    const result = await pool.query(`
      SELECT smtp_host, smtp_port, smtp_user, from_email, from_name, is_active, created_at
      FROM smtp_settings
      ORDER BY id DESC
      LIMIT 1
    `)

    console.log('\n📋 Inserted SMTP Settings:')
    console.table(result.rows)

  } catch (error) {
    console.error('❌ Error:', error.message)
    throw error
  } finally {
    await pool.end()
  }
}

populateSmtpSettings()
