import { NextRequest, NextResponse } from 'next/server'

/**
 * Send direct email using Klaviyo Campaigns API
 * No Flow required - sends email immediately
 */
export async function POST(request: NextRequest) {
  try {
    const {
      apiKey,
      fromEmail,
      fromName,
      toEmail,
      subject,
      htmlContent,
      textContent
    } = await request.json()

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Klaviyo API anahtarı gereklidir' },
        { status: 400 }
      )
    }

    if (!toEmail || !subject) {
      return NextResponse.json(
        { error: 'Alıcı email ve konu gereklidir' },
        { status: 400 }
      )
    }

    console.log('📧 Sending Klaviyo campaign to:', toEmail)

    // Step 1: Get or create profile (with better error handling)
    let profileId: string | null = null

    // First try to find existing profile
    const searchResponse = await fetch(
      `https://a.klaviyo.com/api/profiles/?filter=equals(email,"${toEmail}")`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Klaviyo-API-Key ${apiKey}`,
          'revision': '2024-10-15'
        }
      }
    )

    if (searchResponse.ok) {
      const searchData = await searchResponse.json()
      if (searchData.data && searchData.data.length > 0) {
        profileId = searchData.data[0].id
        console.log('✅ Found existing profile:', profileId)
      }
    }

    // If not found, create new profile
    if (!profileId) {
      const profileResponse = await fetch('https://a.klaviyo.com/api/profiles/', {
        method: 'POST',
        headers: {
          'Authorization': `Klaviyo-API-Key ${apiKey}`,
          'revision': '2024-10-15',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          data: {
            type: 'profile',
            attributes: {
              email: toEmail
            }
          }
        })
      })

      if (!profileResponse.ok) {
        const errorText = await profileResponse.text()
        console.error('Profile creation error:', errorText)
        return NextResponse.json(
          {
            error: 'Klaviyo profil oluşturulamadı',
            details: errorText,
            hint: 'API Key\'in Profile:Write iznine sahip olduğundan emin olun'
          },
          { status: profileResponse.status }
        )
      }

      const profileData = await profileResponse.json()
      profileId = profileData.data.id
      console.log('✅ Profile created:', profileId)
    }

    // Step 2: Create campaign
    const campaignResponse = await fetch('https://a.klaviyo.com/api/campaigns/', {
      method: 'POST',
      headers: {
        'Authorization': `Klaviyo-API-Key ${apiKey}`,
        'revision': '2024-10-15',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data: {
          type: 'campaign',
          attributes: {
            name: `Campaign - ${subject} - ${new Date().toISOString()}`,
            audiences: {
              included: [profileId]
            },
            send_strategy: {
              method: 'immediate'
            },
            campaign_messages: {
              data: [
                {
                  type: 'campaign-message',
                  attributes: {
                    channel: 'email',
                    label: subject,
                    content: {
                      subject: subject,
                      preview_text: textContent?.substring(0, 100) || subject,
                      from_email: fromEmail,
                      from_label: fromName || 'İletigo',
                      reply_to_email: fromEmail
                    },
                    template_id: null,
                    render_options: {
                      add_org_prefix: false,
                      add_info_link: false,
                      add_opt_out_language: true
                    }
                  }
                }
              ]
            }
          }
        }
      })
    })

    if (!campaignResponse.ok) {
      const errorData = await campaignResponse.json()
      console.error('Campaign creation error:', errorData)
      return NextResponse.json(
        {
          error: 'Klaviyo kampanya oluşturulamadı',
          details: errorData
        },
        { status: campaignResponse.status }
      )
    }

    const campaignData = await campaignResponse.json()
    const campaignId = campaignData.data.id

    console.log('✅ Campaign created:', campaignId)

    // Step 3: Send campaign
    const sendResponse = await fetch(`https://a.klaviyo.com/api/campaigns/${campaignId}/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Klaviyo-API-Key ${apiKey}`,
        'revision': '2024-10-15',
        'Content-Type': 'application/json'
      }
    })

    if (!sendResponse.ok) {
      const errorData = await sendResponse.json()
      console.error('Campaign send error:', errorData)
      return NextResponse.json(
        {
          error: 'Klaviyo kampanya gönderilemedi',
          details: errorData
        },
        { status: sendResponse.status }
      )
    }

    console.log('✅ Campaign sent successfully!')

    return NextResponse.json({
      success: true,
      data: {
        profileId,
        campaignId,
        toEmail,
        subject,
        message: 'Email başarıyla gönderildi!'
      }
    })

  } catch (error) {
    console.error('❌ Klaviyo campaign error:', error)
    return NextResponse.json(
      {
        error: 'Klaviyo campaign gönderimi başarısız',
        details: error.message
      },
      { status: 500 }
    )
  }
}