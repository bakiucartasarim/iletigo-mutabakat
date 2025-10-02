import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(request: NextRequest) {
  try {
    const { email, code, recipientName } = await request.json()

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email ve kod gereklidir' },
        { status: 400 }
      )
    }

    // Create transporter
    const smtpPort = parseInt(process.env.SMTP_PORT || '587')
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: smtpPort,
      secure: smtpPort === 465, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
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
    await transporter.sendMail({
      from: `"Mutabakat Sistemi" <${process.env.SMTP_USER}>`,
      to: email,
      subject: '🔐 Mutabakat Doğrulama Kodu',
      html: htmlContent,
    })

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
