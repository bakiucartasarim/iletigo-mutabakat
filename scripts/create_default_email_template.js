const { Client } = require('pg')

async function createDefaultEmailTemplate() {
  const connectionString = process.env.DATABASE_URL || process.env.DATABASE_URL
  const client = new Client({ connectionString })

  try {
    await client.connect()
    console.log('✅ Connected to database')

    // Check if default template exists
    const checkExisting = await client.query(
      "SELECT id FROM email_templates WHERE company_id = 1 AND name = 'Cari Mutabakat Davet Maili'"
    )

    if (checkExisting.rows.length === 0) {
      // Create default email template
      await client.query(`
        INSERT INTO email_templates (
          company_id,
          name,
          subject,
          content,
          variables,
          is_active
        ) VALUES (
          1,
          'Cari Mutabakat Davet Maili',
          'Cari Hesap Bakiye Mutabakatı Daveti - {{referansKodu}}',
          '<p>Sayın {{sirketAdi}},</p>

<p>Şirketimiz sizi <strong>İletiGo</strong> üzerinden {{tarih}} tarihli Cari Hesap Bakiye Mutabakatı yapmaya davet ediyor.</p>

<p>İletiGo üzerinden Cari Hesap Bakiye Mutabakatı yapabilmeniz için aşağıdaki "İşlemi Tamamla" bağlantısına basarak mutabakat talebi detaylarına ulaşabilirsiniz.</p>

<p>Mutabakat referans numaranız: <strong>{{referansKodu}}</strong></p>

<div style="text-align: center; margin: 30px 0;">
  <a href="{{linkUrl}}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
    İşlemi Tamamla
  </a>
</div>

<p style="color: #666; font-size: 14px;">Bu link 30 gün boyunca geçerlidir.</p>

<p>Saygılarımızla,<br>
{{gonderenSirket}}</p>',
          '["sirketAdi", "tarih", "referansKodu", "linkUrl", "gonderenSirket"]'::jsonb,
          true
        )
      `)
      console.log('✅ Default email template created')
    } else {
      console.log('ℹ️  Default email template already exists')
    }

    console.log('\n✅ Operation completed successfully!')

  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  } finally {
    await client.end()
  }
}

createDefaultEmailTemplate()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
