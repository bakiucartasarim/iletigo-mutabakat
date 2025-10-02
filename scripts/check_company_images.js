const { Client } = require('pg')

async function checkCompanyImages() {
  const connectionString = process.env.DATABASE_URL
  const client = new Client({ connectionString })

  try {
    await client.connect()
    console.log('✅ Connected to database')

    const result = await client.query(`
      SELECT id, name, logo_url, stamp_url
      FROM companies
      WHERE id = 1
    `)

    if (result.rows.length > 0) {
      const company = result.rows[0]
      console.log('\n📊 Company Info:')
      console.log('  ID:', company.id)
      console.log('  Name:', company.name)
      console.log('  Logo URL:', company.logo_url || '(not set)')
      console.log('  Stamp URL:', company.stamp_url || '(not set)')
    } else {
      console.log('❌ Company not found')
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await client.end()
  }
}

checkCompanyImages()
