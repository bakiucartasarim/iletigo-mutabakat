import { NextRequest, NextResponse } from 'next/server'

/**
 * Get company_id from Klaviyo profile properties
 * This endpoint retrieves a profile by email and extracts the company_id
 * Reference: https://github.com/klaviyo-labs/api-examples/tree/main/profiles/get_profiles_youtube
 */
export async function POST(request: NextRequest) {
  try {
    const { apiKey, email } = await request.json()

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API anahtarı gereklidir' },
        { status: 400 }
      )
    }

    if (!email) {
      return NextResponse.json(
        { error: 'Email adresi gereklidir' },
        { status: 400 }
      )
    }

    console.log('🔍 Getting company_id for email:', email)

    // Get profile with properties using additional-fields parameter
    const response = await fetch(
      `https://a.klaviyo.com/api/profiles/?filter=equals(email,"${email}")&additional-fields[profile]=properties`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Klaviyo-API-Key ${apiKey}`,
          'Accept': 'application/json',
          'REVISION': '2024-10-15'
        }
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Klaviyo API error:', response.status, errorText)
      return NextResponse.json(
        { error: `Klaviyo API error: HTTP ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()

    if (!data.data || data.data.length === 0) {
      return NextResponse.json(
        { error: 'Profil bulunamadı' },
        { status: 404 }
      )
    }

    const profile = data.data[0]
    const companyId = profile.attributes?.properties?.company_id || null

    console.log('✅ Profile found:', {
      profileId: profile.id,
      email: profile.attributes?.email,
      companyId
    })

    return NextResponse.json({
      success: true,
      data: {
        profileId: profile.id,
        email: profile.attributes?.email,
        companyId,
        firstName: profile.attributes?.first_name,
        lastName: profile.attributes?.last_name,
        properties: profile.attributes?.properties,
        note: companyId
          ? 'company_id found in profile properties'
          : 'company_id not set in profile properties'
      }
    })

  } catch (error) {
    console.error('❌ Get company_id error:', error)
    return NextResponse.json(
      { error: 'Sunucu hatası: ' + error.message },
      { status: 500 }
    )
  }
}