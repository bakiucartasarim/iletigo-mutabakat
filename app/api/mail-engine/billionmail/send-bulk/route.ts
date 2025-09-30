import { NextRequest, NextResponse } from 'next/server'

/**
 * BillionMail Bulk Email Integration
 * Send bulk emails using BillionMail self-hosted platform
 *
 * BillionMail is a self-hosted email marketing solution
 * GitHub: https://github.com/aaPanel/BillionMail
 *
 * Usage: Install BillionMail on your server and use its SMTP or API
 */
export async function POST(request: NextRequest) {
  try {
    const {
      billionmailHost, // Your BillionMail server URL
      apiKey,
      apiSecret,
      fromEmail,
      fromName,
      recipients, // Array of { email, firstName?, lastName?, customData? }
      subject,
      htmlTemplate,
      textTemplate,
      batchSize = 100,
      delayBetweenBatches = 500
    } = await request.json()

    if (!billionmailHost) {
      return NextResponse.json(
        { error: 'BillionMail sunucu adresi gereklidir (örn: https://mail.yourdomain.com)' },
        { status: 400 }
      )
    }

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        { error: 'En az bir alıcı gereklidir' },
        { status: 400 }
      )
    }

    console.log(`📧 Starting BillionMail bulk send to ${recipients.length} recipients`)

    const results = {
      total: recipients.length,
      sent: 0,
      failed: 0,
      errors: [] as any[],
      startTime: new Date().toISOString(),
      provider: 'BillionMail'
    }

    // Process in batches
    const batches = []
    for (let i = 0; i < recipients.length; i += batchSize) {
      batches.push(recipients.slice(i, i + batchSize))
    }

    console.log(`📦 Processing ${batches.length} batches`)

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex]
      console.log(`📬 Batch ${batchIndex + 1}/${batches.length} (${batch.length} emails)`)

      // BillionMail API endpoint for bulk send
      const billionmailApiUrl = `${billionmailHost}/api/v1/campaigns/send`

      // Prepare recipients with personalization
      const personalizedRecipients = batch.map(recipient => ({
        email: recipient.email,
        variables: {
          firstName: recipient.firstName || recipient.first_name || '',
          lastName: recipient.lastName || recipient.last_name || '',
          companyName: recipient.companyName || recipient.company_name || '',
          companyId: recipient.companyId || recipient.company_id || '',
          ...recipient.customData
        }
      }))

      const payload = {
        api_key: apiKey,
        api_secret: apiSecret,
        from: {
          email: fromEmail || 'noreply@example.com',
          name: fromName || 'İletigo'
        },
        recipients: personalizedRecipients,
        subject: subject || 'İletigo Mail',
        html: htmlTemplate || getDefaultBulkHtmlTemplate(subject),
        text: textTemplate || getDefaultBulkTextTemplate(subject),
        track_opens: true,
        track_clicks: true,
        batch: true
      }

      try {
        const response = await fetch(billionmailApiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload)
        })

        const responseData = await response.json()

        if (response.ok) {
          results.sent += batch.length
          console.log(`✅ Batch ${batchIndex + 1} sent successfully`)
        } else {
          results.failed += batch.length
          results.errors.push({
            batch: batchIndex + 1,
            error: responseData.message || 'Unknown error',
            emails: batch.map(r => r.email)
          })
          console.error(`❌ Batch ${batchIndex + 1} failed:`, responseData)
        }
      } catch (error) {
        results.failed += batch.length
        results.errors.push({
          batch: batchIndex + 1,
          error: error.message,
          emails: batch.map(r => r.email)
        })
        console.error(`❌ Batch ${batchIndex + 1} error:`, error)
      }

      // Delay between batches
      if (batchIndex < batches.length - 1 && delayBetweenBatches > 0) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches))
      }
    }

    results.endTime = new Date().toISOString()

    console.log(`✅ BillionMail bulk send completed!`)
    console.log(`📊 Results: ${results.sent} sent, ${results.failed} failed`)

    return NextResponse.json({
      success: results.failed === 0,
      data: results,
      message: `${results.sent}/${results.total} email başarıyla gönderildi (BillionMail)`
    })

  } catch (error) {
    console.error('❌ BillionMail bulk send error:', error)
    return NextResponse.json(
      {
        error: 'BillionMail toplu email gönderimi başarısız',
        details: error.message
      },
      { status: 500 }
    )
  }
}

function getDefaultBulkHtmlTemplate(subject: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">İletigo</h1>
    <p style="color: #f0f0f0; margin: 10px 0 0 0;">${subject || 'Toplu Mail Bildirimi'}</p>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <p>Merhaba {{firstName}},</p>

    <div style="background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0;">
      <p style="margin: 0;">Bu size İletigo Mail Engine tarafından BillionMail üzerinden gönderilen bir bildirimdir.</p>
    </div>

    <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e0e0e0;">
      <p style="margin: 0; color: #666; font-size: 14px; text-align: center;">
        Powered by BillionMail
      </p>
      <p style="margin: 10px 0 0 0; color: #999; font-size: 12px; text-align: center;">
        © 2025 İletigo - Tüm hakları saklıdır.
      </p>
    </div>
  </div>
</body>
</html>
  `
}

function getDefaultBulkTextTemplate(subject: string): string {
  return `
${subject || 'İletigo Mail'}

Merhaba {{firstName}},

Bu size İletigo Mail Engine tarafından BillionMail üzerinden gönderilen bir bildirimdir.

---
Powered by BillionMail
© 2025 İletigo
  `
}