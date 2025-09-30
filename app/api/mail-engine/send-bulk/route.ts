import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

/**
 * Send bulk emails using SMTP
 * Supports sending to multiple recipients with customizable content
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
      recipients, // Array of { email, firstName?, lastName?, customData? }
      subject,
      htmlTemplate, // HTML template with {{variables}}
      textTemplate,
      batchSize = 50, // Send in batches to avoid rate limits
      delayBetweenBatches = 1000 // Delay in ms between batches
    } = await request.json()

    if (!smtpHost || !smtpPort || !smtpUser || !smtpPassword) {
      return NextResponse.json(
        { error: 'SMTP bilgileri eksik' },
        { status: 400 }
      )
    }

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        { error: 'En az bir alıcı gereklidir' },
        { status: 400 }
      )
    }

    console.log(`📧 Starting bulk email send to ${recipients.length} recipients`)

    // Create transporter
    const transporter = nodemailer.createTransporter({
      host: smtpHost,
      port: Number(smtpPort),
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPassword
      },
      pool: true, // Use connection pooling for better performance
      maxConnections: 5,
      maxMessages: 100
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

    const results = {
      total: recipients.length,
      sent: 0,
      failed: 0,
      errors: [] as any[],
      startTime: new Date().toISOString()
    }

    // Process in batches
    const batches = []
    for (let i = 0; i < recipients.length; i += batchSize) {
      batches.push(recipients.slice(i, i + batchSize))
    }

    console.log(`📦 Processing ${batches.length} batches of up to ${batchSize} emails`)

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex]
      console.log(`📬 Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} emails)`)

      // Send emails in parallel within batch
      const batchPromises = batch.map(async (recipient) => {
        try {
          // Replace variables in templates
          const personalizedHtml = replaceVariables(
            htmlTemplate || getDefaultHtmlTemplate(subject),
            recipient
          )
          const personalizedText = replaceVariables(
            textTemplate || getDefaultTextTemplate(subject),
            recipient
          )
          const personalizedSubject = replaceVariables(subject || 'İletigo Mail Engine', recipient)

          const mailOptions = {
            from: `"${fromName || 'İletigo'}" <${fromEmail || smtpUser}>`,
            to: recipient.email,
            subject: personalizedSubject,
            text: personalizedText,
            html: personalizedHtml
          }

          const info = await transporter.sendMail(mailOptions)
          results.sent++

          return {
            success: true,
            email: recipient.email,
            messageId: info.messageId
          }
        } catch (error) {
          results.failed++
          results.errors.push({
            email: recipient.email,
            error: error.message
          })

          return {
            success: false,
            email: recipient.email,
            error: error.message
          }
        }
      })

      await Promise.all(batchPromises)

      // Delay between batches to avoid rate limiting
      if (batchIndex < batches.length - 1 && delayBetweenBatches > 0) {
        console.log(`⏳ Waiting ${delayBetweenBatches}ms before next batch...`)
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches))
      }
    }

    results.endTime = new Date().toISOString()

    // Close transporter
    transporter.close()

    console.log(`✅ Bulk email send completed!`)
    console.log(`📊 Results: ${results.sent} sent, ${results.failed} failed`)

    return NextResponse.json({
      success: results.failed === 0,
      data: results,
      message: `${results.sent}/${results.total} email başarıyla gönderildi`
    })

  } catch (error) {
    console.error('❌ Bulk email error:', error)
    return NextResponse.json(
      {
        error: 'Toplu email gönderimi başarısız',
        details: error.message
      },
      { status: 500 }
    )
  }
}

/**
 * Replace variables in template
 * Supported variables: {{email}}, {{firstName}}, {{lastName}}, {{companyName}}, {{customData.*}}
 */
function replaceVariables(template: string, recipient: any): string {
  if (!template) return ''

  let result = template

  // Basic variables
  result = result.replace(/\{\{email\}\}/g, recipient.email || '')
  result = result.replace(/\{\{firstName\}\}/g, recipient.firstName || recipient.first_name || '')
  result = result.replace(/\{\{lastName\}\}/g, recipient.lastName || recipient.last_name || '')
  result = result.replace(/\{\{companyName\}\}/g, recipient.companyName || recipient.company_name || '')
  result = result.replace(/\{\{companyId\}\}/g, recipient.companyId || recipient.company_id || '')

  // Custom data variables
  if (recipient.customData) {
    Object.keys(recipient.customData).forEach(key => {
      const regex = new RegExp(`\\{\\{customData\\.${key}\\}\\}`, 'g')
      result = result.replace(regex, recipient.customData[key] || '')
    })
  }

  // Date variable
  result = result.replace(/\{\{currentDate\}\}/g, new Date().toLocaleDateString('tr-TR'))
  result = result.replace(/\{\{currentDateTime\}\}/g, new Date().toLocaleString('tr-TR'))

  return result
}

function getDefaultHtmlTemplate(subject: string): string {
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
    <h1 style="color: white; margin: 0; font-size: 28px;">İletigo</h1>
    <p style="color: #f0f0f0; margin: 10px 0 0 0;">${subject || 'Mail Bildirimi'}</p>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <p>Merhaba {{firstName}},</p>

    <div style="background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0;">
      <p style="margin: 0;">Bu size İletigo Mail Engine tarafından gönderilen bir bildirimdir.</p>
    </div>

    <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e0e0e0;">
      <p style="margin: 0; color: #666; font-size: 14px; text-align: center;">
        {{currentDateTime}}
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

function getDefaultTextTemplate(subject: string): string {
  return `
${subject || 'İletigo Mail'}

Merhaba {{firstName}},

Bu size İletigo Mail Engine tarafından gönderilen bir bildirimdir.

---
{{currentDateTime}}
© 2025 İletigo
  `
}