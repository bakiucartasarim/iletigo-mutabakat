const { Pool } = require('pg');

async function updateAtalga() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false
  });

  try {
    console.log('🔧 Updating company template ID 4...\n');

    // Show current values
    const before = await pool.query(`
      SELECT intro_text, note4
      FROM company_templates
      WHERE id = 4
    `);

    console.log('📋 BEFORE:');
    console.log('  intro_text:', before.rows[0].intro_text);
    console.log('  note4:', before.rows[0].note4);
    console.log('');

    // Update the template
    const result = await pool.query(`
      UPDATE company_templates
      SET
        intro_text = 'Giriş metnindeki cari hesabımız %DÖNEM% tarihi itibarıyle %TUTAR% %BORÇALACAK% bakiyesi vermektedir.',
        note4 = 'Mutabık olmanız durumunda firma@firma.com adresine e-posta olarak göndermenizi rica ederiz.',
        updated_at = NOW()
      WHERE id = 4
      RETURNING intro_text, note4
    `);

    console.log('✅ AFTER:');
    console.log('  intro_text:', result.rows[0].intro_text);
    console.log('  note4:', result.rows[0].note4);
    console.log('');
    console.log('✅ Template updated successfully!');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

updateAtalga();
