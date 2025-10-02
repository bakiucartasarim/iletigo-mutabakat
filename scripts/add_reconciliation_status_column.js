const { Pool } = require('pg');

async function addReconciliationStatusColumn() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false
  });

  try {
    console.log('🔄 Adding reconciliation_status column...');

    // 1. Add reconciliation_status column
    await pool.query(`
      ALTER TABLE reconciliation_excel_data
      ADD COLUMN IF NOT EXISTS reconciliation_status VARCHAR(50) DEFAULT 'beklemede';
    `);
    console.log('✅ Column reconciliation_status added');

    // 2. Migrate existing data: onaylandi and itiraz from mail_status to reconciliation_status
    await pool.query(`
      UPDATE reconciliation_excel_data
      SET reconciliation_status =
        CASE
          WHEN mail_status = 'onaylandi' THEN 'onaylandi'
          WHEN mail_status = 'itiraz' THEN 'itiraz'
          ELSE 'beklemede'
        END
      WHERE mail_status IN ('onaylandi', 'itiraz');
    `);
    console.log('✅ Existing data migrated');

    // 3. Reset mail_status for reconciliation statuses back to 'gonderildi'
    await pool.query(`
      UPDATE reconciliation_excel_data
      SET mail_status = 'gonderildi'
      WHERE mail_status IN ('onaylandi', 'itiraz');
    `);
    console.log('✅ mail_status cleaned up');

    // 4. Show summary
    const result = await pool.query(`
      SELECT
        reconciliation_status,
        COUNT(*) as count
      FROM reconciliation_excel_data
      GROUP BY reconciliation_status
      ORDER BY count DESC;
    `);

    console.log('\n📊 Reconciliation Status Summary:');
    result.rows.forEach(row => {
      console.log(`   ${row.reconciliation_status}: ${row.count}`);
    });

    console.log('\n✅ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Error during migration:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run migration
addReconciliationStatusColumn().catch(error => {
  console.error('Migration failed:', error);
  process.exit(1);
});
