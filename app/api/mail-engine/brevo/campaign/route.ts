import { NextRequest, NextResponse } from 'next/server'

/**
 * Create and send email campaign using Brevo Campaign API
 * For bulk email sending with scheduling
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
      recipients, // Array of email addresses or listIds
      scheduledAt, // Optional: ISO date string for scheduling
      campaignName
    } = await request.json()

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Brevo API anahtarı gereklidir' },
        { status: 400 }
      )
    }

    if (!recipients || (recipients.emails?.length === 0 && recipients.listIds?.length === 0)) {
      return NextResponse.json(
        { error: 'En az bir alıcı email veya liste ID gereklidir' },
        { status: 400 }
      )
    }

    console.log('📧 Creating Brevo campaign')

    // Build recipients object
    const recipientsPayload: any = {}

    if (recipients.listIds && recipients.listIds.length > 0) {
      recipientsPayload.listIds = recipients.listIds
    }

    if (recipients.emails && recipients.emails.length > 0) {
      // For individual emails, we need to create a temporary list or use contacts
      // Brevo campaigns work with lists, so we'll use transactional API for individual emails
      return NextResponse.json(
        {
          error: 'Campaign API requires list IDs. Use /api/mail-engine/brevo/send for individual emails or /api/mail-engine/brevo/bulk for bulk transactional emails.',
          hint: 'Create a contact list in Brevo and use listIds parameter'
        },
        { status: 400 }
      )
    }

    const payload = {
      name: campaignName || `Campaign - ${subject} - ${new Date().toISOString()}`,
      subject: subject || 'Email Campaign',
      sender: {
        name: fromName || 'İletigo',
        email: fromEmail || 'noreply@iletigo.com'
      },
      type: 'classic',
      htmlContent: htmlContent || `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #4CAF50;">Campaign Email - İletigo</h2>
              <p>Bu İletigo Mail Engine'den Brevo Campaign API ile gönderilen bir emaildir.</p>
              <p><strong>Gönderim Zamanı:</strong> ${new Date().toLocaleString('tr-TR')}</p>
              <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
              <p style="color: #999; font-size: 12px;">Bu email otomatik olarak oluşturulmuştur.</p>
            </div>
          </body>
        </html>
      `,
      recipients: recipientsPayload,
      ...(scheduledAt && { scheduledAt: scheduledAt })
    }

    console.log('📤 Brevo campaign payload:', JSON.stringify(payload, null, 2))

    // Create campaign
    const createResponse = await fetch('https://api.brevo.com/v3/emailCampaigns', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': apiKey
      },
      body: JSON.stringify(payload)
    })

    const createData = await createResponse.json()
    console.log('📥 Campaign create response:', createData)

    if (!createResponse.ok) {
      return NextResponse.json(
        {
          error: 'Brevo kampanya oluşturulamadı',
          details: createData,
          status: createResponse.status
        },
        { status: createResponse.status }
      )
    }

    const campaignId = createData.id

    // Send campaign immediately if not scheduled
    if (!scheduledAt) {
      const sendResponse = await fetch(`https://api.brevo.com/v3/emailCampaigns/${campaignId}/sendNow`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'api-key': apiKey
        }
      })

      if (!sendResponse.ok) {
        const sendError = await sendResponse.json()
        return NextResponse.json(
          {
            error: 'Kampanya oluşturuldu ama gönderilemedi',
            campaignId,
            details: sendError
          },
          { status: sendResponse.status }
        )
      }

      console.log('✅ Campaign sent immediately')
    } else {
      console.log('✅ Campaign scheduled for:', scheduledAt)
    }

    return NextResponse.json({
      success: true,
      data: {
        campaignId,
        scheduled: !!scheduledAt,
        scheduledAt: scheduledAt,
        message: scheduledAt
          ? `Kampanya ${scheduledAt} için zamanlandı`
          : 'Kampanya başarıyla gönderildi!'
      }
    })

  } catch (error) {
    console.error('❌ Brevo campaign error:', error)
    return NextResponse.json(
      {
        error: 'Kampanya gönderimi başarısız',
        details: error.message
      },
      { status: 500 }
    )
  }
}