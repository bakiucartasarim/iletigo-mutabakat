const { Client } = require('pg')

async function fixSchema() {
  const connectionString = 'postgres://postgres:cA3U0JURbsbl95Y0Yf4DObCfmZO1tU4oA5IieoDYCHVExHMuYP2oDnYd3wNUt8qh@178.18.206.227:5438/postgres'
  const client = new Client({ connectionString })

  try {
    await client.connect()
    console.log('✅ Connected to database')

    // Check if password_hash column exists
    const checkColumn = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'companies' AND column_name = 'password_hash'
    `)

    if (checkColumn.rows.length === 0) {
      console.log('❌ password_hash column missing, adding it...')
      await client.query(`
        ALTER TABLE companies
        ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255)
      `)
      console.log('✅ password_hash column added')
    } else {
      console.log('✅ password_hash column already exists')
    }

    // Check other potentially missing columns
    const columnsToAdd = [
      { name: 'phone', type: 'VARCHAR(20)' },
      { name: 'email', type: 'VARCHAR(255)' },
      { name: 'address', type: 'TEXT' },
      { name: 'contact_person', type: 'VARCHAR(255)' },
      { name: 'website', type: 'VARCHAR(255)' },
      { name: 'description', type: 'TEXT' },
      { name: 'logo_url', type: 'VARCHAR(500)' },
      { name: 'stamp_url', type: 'VARCHAR(500)' },
      { name: 'city', type: 'VARCHAR(100)' },
      { name: 'country', type: 'VARCHAR(100) DEFAULT \'Türkiye\'' },
      { name: 'code', type: 'VARCHAR(255)' }
    ]

    for (const col of columnsToAdd) {
      const check = await client.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'companies' AND column_name = $1
      `, [col.name])

      if (check.rows.length === 0) {
        console.log(`Adding column: ${col.name}`)
        await client.query(`ALTER TABLE companies ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}`)
      }
    }

    console.log('✅ Schema fix completed')

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await client.end()
  }
}

fixSchema()
