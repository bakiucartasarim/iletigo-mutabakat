const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

async function setupDatabase() {
  const schemaFile = path.join(__dirname, '../database/schema.sql');
  const excelDataFile = path.join(__dirname, '../database/add_excel_data_table.sql');

  if (!fs.existsSync(schemaFile)) {
    console.error('❌ Schema file not found:', schemaFile);
    return;
  }

  if (!process.env.DATABASE_URL) {
    console.log('📋 DATABASE_URL not set. Please run the following SQL manually:');
    console.log('=====================================');
    console.log('MAIN SCHEMA:');
    const mainSql = fs.readFileSync(schemaFile, 'utf8');
    console.log(mainSql);

    if (fs.existsSync(excelDataFile)) {
      console.log('\nEXCEL DATA TABLE:');
      const excelSql = fs.readFileSync(excelDataFile, 'utf8');
      console.log(excelSql);
    }
    console.log('=====================================');
    return;
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔄 Setting up database schema...');

    // 1. Run main schema
    console.log('📝 Creating main tables...');
    const mainSql = fs.readFileSync(schemaFile, 'utf8');
    await pool.query(mainSql);
    console.log('✅ Main schema created successfully');

    // 2. Run excel data table migration
    if (fs.existsSync(excelDataFile)) {
      console.log('📝 Creating Excel data table...');
      const excelSql = fs.readFileSync(excelDataFile, 'utf8');
      await pool.query(excelSql);
      console.log('✅ Excel data table created successfully');
    }

    console.log('\n🎉 Database setup completed successfully!');
    console.log('📊 Tables created:');
    console.log('   - users');
    console.log('   - companies');
    console.log('   - reconciliation_periods');
    console.log('   - reconciliations');
    console.log('   - reconciliation_details');
    console.log('   - reconciliation_excel_data');
    console.log('   - attachments');
    console.log('   - comments');
    console.log('   - activity_logs');
    console.log('   - settings');
    console.log('   - user_sessions');

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.log('\n📋 Please run the SQL manually:');
    console.log('=====================================');
    console.log('MAIN SCHEMA:');
    const mainSql = fs.readFileSync(schemaFile, 'utf8');
    console.log(mainSql);

    if (fs.existsSync(excelDataFile)) {
      console.log('\nEXCEL DATA TABLE:');
      const excelSql = fs.readFileSync(excelDataFile, 'utf8');
      console.log(excelSql);
    }
    console.log('=====================================');
  } finally {
    await pool.end();
  }
}

setupDatabase().catch(console.error);