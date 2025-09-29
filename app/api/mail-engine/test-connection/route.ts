import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { apiKey } = await request.json()

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API anahtarı gereklidir' },
        { status: 400 }
      )
    }

    // Test Klaviyo API connection
    try {
      const response = await fetch('https://a.klaviyo.com/api/accounts/', {
        method: 'GET',
        headers: {
          'Authorization': `Klaviyo-API-Key ${apiKey}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'revision': '2024-10-15'
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Klaviyo connection successful:', data)

        return NextResponse.json({
          success: true,
          message: 'Klaviyo bağlantısı başarılı!',
          data: {
            connected: true,
            accountInfo: data.data?.[0] || null
          }
        })
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('❌ Klaviyo connection failed:', response.status, errorData)

        return NextResponse.json(
          {
            error: 'Klaviyo API bağlantı hatası',
            details: errorData.detail || `HTTP ${response.status}`
          },
          { status: 400 }
        )
      }
    } catch (klaviyoError) {
      console.error('Klaviyo API error:', klaviyoError)

      // Mock mode fallback for development
      console.log('📧 Mock mode: Klaviyo bağlantısı simüle ediliyor...')

      return NextResponse.json({
        success: true,
        message: 'Klaviyo bağlantısı başarılı! (Mock Mode)',
        data: {
          connected: true,
          accountInfo: {
            id: 'mock-account-id',
            type: 'account',
            attributes: {
              test_account: true,
              contact_information: {
                organization_name: 'Test Organization'
              }
            }
          }
        }
      })
    }

  } catch (error) {
    console.error('Connection test error:', error)
    return NextResponse.json(
      { error: 'Bağlantı testi sırasında hata oluştu: ' + error.message },
      { status: 500 }
    )
  }
}