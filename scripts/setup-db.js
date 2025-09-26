const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

const pool = new Pool({
  connectionString: 'postgres://postgres:cA3U0JURbsbl95Y0Yf4DObCfmZO1tU4oA5IieoDYCHVExHMuYP2oDnYd3wNUt8qh@178.18.206.227:5438/postgres',
  ssl: false
})

async function setupDatabase() {
  try {
    console.log('Veritabanı bağlantısı kuruluyor...')

    // Read SQL file
    const sqlFile = path.join(__dirname, 'init-db.sql')
    const sql = fs.readFileSync(sqlFile, 'utf8')

    console.log('Tabloları oluşturuluyor...')
    await pool.query(sql)

    console.log('✅ Veritabanı başarıyla kuruldu!')
    console.log('📧 Varsayılan admin: admin@iletigo.com')
    console.log('🔑 Varsayılan şifre: admin123')

  } catch (error) {
    console.error('❌ Veritabanı kurulum hatası:', error)
  } finally {
    await pool.end()
  }
}

setupDatabase()