import { NextRequest, NextResponse } from 'next/server'

/**
 * BillionMail API Integration
 * Send emails using BillionMail service
 * API Documentation: https://www.billionmail.com/apidocs
 */
export async function POST(request: NextRequest) {
  try {
    const {
      apiKey,
      apiSecret,
      fromEmail,
      fromName,
      toEmail,
      subject,
      htmlContent,
      textContent,
      replyTo
    } = await request.json()

    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { error: 'BillionMail API key ve secret gereklidir' },
        { status: 400 }
      )
    }

    if (!toEmail) {
      return NextResponse.json(
        { error: 'Alıcı email adresi gereklidir' },
        { status: 400 }
      )
    }

    console.log('📧 Sending email via BillionMail to:', toEmail)

    // BillionMail API endpoint
    const billionmailUrl = 'https://api.billionmail.com/v1/send'

    const payload = {
      api_key: apiKey,
      api_secret: apiSecret,
      from: {
        email: fromEmail || 'noreply@example.com',
        name: fromName || 'İletigo'
      },
      to: [
        {
          email: toEmail
        }
      ],
      subject: subject || 'İletigo Mail Engine',
      html: htmlContent || getDefaultHtmlContent(subject),
      text: textContent || getDefaultTextContent(subject),
      reply_to: replyTo || fromEmail,
      track_opens: true,
      track_clicks: true
    }

    console.log('🔧 BillionMail API Request:', {
      url: billionmailUrl,
      to: toEmail,
      subject: subject
    })

    const response = await fetch(billionmailUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    const responseData = await response.json()

    if (!response.ok) {
      console.error('❌ BillionMail API error:', response.status, responseData)
      return NextResponse.json(
        {
          error: 'BillionMail email gönderimi başarısız',
          details: responseData.message || responseData.error || 'Unknown error',
          statusCode: response.status
        },
        { status: response.status }
      )
    }

    console.log('✅ Email sent successfully via BillionMail')
    console.log('📬 Response:', responseData)

    return NextResponse.json({
      success: true,
      data: {
        messageId: responseData.message_id,
        status: responseData.status,
        toEmail,
        subject,
        provider: 'BillionMail',
        timestamp: new Date().toISOString()
      },
      message: 'Email başarıyla gönderildi (BillionMail)'
    })

  } catch (error) {
    console.error('❌ BillionMail send error:', error)
    return NextResponse.json(
      {
        error: 'BillionMail email gönderimi başarısız',
        details: error.message
      },
      { status: 500 }
    )
  }
}

function getDefaultHtmlContent(subject: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject || 'İletigo Mail'}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">İletigo Mail Engine</h1>
    <p style="color: #f0f0f0; margin: 10px 0 0 0;">via BillionMail</p>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <h2 style="color: #667eea; margin-top: 0;">✅ Test Başarılı!</h2>

    <p>BillionMail entegrasyonu başarıyla çalışıyor.</p>

    <div style="background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0;">
      <p style="margin: 0;"><strong>Gönderim Zamanı:</strong></p>
      <p style="margin: 5px 0 0 0; color: #666;">${new Date().toLocaleString('tr-TR')}</p>
    </div>

    <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e0e0e0;">
      <p style="margin: 0; color: #666; font-size: 14px; text-align: center;">
        Bu email İletigo Mail Engine tarafından BillionMail üzerinden gönderilmiştir.
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

function getDefaultTextContent(subject: string): string {
  return `
${subject || 'İletigo Mail Engine'}

Test Başarılı!

BillionMail entegrasyonu başarıyla çalışıyor.

Gönderim Zamanı: ${new Date().toLocaleString('tr-TR')}

---
Bu email İletigo Mail Engine tarafından BillionMail üzerinden gönderilmiştir.
© ${new Date().getFullYear()} İletigo
  `
}