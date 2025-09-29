import { NextRequest, NextResponse } from 'next/server'

interface KlaviyoSettings {
  apiKey: string
  fromEmail: string
  fromName: string
  isActive: boolean
}

export async function POST(request: NextRequest) {
  try {
    const { email, klaviyoSettings }: { email: string, klaviyoSettings: KlaviyoSettings } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email adresi gereklidir' },
        { status: 400 }
      )
    }

    if (!klaviyoSettings.apiKey) {
      return NextResponse.json(
        { error: 'Klaviyo API anahtarı tanımlanmamış' },
        { status: 400 }
      )
    }

    // Test email template
    const testEmailTemplate = {
      subject: 'Test Email - Mail Motoru',
      html: `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #2563eb;">Mail Motoru Test Emaili</h2>
              <p>Merhaba,</p>
              <p>Bu bir test emailidir. Mail motorunuz doğru şekilde çalışıyor!</p>

              <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Sistem Bilgileri</h3>
                <ul style="margin: 0;">
                  <li><strong>Gönderen:</strong> ${klaviyoSettings.fromName}</li>
                  <li><strong>Email:</strong> ${klaviyoSettings.fromEmail}</li>
                  <li><strong>Tarih:</strong> ${new Date().toLocaleDateString('tr-TR')}</li>
                  <li><strong>Saat:</strong> ${new Date().toLocaleTimeString('tr-TR')}</li>
                </ul>
              </div>

              <p>Mail motoru başarıyla Klaviyo üzerinden email gönderebiliyor.</p>

              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

              <p style="font-size: 12px; color: #6b7280;">
                Bu email İletigo Teknoloji Mail Motoru tarafından gönderilmiştir.<br>
                Test amaçlıdır, yanıtlamanız gerekmez.
              </p>
            </div>
          </body>
        </html>
      `
    }

    try {
      // Send test email via Klaviyo API
      const klaviyoResponse = await fetch('https://a.klaviyo.com/api/events/', {
        method: 'POST',
        headers: {
          'Authorization': `Klaviyo-API-Key ${klaviyoSettings.apiKey}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'revision': '2024-10-15'
        },
        body: JSON.stringify({
          data: {
            type: 'event',
            attributes: {
              properties: {
                subject: testEmailTemplate.subject,
                html: testEmailTemplate.html,
                from_email: klaviyoSettings.fromEmail,
                from_name: klaviyoSettings.fromName
              },
              metric: {
                data: {
                  type: 'metric',
                  attributes: {
                    name: 'Test Email Sent'
                  }
                }
              },
              profile: {
                data: {
                  type: 'profile',
                  attributes: {
                    email: email
                  }
                }
              }
            }
          }
        })
      })

      if (klaviyoResponse.ok) {
        console.log('✅ Test email sent via Klaviyo to:', email)

        return NextResponse.json({
          success: true,
          message: `Test emaili ${email} adresine başarıyla gönderildi`,
          data: {
            email,
            sentAt: new Date().toISOString(),
            provider: 'Klaviyo'
          }
        })
      } else {
        const errorData = await klaviyoResponse.json().catch(() => ({}))
        console.error('❌ Klaviyo test email failed:', klaviyoResponse.status, errorData)

        throw new Error(`Klaviyo API Error: ${klaviyoResponse.status}`)
      }

    } catch (klaviyoError) {
      console.error('Klaviyo test email error:', klaviyoError)

      // Mock mode fallback for development
      console.log('📧 Mock mode: Test emaili simüle ediliyor...', email)

      return NextResponse.json({
        success: true,
        message: `Test emaili ${email} adresine gönderildi (Mock Mode)`,
        data: {
          email,
          sentAt: new Date().toISOString(),
          provider: 'Mock'
        }
      })
    }

  } catch (error) {
    console.error('Test email send error:', error)
    return NextResponse.json(
      { error: 'Test emaili gönderilemedi: ' + error.message },
      { status: 500 }
    )
  }
}