const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

async function runMigration() {
  const migrationFile = path.join(__dirname, '../database/add_excel_data_table.sql');

  if (!fs.existsSync(migrationFile)) {
    console.error('❌ Migration file not found:', migrationFile);
    return;
  }

  if (!process.env.DATABASE_URL) {
    console.log('📋 DATABASE_URL not set. Please run the following SQL manually:');
    console.log('=====================================');
    const sql = fs.readFileSync(migrationFile, 'utf8');
    console.log(sql);
    console.log('=====================================');
    return;
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔄 Running database migration...');

    const sql = fs.readFileSync(migrationFile, 'utf8');
    await pool.query(sql);

    console.log('✅ Excel data table migration completed successfully');
    console.log('📊 Tables created:');
    console.log('   - reconciliation_excel_data');
    console.log('   - Indexes: reconciliation_id, cari_hesap_kodu');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.log('\n📋 Please run the SQL manually:');
    console.log('=====================================');
    const sql = fs.readFileSync(migrationFile, 'utf8');
    console.log(sql);
    console.log('=====================================');
  } finally {
    await pool.end();
  }
}

runMigration().catch(console.error);