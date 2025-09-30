import { NextRequest, NextResponse } from 'next/server'

/**
 * Send bulk emails using Brevo Transactional Email API
 * Sends individual emails to multiple recipients
 */
export async function POST(request: NextRequest) {
  try {
    const {
      apiKey,
      fromEmail,
      fromName,
      subject,
      htmlContent,
      textContent,
      recipients, // Array of { email, name? }
      batchDelay = 100 // Delay between batches in ms
    } = await request.json()

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Brevo API anahtarı gereklidir' },
        { status: 400 }
      )
    }

    if (!recipients || recipients.length === 0) {
      return NextResponse.json(
        { error: 'En az bir alıcı gereklidir' },
        { status: 400 }
      )
    }

    console.log(`📧 Sending bulk email to ${recipients.length} recipients`)

    const results = {
      total: recipients.length,
      successful: [],
      failed: []
    }

    // Send emails one by one with delay
    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i]

      try {
        const payload = {
          sender: {
            name: fromName || 'İletigo',
            email: fromEmail || 'noreply@iletigo.com'
          },
          to: [
            {
              email: recipient.email,
              name: recipient.name || recipient.email
            }
          ],
          subject: subject || 'Bulk Email',
          htmlContent: htmlContent || `
            <html>
              <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h2 style="color: #4CAF50;">Bulk Email - İletigo</h2>
                  <p>Bu İletigo Mail Engine'den Brevo API ile gönderilen bir emaildir.</p>
                  <p><strong>Gönderim Zamanı:</strong> ${new Date().toLocaleString('tr-TR')}</p>
                  <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                  <p style="color: #999; font-size: 12px;">Bu email otomatik olarak oluşturulmuştur.</p>
                </div>
              </body>
            </html>
          `,
          textContent: textContent
        }

        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'api-key': apiKey
          },
          body: JSON.stringify(payload)
        })

        const data = await response.json()

        if (response.ok) {
          results.successful.push({
            email: recipient.email,
            messageId: data.messageId
          })
          console.log(`✅ Sent to ${recipient.email} (${i + 1}/${recipients.length})`)
        } else {
          results.failed.push({
            email: recipient.email,
            error: data
          })
          console.error(`❌ Failed to send to ${recipient.email}:`, data)
        }

      } catch (error) {
        results.failed.push({
          email: recipient.email,
          error: error.message
        })
        console.error(`❌ Error sending to ${recipient.email}:`, error)
      }

      // Delay between sends
      if (i < recipients.length - 1 && batchDelay > 0) {
        await new Promise(resolve => setTimeout(resolve, batchDelay))
      }
    }

    const successRate = ((results.successful.length / results.total) * 100).toFixed(1)

    return NextResponse.json({
      success: results.failed.length === 0,
      data: {
        total: results.total,
        successful: results.successful.length,
        failed: results.failed.length,
        successRate: `${successRate}%`,
        results: results,
        message: `${results.successful.length}/${results.total} email başarıyla gönderildi`
      }
    })

  } catch (error) {
    console.error('❌ Brevo bulk send error:', error)
    return NextResponse.json(
      {
        error: 'Toplu email gönderimi başarısız',
        details: error.message
      },
      { status: 500 }
    )
  }
}