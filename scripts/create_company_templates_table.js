const { Pool } = require('pg')

async function createCompanyTemplatesTable() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgres://postgres:cA3U0JURbsbl95Y0Yf4DObCfmZO1tU4oA5IieoDYCHVExHMuYP2oDnYd3wNUt8qh@178.18.206.227:5438/postgres',
    ssl: false
  })

  try {
    console.log('🔄 Creating company_templates table...')

    await pool.query(`
      CREATE TABLE IF NOT EXISTS company_templates (
        id SERIAL PRIMARY KEY,
        company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
        template_name VARCHAR(255) NOT NULL,
        header_text TEXT,
        intro_text TEXT,
        note1 TEXT,
        note2 TEXT,
        note3 TEXT,
        note4 TEXT,
        note5 TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `)

    console.log('✅ company_templates table created successfully')

    // Create index
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_company_templates_company ON company_templates(company_id);
    `)

    console.log('✅ Index created successfully')

    // Create trigger for updated_at
    await pool.query(`
      DROP TRIGGER IF EXISTS update_company_templates_updated_at ON company_templates;
      CREATE TRIGGER update_company_templates_updated_at
      BEFORE UPDATE ON company_templates
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
    `)

    console.log('✅ Trigger created successfully')

    // Check if table exists and show structure
    const result = await pool.query(`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'company_templates'
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

createCompanyTemplatesTable()
