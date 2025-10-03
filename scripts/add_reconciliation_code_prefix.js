const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

async function addReconciliationCodePrefix() {
  try {
    console.log('🔄 Adding reconciliation_code_prefix column to companies table...');

    // Add column if it doesn't exist
    await pool.query(`
      ALTER TABLE companies 
      ADD COLUMN IF NOT EXISTS reconciliation_code_prefix VARCHAR(10) DEFAULT NULL
    `);

    console.log('✅ Column added successfully');

    // Show current companies
    const result = await pool.query('SELECT id, name, reconciliation_code_prefix FROM companies');
    console.log('\n📊 Current companies:');
    console.table(result.rows);

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

addReconciliationCodePrefix();
