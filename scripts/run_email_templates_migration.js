const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

async function runMigration() {
  const connectionString = process.env.DATABASE_URL || 'postgres://postgres:cA3U0JURbsbl95Y0Yf4DObCfmZO1tU4oA5IieoDYCHVExHMuYP2oDnYd3wNUt8qh@178.18.206.227:5438/postgres'

  const client = new Client({ connectionString })

  try {
    await client.connect()
    console.log('✅ Database connected')

    // Read migration file
    const migrationPath = path.join(__dirname, '..', 'database', 'migration_email_templates.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')

    console.log('📋 Running email_templates migration...')
    await client.query(migrationSQL)

    console.log('✅ Email templates table created successfully!')

    // Check if table exists and has data
    const result = await client.query('SELECT COUNT(*) FROM email_templates')
    console.log(`📊 Total templates in database: ${result.rows[0].count}`)

  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await client.end()
  }
}

runMigration()
