import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'
import { query } from '@/lib/db'

interface MailRecord {
  id: number
  email: string
  cari_hesap_adi: string
  tutar: number
  borc_alacak: string
}

interface EmailTemplate {
  id: number
  company_id: number
  name: string
  subject: string
  content: string
  variables: string[]
  is_active: boolean
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { records }: { records: MailRecord[] } = await request.json()
    const { id: reconciliationId } = params

    if (!records || !Array.isArray(records) || records.length === 0) {
      return NextResponse.json(
        { error: 'Gönderilecek kayıt bulunamadı' },
        { status: 400 }
      )
    }

    if (!process.env.DATABASE_URL) {
      // Mock mode - simulate mail sending
      console.log('📧 Mock mode: Mail gönderimi simüle ediliyor...')

      for (const record of records) {
        console.log(`📨 Mail gönderiliyor: ${record.email} - ${record.cari_hesap_adi}`)
      }

      return NextResponse.json({
        success: true,
        message: `${records.length} mail başarıyla gönderildi (Mock Mode)`,
        sent_count: records.length,
        failed_count: 0,
        details: records.map(record => ({
          id: record.id,
          email: record.email,
          status: 'gonderildi',
          message: 'Mock mode - Mail gönderildi'
        }))
      })
    }

    // Real database operations
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: false
    })

    try {
      await pool.query('BEGIN')

      let sentCount = 0
      let failedCount = 0
      const details = []

      for (const record of records) {
        try {
          // Here you would implement actual email sending logic
          // For now, we'll simulate successful sending
          const emailSent = await sendEmail(record, reconciliationId)

          if (emailSent) {
            // Update mail status to 'gonderildi'
            await pool.query(`
              UPDATE reconciliation_excel_data
              SET mail_status = 'gonderildi', updated_at = NOW()
              WHERE id = $1 AND reconciliation_id = $2
            `, [record.id, reconciliationId])

            sentCount++
            details.push({
              id: record.id,
              email: record.email,
              status: 'gonderildi',
              message: 'Mail başarıyla gönderildi'
            })
          } else {
            // Update mail status to 'hata'
            await pool.query(`
              UPDATE reconciliation_excel_data
              SET mail_status = 'hata', updated_at = NOW()
              WHERE id = $1 AND reconciliation_id = $2
            `, [record.id, reconciliationId])

            failedCount++
            details.push({
              id: record.id,
              email: record.email,
              status: 'hata',
              message: 'Mail gönderiminde hata oluştu'
            })
          }
        } catch (emailError) {
          console.error(`Mail gönderim hatası (${record.email}):`, emailError)

          // Update mail status to 'hata'
          await pool.query(`
            UPDATE reconciliation_excel_data
            SET mail_status = 'hata', updated_at = NOW()
            WHERE id = $1 AND reconciliation_id = $2
          `, [record.id, reconciliationId])

          failedCount++
          details.push({
            id: record.id,
            email: record.email,
            status: 'hata',
            message: emailError.message || 'Mail gönderiminde hata oluştu'
          })
        }
      }

      await pool.query('COMMIT')

      return NextResponse.json({
        success: true,
        message: `${sentCount} mail başarıyla gönderildi${failedCount > 0 ? `, ${failedCount} mail başarısız` : ''}`,
        sent_count: sentCount,
        failed_count: failedCount,
        details
      })

    } catch (dbError) {
      await pool.query('ROLLBACK')
      throw dbError
    } finally {
      await pool.end()
    }

  } catch (error) {
    console.error('Mail gönderim hatası:', error)
    return NextResponse.json(
      { error: 'Mail gönderiminde hata oluştu: ' + error.message },
      { status: 500 }
    )
  }
}

// Brevo email sending function
async function sendEmail(record: MailRecord, reconciliationId: string): Promise<boolean> {
  try {
    // Fetch email template from database
    const templateResult = await query(`
      SELECT et.* FROM email_templates et
      JOIN reconciliations r ON r.company_id = et.company_id
      WHERE r.id = $1 AND et.is_active = true
      ORDER BY et.created_at DESC
      LIMIT 1
    `, [reconciliationId])

    if (templateResult.rows.length === 0) {
      console.error('❌ Email template not found for this company')
      return false
    }

    const template: EmailTemplate = templateResult.rows[0]

    // Fetch reconciliation and company data
    const reconData = await query(`
      SELECT r.*, c.name as company_name, c.email as company_email
      FROM reconciliations r
      JOIN companies c ON r.company_id = c.id
      WHERE r.id = $1
    `, [reconciliationId])

    if (reconData.rows.length === 0) {
      console.error('❌ Reconciliation data not found')
      return false
    }

    const recon = reconData.rows[0]

    // Check if there's already an existing link for this record
    const existingLinkResult = await query(`
      SELECT reference_code, expires_at FROM reconciliation_links
      WHERE reconciliation_id = $1 AND record_id = $2
      ORDER BY created_at DESC
      LIMIT 1
    `, [reconciliationId, record.id])

    let referenceCode: string

    if (existingLinkResult.rows.length > 0) {
      // Reuse existing link
      referenceCode = existingLinkResult.rows[0].reference_code
      console.log(`📎 Reusing existing link for record ${record.id}: ${referenceCode}`)
    } else {
      // Generate new secure unique reference code using crypto hash
      const crypto = require('crypto')
      const randomBytes = crypto.randomBytes(32)
      const dataString = `${reconciliationId}-${record.id}-${Date.now()}-${record.email}`
      const hash = crypto.createHash('sha256').update(dataString + randomBytes.toString('hex')).digest('hex')
      referenceCode = hash.toUpperCase()

      // Calculate expiry date (30 days from now)
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 30)

      // Save reference code to database for security
      await query(`
        INSERT INTO reconciliation_links (
          reference_code, reconciliation_id, record_id, recipient_email,
          recipient_name, amount, balance_type, expires_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        referenceCode,
        reconciliationId,
        record.id,
        record.email,
        record.cari_hesap_adi,
        record.tutar,
        record.borc_alacak,
        expiresAt
      ])
      console.log(`🔗 Created new link for record ${record.id}: ${referenceCode}`)
    }

    // Generate link URL (this will be the page to view reconciliation)
    const linkUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reconciliation/view/${referenceCode}`

    // Replace template variables
    let emailContent = template.content
    let emailSubject = template.subject

    // Simple button - just use the link variable directly
    const simpleButton = `
      <div style="text-align: center; margin: 30px 0;">
        <a href="${linkUrl}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
          İşlemi Tamamla
        </a>
      </div>
    `

    // Replace {{linkUrl}} placeholder with simple button
    emailContent = emailContent.replace(/\{\{linkUrl\}\}/g, simpleButton)

    // Now replace other variables (but NOT linkUrl since we already handled it)
    const variables = {
      sirketAdi: record.cari_hesap_adi,
      gonderenSirket: recon.company_name,
      referansKodu: recon.period || referenceCode, // Use period name instead of reference code
      donem: recon.period || new Date().toLocaleDateString('tr-TR'), // Add donem variable
      tarih: new Date().toLocaleDateString('tr-TR'),
      tutar: record.tutar.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' }),
      bakiyeTipi: record.borc_alacak
      // linkUrl is NOT included here - we handle it separately above
    }

    // Replace all variables in content and subject
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      emailContent = emailContent.replace(regex, value)
      emailSubject = emailSubject.replace(regex, value)
    })

    // Wrap content in proper HTML structure for better email client compatibility
    const fullHtmlContent = `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${emailSubject}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, Helvetica, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f4f4;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 30px;">
              ${emailContent}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim()

    // Get Brevo settings from database
    const brevoSettingsResult = await query(`
      SELECT api_key, from_email, from_name
      FROM brevo_settings
      WHERE is_active = true
      ORDER BY id DESC
      LIMIT 1
    `)

    if (brevoSettingsResult.rows.length === 0) {
      console.error('❌ Brevo settings not configured in database')
      return false
    }

    const brevoSettings = brevoSettingsResult.rows[0]
    const brevoApiKey = brevoSettings.api_key

    if (!brevoApiKey) {
      console.error('❌ Brevo API key not found in settings')
      return false
    }

    console.log(`📧 Sending email to: ${record.email}`)
    console.log(`📄 Subject: ${emailSubject}`)

    // CRITICAL FIX: Brevo API doesn't support disabling link tracking per email
    // We need to use Brevo's transactional email API v3 with specific parameters
    // Or switch to a different email provider that doesn't force link tracking

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': brevoApiKey,
        // Try to disable tracking at header level
        'X-Sib-Disable-Link-Tracking': '1'
      },
      body: JSON.stringify({
        sender: {
          name: brevoSettings.from_name || recon.company_name,
          email: brevoSettings.from_email || recon.company_email || 'noreply@iletigo.com'
        },
        to: [
          {
            email: record.email,
            name: record.cari_hesap_adi
          }
        ],
        subject: emailSubject,
        htmlContent: fullHtmlContent,
        // Attempt to disable all tracking features
        params: {
          DISABLE_CLICK_TRACKING: '1',
          DISABLE_OPEN_TRACKING: '1'
        },
        // Tags for internal tracking only (optional)
        tags: ['mutabakat', `reconciliation-${reconciliationId}`]
      })
    })

    if (response.ok) {
      const result = await response.json()
      console.log(`✅ Email sent successfully to ${record.email}:`, result.messageId)
      return true
    } else {
      const error = await response.text()
      console.error(`❌ Brevo API error for ${record.email}:`, error)
      return false
    }

  } catch (error) {
    console.error(`❌ Error sending email to ${record.email}:`, error)
    return false
  }
}

// Real email implementation would look like this:
/*
async function sendRealEmail(record: MailRecord, reconciliationId: string): Promise<boolean> {
  const nodemailer = require('nodemailer');

  const transporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: record.email,
    subject: `Cari Hesap Mutabakat Bilgilendirmesi - ${record.cari_hesap_adi}`,
    html: generateEmailTemplate(record, reconciliationId)
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
}
*/