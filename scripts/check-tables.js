const { Pool } = require('pg')

const pool = new Pool({
  connectionString: 'postgres://postgres:cA3U0JURbsbl95Y0Yf4DObCfmZO1tU4oA5IieoDYCHVExHMuYP2oDnYd3wNUt8qh@178.18.206.227:5438/postgres',
  ssl: false
})

async function checkTables() {
  try {
    console.log('📋 Veritabanı tablolarını kontrol ediliyor...\n')

    // Tüm tabloları listele
    const tablesResult = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `)

    console.log('📊 Mevcut Tablolar:')
    console.log('==================')
    tablesResult.rows.forEach(row => {
      console.log(`• ${row.table_name}`)
    })

    console.log('\n👥 USERS Tablosu:')
    console.log('=================')
    const usersResult = await pool.query('SELECT * FROM users ORDER BY id')
    console.table(usersResult.rows)

    console.log('\n🏢 COMPANIES Tablosu:')
    console.log('=====================')
    const companiesResult = await pool.query('SELECT * FROM companies ORDER BY id')
    if (companiesResult.rows.length > 0) {
      console.table(companiesResult.rows)
    } else {
      console.log('Henüz şirket kaydı yok.')
    }

    console.log('\n📋 RECONCILIATIONS Tablosu:')
    console.log('============================')
    const reconciliationsResult = await pool.query('SELECT * FROM reconciliations ORDER BY id')
    if (reconciliationsResult.rows.length > 0) {
      console.table(reconciliationsResult.rows)
    } else {
      console.log('Henüz mutabakat kaydı yok.')
    }

    // Tablo yapıları
    console.log('\n🔍 USERS Tablo Yapısı:')
    console.log('======================')
    const usersSchema = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `)
    console.table(usersSchema.rows)

  } catch (error) {
    console.error('❌ Hata:', error.message)
  } finally {
    await pool.end()
  }
}

checkTables()