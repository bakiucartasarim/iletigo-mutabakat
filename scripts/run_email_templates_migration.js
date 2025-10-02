const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

async function runMigration() {
  const connectionString = process.env.DATABASE_URL || process.env.DATABASE_URL

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
