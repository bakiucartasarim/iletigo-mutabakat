const { Pool } = require('pg');

async function getLatestReference() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false
  });

  try {
    console.log('🔍 Getting latest reference codes...\n');

    const result = await pool.query(`
      SELECT
        rl.reference_code,
        rl.reconciliation_id,
        rl.record_id,
        c.name as company_name,
        ct.id as template_id,
        ct.template_name,
        ct.intro_text
      FROM reconciliation_links rl
      JOIN reconciliations r ON rl.reconciliation_id = r.id
      JOIN companies c ON r.company_id = c.id
      LEFT JOIN company_templates ct ON c.id = ct.company_id AND ct.is_active = true
      ORDER BY rl.created_at DESC
      LIMIT 5
    `);

    console.log(`📋 Latest 5 reference codes:\n`);
    result.rows.forEach((row, index) => {
      console.log(`${index + 1}. Reference: ${row.reference_code.substring(0, 20)}...`);
      console.log(`   Company: ${row.company_name}`);
      console.log(`   Template ID: ${row.template_id}`);
      console.log(`   Template: ${row.template_name}`);
      console.log(`   Intro: ${row.intro_text ? row.intro_text.substring(0, 50) + '...' : 'NULL'}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

getLatestReference();
