const { Client } = require('pg')

async function createReconciliationLinksTable() {
  const connectionString = process.env.DATABASE_URL || process.env.DATABASE_URL
  const client = new Client({ connectionString })

  try {
    await client.connect()
    console.log('✅ Connected to database')

    // Create reconciliation_links table for secure link tracking
    await client.query(`
      CREATE TABLE IF NOT EXISTS reconciliation_links (
        id SERIAL PRIMARY KEY,
        reference_code VARCHAR(255) UNIQUE NOT NULL,
        reconciliation_id INTEGER REFERENCES reconciliations(id) ON DELETE CASCADE,
        record_id INTEGER NOT NULL,
        recipient_email VARCHAR(255) NOT NULL,
        recipient_name VARCHAR(255),
        amount DECIMAL(15,2),
        balance_type VARCHAR(50),
        is_used BOOLEAN DEFAULT FALSE,
        is_expired BOOLEAN DEFAULT FALSE,
        expires_at TIMESTAMP NOT NULL,
        used_at TIMESTAMP,
        response_status VARCHAR(50), -- 'mutabik', 'itiraz', 'beklemede'
        response_note TEXT,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    console.log('✅ reconciliation_links table created successfully')

    // Create index for faster lookup
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_reconciliation_links_reference_code
      ON reconciliation_links(reference_code)
    `)

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_reconciliation_links_reconciliation_id
      ON reconciliation_links(reconciliation_id)
    `)

    console.log('✅ Indexes created successfully')

  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  } finally {
    await client.end()
  }
}

createReconciliationLinksTable()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
