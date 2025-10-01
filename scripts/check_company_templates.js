const { Client } = require('pg')

async function checkCompanyTemplates() {
  const connectionString = process.env.DATABASE_URL || 'postgres://postgres:cA3U0JURbsbl95Y0Yf4DObCfmZO1tU4oA5IieoDYCHVExHMuYP2oDnYd3wNUt8qh@178.18.206.227:5438/postgres'
  const client = new Client({ connectionString })

  try {
    await client.connect()
    console.log('✅ Connected to database')

    // Check if table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'company_templates'
      )
    `)

    if (!tableCheck.rows[0].exists) {
      console.log('❌ company_templates table does not exist')
      console.log('Run: npm run migrate OR node scripts/create_company_templates_table.js')
      return
    }

    console.log('✅ company_templates table exists')

    // Get all templates
    const result = await client.query(`
      SELECT id, company_id, template_name,
             LEFT(intro_text, 50) as intro_preview,
             is_active, created_at
      FROM company_templates
      ORDER BY created_at DESC
    `)

    console.log(`\n📊 Found ${result.rows.length} company templates:\n`)

    if (result.rows.length === 0) {
      console.log('No templates found. Creating default template for company ID 1...\n')

      await client.query(`
        INSERT INTO company_templates (
          company_id, template_name, header_text, intro_text,
          note1, note2, note3, note4, note5
        ) VALUES (
          1,
          'Cari Mutabakat',
          '',
          'Giriş metnindeki cari hesabımız %DÖNEM% tarihi itibarıyle %TUTAR% %BORÇALACAK% bakiyesi vermektedir.',
          'Hata ve Unutma Müstesnadır.',
          'Mutabakat veya itirazınız 30 gün içinde bildirmedığiniz takdirde TTK''nın 94. maddesi uyarınca mutabık sayılacağınızı hatırlatırız.',
          'Mutabakat ile ilgili sorunlarınız için nolu telefondan Sayın ile görüşebilirsiniz.',
          'Mutabık olmanızız durumunda cari hesap ekstrenizi www.kolaymutabakat.com sitesine yüklemenizi yada asım.koc@dorufinansol.com adresine e-posta olarak göndermenizi rica ederiz.',
          ''
        )
      `)

      console.log('✅ Default template created for company ID 1\n')

      // Fetch again
      const newResult = await client.query(`
        SELECT id, company_id, template_name,
               LEFT(intro_text, 50) as intro_preview,
               is_active, created_at
        FROM company_templates
        ORDER BY created_at DESC
      `)

      result.rows = newResult.rows
    }

    result.rows.forEach((row, index) => {
      console.log(`${index + 1}. Template ID: ${row.id}`)
      console.log(`   Company ID: ${row.company_id}`)
      console.log(`   Name: ${row.template_name}`)
      console.log(`   Intro: ${row.intro_preview}...`)
      console.log(`   Active: ${row.is_active}`)
      console.log(`   Created: ${new Date(row.created_at).toLocaleString('tr-TR')}`)
      console.log()
    })

  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  } finally {
    await client.end()
  }
}

checkCompanyTemplates()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
