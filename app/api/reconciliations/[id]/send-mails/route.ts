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

    // Generate unique reference code
    const referenceCode = `MUT-${reconciliationId}-${record.id}-${Date.now()}`

    // Generate link URL (this will be the page to view reconciliation)
    const linkUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reconciliation/view/${referenceCode}`

    // Replace template variables
    let emailContent = template.content
    let emailSubject = template.subject

    const variables = {
      sirketAdi: record.cari_hesap_adi,
      gonderenSirket: recon.company_name,
      referansKodu: referenceCode,
      tarih: new Date().toLocaleDateString('tr-TR'),
      tutar: record.tutar.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' }),
      bakiyeTipi: record.borc_alacak,
      linkUrl: linkUrl
    }

    // Replace all variables in content and subject
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      emailContent = emailContent.replace(regex, value)
      emailSubject = emailSubject.replace(regex, value)
    })

    // Send email via Brevo API
    const brevoApiKey = process.env.BREVO_API_KEY

    if (!brevoApiKey) {
      console.error('❌ BREVO_API_KEY not configured')
      return false
    }

    console.log(`📧 Sending email to: ${record.email}`)
    console.log(`📄 Subject: ${emailSubject}`)

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': brevoApiKey
      },
      body: JSON.stringify({
        sender: {
          name: recon.company_name,
          email: recon.company_email || process.env.EMAIL_FROM || 'noreply@iletigo.com'
        },
        to: [
          {
            email: record.email,
            name: record.cari_hesap_adi
          }
        ],
        subject: emailSubject,
        htmlContent: emailContent
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