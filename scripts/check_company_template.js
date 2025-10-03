const { Pool } = require('pg');

async function checkCompanyTemplate() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false
  });

  try {
    console.log('🔍 Checking company template id 4...\n');

    // Check template
    const templateResult = await pool.query(`
      SELECT *
      FROM company_templates
      WHERE id = 4
    `);

    if (templateResult.rows.length > 0) {
      const template = templateResult.rows[0];
      console.log('📄 Template Found:');
      console.log(JSON.stringify(template, null, 2));
    } else {
      console.log('❌ Template with id 4 not found');
    }

    // Check all templates for this company
    console.log('\n📋 All templates for company:');
    const allTemplates = await pool.query(`
      SELECT id, company_id, template_name, created_at, updated_at
      FROM company_templates
      ORDER BY created_at DESC
    `);

    allTemplates.rows.forEach(t => {
      console.log(`  - ID: ${t.id}, Company: ${t.company_id}, Name: ${t.template_name}, Updated: ${t.updated_at}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

checkCompanyTemplate();
