import { NextRequest, NextResponse } from 'next/server'

/**
 * Send email using Brevo (Sendinblue) API
 * Simple and reliable transactional email service
 */
export async function POST(request: NextRequest) {
  try {
    const {
      apiKey,
      fromEmail,
      fromName,
      toEmail,
      toName,
      subject,
      htmlContent,
      textContent
    } = await request.json()

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Brevo API anahtarı gereklidir' },
        { status: 400 }
      )
    }

    if (!toEmail || !subject) {
      return NextResponse.json(
        { error: 'Alıcı email ve konu gereklidir' },
        { status: 400 }
      )
    }

    console.log('📧 Sending Brevo email to:', toEmail)

    const payload = {
      sender: {
        name: fromName || 'İletigo',
        email: fromEmail || 'noreply@iletigo.com'
      },
      to: [
        {
          email: toEmail,
          name: toName || toEmail
        }
      ],
      subject: subject,
      htmlContent: htmlContent || `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #4CAF50;">Test Email - İletigo Mail Engine</h2>
              <p>Bu İletigo Mail Engine'den Brevo API ile gönderilen bir test emailidir.</p>
              <p><strong>Gönderim Zamanı:</strong> ${new Date().toLocaleString('tr-TR')}</p>
              <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
              <p style="color: #999; font-size: 12px;">Bu email otomatik olarak oluşturulmuştur.</p>
            </div>
          </body>
        </html>
      `,
      textContent: textContent || `Test Email\n\nBu İletigo Mail Engine'den Brevo API ile gönderilen bir test emailidir.\n\nGönderim Zamanı: ${new Date().toLocaleString('tr-TR')}`
    }

    console.log('📤 Brevo payload:', JSON.stringify(payload, null, 2))

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': apiKey
      },
      body: JSON.stringify(payload)
    })

    const responseText = await response.text()
    let responseData

    try {
      responseData = JSON.parse(responseText)
    } catch (e) {
      responseData = { rawResponse: responseText }
    }

    console.log('📥 Brevo response status:', response.status)
    console.log('📥 Brevo response:', responseData)

    if (!response.ok) {
      return NextResponse.json(
        {
          error: 'Brevo email gönderilemedi',
          details: responseData,
          status: response.status
        },
        { status: response.status }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        messageId: responseData.messageId,
        toEmail,
        subject,
        message: 'Email başarıyla gönderildi!'
      }
    })

  } catch (error) {
    console.error('❌ Brevo send error:', error)
    return NextResponse.json(
      {
        error: 'Email gönderimi başarısız',
        details: error.message
      },
      { status: 500 }
    )
  }
}