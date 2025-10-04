const { Client } = require('pg')

const client = new Client({
  connectionString: process.env.DATABASE_URL
})

async function createR2SettingsTable() {
  try {
    await client.connect()
    console.log('Connected to database')

    // Create r2_settings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS r2_settings (
        id SERIAL PRIMARY KEY,
        account_id VARCHAR(255) NOT NULL,
        bucket_name VARCHAR(255) NOT NULL,
        access_key_id VARCHAR(255) NOT NULL,
        secret_access_key TEXT NOT NULL,
        endpoint_url VARCHAR(500),
        public_domain VARCHAR(500),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    console.log('✅ r2_settings table created successfully')

    // Check if table has any data
    const result = await client.query('SELECT COUNT(*) FROM r2_settings')
    console.log(`Current r2_settings count: ${result.rows[0].count}`)

    await client.end()
    console.log('Database connection closed')
  } catch (error) {
    console.error('Error:', error)
    await client.end()
    process.exit(1)
  }
}

createR2SettingsTable()
