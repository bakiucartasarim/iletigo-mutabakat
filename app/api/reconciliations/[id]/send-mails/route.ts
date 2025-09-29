import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'

interface MailRecord {
  id: number
  email: string
  cari_hesap_adi: string
  tutar: number
  borc_alacak: string
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

// Mock email sending function
async function sendEmail(record: MailRecord, reconciliationId: string): Promise<boolean> {
  // Simulate email sending with random success/failure
  // In real implementation, you would use nodemailer, sendgrid, etc.

  console.log(`📧 Mail gönderiliyor: ${record.email}`)
  console.log(`📄 Konu: Cari Hesap Mutabakat Bilgilendirmesi - ${record.cari_hesap_adi}`)
  console.log(`💰 Tutar: ${record.tutar} TL (${record.borc_alacak})`)

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 100))

  // Simulate 90% success rate
  const success = Math.random() > 0.1

  if (success) {
    console.log(`✅ Mail başarıyla gönderildi: ${record.email}`)
  } else {
    console.log(`❌ Mail gönderiminde hata: ${record.email}`)
  }

  return success
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