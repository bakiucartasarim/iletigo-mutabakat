const { Pool } = require('pg');

async function updateEmailTemplateSubject() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false
  });

  try {
    console.log('🔍 Checking email templates...');

    // Check current templates
    const checkResult = await pool.query(`
      SELECT id, name, subject FROM email_templates
      ORDER BY created_at DESC
    `);

    console.log(`\n📋 Found ${checkResult.rows.length} template(s):`);
    checkResult.rows.forEach(row => {
      console.log(`  - ID: ${row.id}, Name: ${row.name}`);
      console.log(`    Subject: ${row.subject}`);
    });

    // Update templates that use {{referansKodu}} or {{donem}} in subject
    const updateResult = await pool.query(`
      UPDATE email_templates
      SET subject = REPLACE(REPLACE(subject, '{{referansKodu}}', '{{mutabakatKodu}}'), '{{donem}}', '{{mutabakatKodu}}'),
          updated_at = NOW()
      WHERE subject LIKE '%{{referansKodu}}%' OR subject LIKE '%{{donem}}%'
      RETURNING id, name, subject
    `);

    if (updateResult.rows.length > 0) {
      console.log(`\n✅ Updated ${updateResult.rows.length} template(s):`);
      updateResult.rows.forEach(row => {
        console.log(`  - ID: ${row.id}, Name: ${row.name}`);
        console.log(`    New Subject: ${row.subject}`);
      });
    } else {
      console.log('\n✅ No templates needed updating');
    }

    console.log('\n✅ Email template subject update completed successfully!');
  } catch (error) {
    console.error('❌ Error updating email template subject:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

updateEmailTemplateSubject();
