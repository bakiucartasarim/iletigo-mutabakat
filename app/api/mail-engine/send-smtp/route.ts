import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

/**
 * Send email using SMTP (Gmail, Outlook, or custom SMTP server)
 * This bypasses Klaviyo and sends email directly
 */
export async function POST(request: NextRequest) {
  try {
    const {
      smtpHost,
      smtpPort,
      smtpUser,
      smtpPassword,
      fromEmail,
      fromName,
      toEmail,
      subject,
      htmlContent,
      textContent
    } = await request.json()

    if (!smtpHost || !smtpPort || !smtpUser || !smtpPassword) {
      return NextResponse.json(
        { error: 'SMTP bilgileri eksik (host, port, user, password gerekli)' },
        { status: 400 }
      )
    }

    if (!toEmail) {
      return NextResponse.json(
        { error: 'Alıcı email adresi gereklidir' },
        { status: 400 }
      )
    }

    console.log('📧 Sending SMTP email to:', toEmail)
    console.log('🔧 SMTP Config:', { host: smtpHost, port: smtpPort, user: smtpUser })

    // Create transporter
    const transporter = nodemailer.createTransporter({
      host: smtpHost,
      port: Number(smtpPort),
      secure: smtpPort === 465, // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPassword
      }
    })

    // Verify connection
    try {
      await transporter.verify()
      console.log('✅ SMTP connection verified')
    } catch (verifyError) {
      console.error('❌ SMTP verification failed:', verifyError)
      return NextResponse.json(
        {
          error: 'SMTP bağlantısı kurulamadı',
          details: verifyError.message
        },
        { status: 500 }
      )
    }

    // Send email
    const mailOptions = {
      from: `"${fromName || 'İletigo'}" <${fromEmail || smtpUser}>`,
      to: toEmail,
      subject: subject || 'Test Email from İletigo Mail Engine',
      text: textContent || `
Test Email

Bu İletigo Mail Engine'den gönderilen bir test emailidir.

Gönderim Zamanı: ${new Date().toLocaleString('tr-TR')}

Bu email otomatik olarak oluşturulmuştur.
      `,
      html: htmlContent || `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Test Email</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">İletigo Mail Engine</h1>
    <p style="color: #f0f0f0; margin: 10px 0 0 0;">Test Email Sistemi</p>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <h2 style="color: #667eea; margin-top: 0;">✅ Test Başarılı!</h2>

    <p>Mail motorunuz başarıyla çalışıyor ve email gönderiyor.</p>

    <div style="background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0;">
      <p style="margin: 0;"><strong>Gönderim Zamanı:</strong></p>
      <p style="margin: 5px 0 0 0; color: #666;">${new Date().toLocaleString('tr-TR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })}</p>
    </div>

    <div style="background: white; padding: 20px; border-left: 4px solid #764ba2; margin: 20px 0;">
      <p style="margin: 0;"><strong>Gönderen:</strong></p>
      <p style="margin: 5px 0 0 0; color: #666;">${fromName || 'İletigo'} &lt;${fromEmail || smtpUser}&gt;</p>
    </div>

    <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e0e0e0;">
      <p style="margin: 0; color: #666; font-size: 14px; text-align: center;">
        Bu email İletigo Mail Engine tarafından otomatik olarak oluşturulmuştur.
      </p>
      <p style="margin: 10px 0 0 0; color: #999; font-size: 12px; text-align: center;">
        © ${new Date().getFullYear()} İletigo - Tüm hakları saklıdır.
      </p>
    </div>
  </div>
</body>
</html>
      `
    }

    const info = await transporter.sendMail(mailOptions)

    console.log('✅ Email sent successfully!')
    console.log('Message ID:', info.messageId)
    console.log('Response:', info.response)

    return NextResponse.json({
      success: true,
      data: {
        messageId: info.messageId,
        response: info.response,
        accepted: info.accepted,
        rejected: info.rejected,
        toEmail,
        subject: mailOptions.subject,
        message: 'Email başarıyla gönderildi!'
      }
    })

  } catch (error) {
    console.error('❌ SMTP send error:', error)
    return NextResponse.json(
      {
        error: 'Email gönderimi başarısız',
        details: error.message,
        hint: 'SMTP ayarlarınızı kontrol edin. Gmail kullanıyorsanız "App Password" oluşturmanız gerekebilir.'
      },
      { status: 500 }
    )
  }
}