const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const password = 'ba*1919*/';
const email = 'bakiucartasarim@gmail.com';

async function updatePassword() {
  const pool = new Pool({
    connectionString: 'postgres://postgres:cA3U0JURbsbl95Y0Yf4DObCfmZO1tU4oA5IieoDYCHVExHMuYP2oDnYd3wNUt8qh@178.18.206.227:5438/postgres',
    ssl: false
  });

  try {
    // Generate hash
    console.log('Generating hash for password:', password);
    const hash = await bcrypt.hash(password, 10);
    console.log('Generated hash:', hash);

    // Update database
    console.log('Updating database...');
    await pool.query('UPDATE users SET password_hash = $1 WHERE email = $2', [hash, email]);
    console.log('✅ Password updated successfully');

    // Verify
    const result = await pool.query('SELECT email, password_hash FROM users WHERE email = $1', [email]);
    console.log('\nVerified - Email:', result.rows[0].email);
    console.log('Verified - Hash length:', result.rows[0].password_hash.length);
    console.log('Verified - Hash:', result.rows[0].password_hash);

    // Test password
    const isMatch = await bcrypt.compare(password, result.rows[0].password_hash);
    console.log('\n✅ Test password match:', isMatch);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

updatePassword();