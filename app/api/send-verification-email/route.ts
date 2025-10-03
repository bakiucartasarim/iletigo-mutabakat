import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { query } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { email, code, recipientName } = await request.json()

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email ve kod gereklidir' },
        { status: 400 }
      )
    }

    // Get SMTP settings from database
    const smtpResult = await query(`
      SELECT smtp_host, smtp_port, smtp_user, smtp_password, from_email, from_name
      FROM smtp_settings
      WHERE is_active = true
      ORDER BY id DESC
      LIMIT 1
    `)

    if (smtpResult.rows.length === 0) {
      console.error('❌ SMTP settings not configured in database')
      console.log('📧 Attempting to send verification email but SMTP not configured')
      console.log('📧 Email:', email, 'Code:', code)
      return NextResponse.json(
        { error: 'SMTP ayarları yapılandırılmamış' },
        { status: 500 }
      )
    }

    const smtpSettings = smtpResult.rows[0]

    console.log('📧 SMTP Settings loaded:', {
      host: smtpSettings.smtp_host,
      port: smtpSettings.smtp_port,
      user: smtpSettings.smtp_user,
      from: smtpSettings.from_email,
      is_active: smtpSettings.is_active
    })

    const smtpPort = parseInt(smtpSettings.smtp_port)

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: smtpSettings.smtp_host,
      port: smtpPort,
      secure: smtpPort === 465, // true for 465, false for other ports
      auth: {
        user: smtpSettings.smtp_user,
        pass: smtpSettings.smtp_password,
      },
    })

    // Email HTML template
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background-color: #f9f9f9;
            border-radius: 10px;
            padding: 30px;
            border: 1px solid #e0e0e0;
          }
          .header {
            text-align: center;
            color: #2563eb;
            margin-bottom: 30px;
          }
          .code-box {
            background-color: #2563eb;
            color: white;
            font-size: 32px;
            font-weight: bold;
            text-align: center;
            padding: 20px;
            border-radius: 8px;
            letter-spacing: 8px;
            margin: 30px 0;
          }
          .info {
            background-color: #fff;
            padding: 15px;
            border-radius: 5px;
            border-left: 4px solid #2563eb;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            color: #666;
            font-size: 12px;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Mutabakat Doğrulama Kodu</h1>
          </div>

          <p>Sayın ${recipientName || 'Değerli Kullanıcı'},</p>

          <p>Mutabakat mektubunuzu görüntülemek için aşağıdaki doğrulama kodunu kullanınız:</p>

          <div class="code-box">
            ${code}
          </div>

          <div class="info">
            <strong>⏰ Önemli:</strong> Bu kod <strong>5 dakika</strong> süreyle geçerlidir.
          </div>

          <p>Bu kodu kimseyle paylaşmayınız. Eğer bu talebi siz yapmadıysanız, bu e-postayı dikkate almayınız.</p>

          <div class="footer">
            <p>Bu e-posta otomatik olarak gönderilmiştir. Lütfen yanıtlamayınız.</p>
            <p>&copy; ${new Date().getFullYear()} Mutabakat Sistemi</p>
          </div>
        </div>
      </body>
      </html>
    `

    // Send email
    console.log('📧 Sending verification email to:', email)
    const mailOptions = {
      from: `"${smtpSettings.from_name || 'Mutabakat Sistemi'}" <${smtpSettings.from_email || smtpSettings.smtp_user}>`,
      to: email,
      subject: '🔐 Mutabakat Doğrulama Kodu',
      html: htmlContent,
    }
    console.log('📧 Mail options:', { from: mailOptions.from, to: mailOptions.to, subject: mailOptions.subject })

    const info = await transporter.sendMail(mailOptions)

    console.log('✅ Verification email sent successfully!')
    console.log('📧 Message ID:', info.messageId)
    console.log('📧 Response:', info.response)

    return NextResponse.json({
      success: true,
      message: 'Doğrulama kodu gönderildi'
    })

  } catch (error) {
    console.error('Email send error:', error)
    return NextResponse.json(
      { error: 'Email gönderilemedi' },
      { status: 500 }
    )
  }
}
