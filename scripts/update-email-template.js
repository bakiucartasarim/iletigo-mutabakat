const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
})

const newTemplateContent = `
<p>Sayın {{sirketAdi}},</p>

<p>Şirketimiz sizi <strong>İletiGo</strong> üzerinden {{tarih}} tarihli Cari Hesap Bakiye Mutabakatı yapmaya davet ediyor.</p>

<p>İletiGo üzerinden Cari Hesap Bakiye Mutabakatı yapabilmeniz için aşağıdaki "İşlemi Tamamla" bağlantısına basarak mutabakat talebi detaylarına ulaşabilirsiniz.</p>

<p>Mutabakat referans numaranız: <strong>{{referansKodu}}</strong></p>

{{linkUrl}}

<p style="color: #666; font-size: 14px;">Bu link 10 gün boyunca geçerlidir.</p>

<p>Saygılarımızla,<br>
{{gonderenSirket}}</p>
`

async function updateTemplate() {
  try {
    console.log('📧 Email template güncelleniyor...\n')

    const result = await pool.query(`
      UPDATE email_templates
      SET content = $1,
          updated_at = NOW()
      WHERE company_id = 1
      RETURNING id, name
    `, [newTemplateContent])

    if (result.rowCount > 0) {
      console.log('✅ Template başarıyla güncellendi!')
      console.log('Updated template:', result.rows[0])
    } else {
      console.log('❌ Template güncellenemedi')
    }

  } catch (error) {
    console.error('❌ Hata:', error)
  } finally {
    await pool.end()
  }
}

updateTemplate()
