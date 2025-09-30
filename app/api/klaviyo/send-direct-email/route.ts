import { NextRequest, NextResponse } from 'next/server'

/**
 * Send direct email using Klaviyo Campaign API
 * This creates and sends a campaign immediately without requiring flows
 */
export async function POST(request: NextRequest) {
  try {
    const { apiKey, email, subject, htmlContent, fromEmail, fromName } = await request.json()

    if (!apiKey) {
      return NextResponse.json({ error: 'API anahtarı gereklidir' }, { status: 400 })
    }

    if (!email) {
      return NextResponse.json({ error: 'Alıcı email adresi gereklidir' }, { status: 400 })
    }

    console.log('📧 Sending direct email to:', email)

    // Step 1: Get or create profile
    const profileResponse = await fetch(
      `https://a.klaviyo.com/api/profiles/?filter=equals(email,"${email}")`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Klaviyo-API-Key ${apiKey}`,
          'Accept': 'application/json',
          'REVISION': '2024-10-15'
        }
      }
    )

    let profileId = null

    if (profileResponse.ok) {
      const profileData = await profileResponse.json()
      if (profileData.data && profileData.data.length > 0) {
        profileId = profileData.data[0].id
        console.log('✅ Profile found:', profileId)
      }
    }

    // Create profile if doesn't exist
    if (!profileId) {
      const createProfileResponse = await fetch('https://a.klaviyo.com/api/profiles/', {
        method: 'POST',
        headers: {
          'Authorization': `Klaviyo-API-Key ${apiKey}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'REVISION': '2024-10-15'
        },
        body: JSON.stringify({
          data: {
            type: 'profile',
            attributes: {
              email,
              properties: {
                'created_by': 'İletigo Mail Engine'
              }
            }
          }
        })
      })

      if (createProfileResponse.ok) {
        const newProfile = await createProfileResponse.json()
        profileId = newProfile.data.id
        console.log('✅ Profile created:', profileId)
      } else {
        const errorText = await createProfileResponse.text()
        console.error('❌ Profile creation failed:', errorText)
        return NextResponse.json(
          { error: 'Profile oluşturulamadı' },
          { status: 500 }
        )
      }
    }

    // Step 2: Create campaign
    const campaignName = `Test Email - ${new Date().toISOString()}`
    const campaignSubject = subject || 'Test Email from İletigo Mail Engine'
    const campaignHtml = htmlContent || `
      <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Test Email</h2>
          <p>Bu İletigo Mail Engine'den gönderilen bir test emailidir.</p>
          <p><strong>Gönderim Zamanı:</strong> ${new Date().toLocaleString('tr-TR')}</p>
          <hr>
          <p style="color: #666; font-size: 12px;">Bu email otomatik olarak oluşturulmuştur.</p>
        </body>
      </html>
    `

    const createCampaignResponse = await fetch('https://a.klaviyo.com/api/campaigns/', {
      method: 'POST',
      headers: {
        'Authorization': `Klaviyo-API-Key ${apiKey}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'REVISION': '2024-10-15'
      },
      body: JSON.stringify({
        data: {
          type: 'campaign',
          attributes: {
            name: campaignName,
            audiences: {
              included: [profileId]
            },
            send_strategy: {
              method: 'immediate'
            },
            tracking_options: {
              is_tracking_clicks: true,
              is_tracking_opens: true
            }
          }
        }
      })
    })

    if (!createCampaignResponse.ok) {
      const errorText = await createCampaignResponse.text()
      console.error('❌ Campaign creation failed:', createCampaignResponse.status, errorText)

      // Try alternative method: Create a list and send to list
      return NextResponse.json(
        {
          error: 'Campaign oluşturulamadı. Klaviyo hesabınızda campaign oluşturma yetkisi olduğundan emin olun.',
          details: errorText,
          alternative: 'Alternatif olarak Klaviyo dashboard\'unda manuel bir Flow oluşturmanız gerekebilir.'
        },
        { status: createCampaignResponse.status }
      )
    }

    const campaignData = await createCampaignResponse.json()
    const campaignId = campaignData.data.id
    console.log('✅ Campaign created:', campaignId)

    // Step 3: Create message (email template) for campaign
    const createMessageResponse = await fetch(`https://a.klaviyo.com/api/campaign-messages/`, {
      method: 'POST',
      headers: {
        'Authorization': `Klaviyo-API-Key ${apiKey}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'REVISION': '2024-10-15'
      },
      body: JSON.stringify({
        data: {
          type: 'campaign-message',
          attributes: {
            label: 'Email Message',
            channel: 'email',
            content: {
              subject: campaignSubject,
              preview_text: 'İletigo Mail Engine Test',
              from_email: fromEmail || 'noreply@example.com',
              from_label: fromName || 'İletigo',
              reply_to_email: fromEmail || 'noreply@example.com'
            }
          },
          relationships: {
            campaign: {
              data: {
                type: 'campaign',
                id: campaignId
              }
            },
            template: {
              data: {
                type: 'template',
                id: null // Will use custom HTML
              }
            }
          }
        }
      })
    })

    if (!createMessageResponse.ok) {
      const errorText = await createMessageResponse.text()
      console.error('❌ Message creation failed:', createMessageResponse.status, errorText)
      return NextResponse.json(
        { error: 'Email mesajı oluşturulamadı', details: errorText },
        { status: createMessageResponse.status }
      )
    }

    const messageData = await createMessageResponse.json()
    console.log('✅ Message created:', messageData.data.id)

    // Step 4: Send campaign
    const sendCampaignResponse = await fetch(`https://a.klaviyo.com/api/campaigns/${campaignId}/send/`, {
      method: 'POST',
      headers: {
        'Authorization': `Klaviyo-API-Key ${apiKey}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'REVISION': '2024-10-15'
      }
    })

    if (!sendCampaignResponse.ok) {
      const errorText = await sendCampaignResponse.text()
      console.error('❌ Campaign send failed:', sendCampaignResponse.status, errorText)
      return NextResponse.json(
        { error: 'Campaign gönderilemedi', details: errorText },
        { status: sendCampaignResponse.status }
      )
    }

    console.log('✅ Campaign sent successfully!')

    return NextResponse.json({
      success: true,
      data: {
        campaignId,
        profileId,
        email,
        subject: campaignSubject,
        message: 'Email başarıyla gönderildi!'
      }
    })

  } catch (error) {
    console.error('❌ Send email error:', error)
    return NextResponse.json(
      { error: 'Email gönderimi başarısız: ' + error.message },
      { status: 500 }
    )
  }
}