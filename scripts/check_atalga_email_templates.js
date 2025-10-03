const { Pool } = require('pg');

async function checkAtalga() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false
  });

  try {
    console.log('🔍 Checking Atalga (company_id=6) email templates...\n');

    // Check email templates for Atalga
    const emailTemplates = await pool.query(`
      SELECT id, company_id, name, subject, LEFT(content, 200) as content_preview, is_active
      FROM email_templates
      WHERE company_id = 6
      ORDER BY created_at DESC
    `);

    console.log(`📧 Found ${emailTemplates.rows.length} email template(s) for Atalga:\n`);
    emailTemplates.rows.forEach(t => {
      console.log(`  - ID: ${t.id}`);
      console.log(`    Name: ${t.name}`);
      console.log(`    Subject: ${t.subject}`);
      console.log(`    Active: ${t.is_active}`);
      console.log(`    Content preview: ${t.content_preview}...`);
      console.log('');
    });

    // Check company_templates for Atalga
    const companyTemplate = await pool.query(`
      SELECT id, template_name, intro_text, note4
      FROM company_templates
      WHERE company_id = 6
    `);

    console.log(`📄 Company Template for Atalga:\n`);
    if (companyTemplate.rows.length > 0) {
      const t = companyTemplate.rows[0];
      console.log(`  ID: ${t.id}`);
      console.log(`  Name: ${t.template_name}`);
      console.log(`  Intro: ${t.intro_text}`);
      console.log(`  Note4: ${t.note4}`);
    } else {
      console.log('  No company template found');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

checkAtalga();
