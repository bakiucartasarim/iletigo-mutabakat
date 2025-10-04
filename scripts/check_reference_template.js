const { Pool } = require('pg');

async function checkReference() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false
  });

  try {
    const referenceCode = 'AD9EF9A7D18DA022F5392E27D453669E466A7879813AE98D4A9C7BAC7D7E5110';

    console.log(`🔍 Checking reference code: ${referenceCode}\n`);

    // Get the data exactly as the API does
    const result = await pool.query(`
      SELECT
        rl.reference_code,
        rl.reconciliation_id,
        rl.record_id,
        r.company_id,
        c.name as company_name,
        ct.id as template_id,
        ct.template_name,
        ct.intro_text,
        ct.note4,
        ct.is_active as template_active
      FROM reconciliation_links rl
      JOIN reconciliations r ON rl.reconciliation_id = r.id
      JOIN companies c ON r.company_id = c.id
      LEFT JOIN company_templates ct ON c.id = ct.company_id AND ct.is_active = true
      WHERE rl.reference_code = $1
    `, [referenceCode]);

    if (result.rows.length === 0) {
      console.log('❌ Reference code not found');
      return;
    }

    const data = result.rows[0];
    console.log('📄 Reference Code Info:');
    console.log(`  Reference Code: ${data.reference_code}`);
    console.log(`  Reconciliation ID: ${data.reconciliation_id}`);
    console.log(`  Record ID: ${data.record_id}`);
    console.log(`  Company ID: ${data.company_id}`);
    console.log(`  Company Name: ${data.company_name}`);
    console.log('');
    console.log('📋 Using Company Template:');
    console.log(`  Template ID: ${data.template_id}`);
    console.log(`  Template Name: ${data.template_name}`);
    console.log(`  Template Active: ${data.template_active}`);
    console.log('');
    console.log('📝 Template Content:');
    console.log(`  Intro Text: ${data.intro_text}`);
    console.log(`  Note 4: ${data.note4}`);

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

checkReference();
