const { Pool } = require('pg')

const pool = new Pool({
  connectionString: 'postgres://postgres:cA3U0JURbsbl95Y0Yf4DObCfmZO1tU4oA5IieoDYCHVExHMuYP2oDnYd3wNUt8qh@178.18.206.227:5438/postgres',
  ssl: false
})

async function checkLinkData() {
  try {
    const referenceCode = process.argv[2]

    if (!referenceCode) {
      console.log('❌ Lütfen referans kodu giriniz: node check-link-data.js MUT-XX-XX-XXXXX')
      return
    }

    console.log(`🔍 Checking data for: ${referenceCode}\n`)

    const result = await pool.query(`
      SELECT
        rl.*,
        red.vergi_no as recipient_tax_number,
        red.ilgili_kisi_eposta as recipient_email,
        red.cari_hesap_adi as recipient_name
      FROM reconciliation_links rl
      JOIN reconciliation_excel_data red ON rl.record_id = red.id
      WHERE rl.reference_code = $1
    `, [referenceCode])

    if (result.rows.length === 0) {
      console.log('❌ Link bulunamadı!')
      return
    }

    const data = result.rows[0]
    console.log('📋 Link Data:')
    console.log(`  Reference Code: ${data.reference_code}`)
    console.log(`  Recipient Name: ${data.recipient_name}`)
    console.log(`  Recipient Email: ${data.recipient_email}`)
    console.log(`  Vergi No: ${data.recipient_tax_number}`)
    console.log(`  Son 4 Hane: ${data.recipient_tax_number?.toString().slice(-4)}`)
    console.log(`\n🔒 Verification Status:`)
    console.log(`  Attempts: ${data.verification_attempts || 0}`)
    console.log(`  Locked Until: ${data.verification_locked_until || 'Not locked'}`)
    console.log(`  Is Verified: ${data.is_verified || false}`)
    console.log(`  Verified At: ${data.verified_at || 'Not verified'}`)

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await pool.end()
  }
}

checkLinkData()
