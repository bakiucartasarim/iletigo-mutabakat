import { NextRequest, NextResponse } from 'next/server'

/**
 * Update Klaviyo profile with company_id and other properties
 * This endpoint updates or creates a profile with company information
 * Reference: https://github.com/klaviyo-labs/api-examples
 */
export async function POST(request: NextRequest) {
  try {
    const { apiKey, email, companyId, firstName, lastName, additionalProperties } = await request.json()

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

    console.log('🔄 Updating profile for email:', email, 'with company_id:', companyId)

    // Prepare profile properties
    const properties: Record<string, any> = {
      ...additionalProperties,
    }

    if (companyId !== undefined) {
      properties.company_id = companyId
    }

    // Check if profile exists
    const getResponse = await fetch(
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

    if (!getResponse.ok) {
      return NextResponse.json(
        { error: `Klaviyo API error: HTTP ${getResponse.status}` },
        { status: getResponse.status }
      )
    }

    const existingData = await getResponse.json()
    let profileId = null
    let action = ''

    if (existingData.data && existingData.data.length > 0) {
      // Update existing profile
      profileId = existingData.data[0].id
      action = 'updated'

      const updateResponse = await fetch(`https://a.klaviyo.com/api/profiles/${profileId}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Klaviyo-API-Key ${apiKey}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'REVISION': '2024-10-15'
        },
        body: JSON.stringify({
          data: {
            type: 'profile',
            id: profileId,
            attributes: {
              ...(firstName && { first_name: firstName }),
              ...(lastName && { last_name: lastName }),
              properties
            }
          }
        })
      })

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text()
        console.error('❌ Profile update error:', updateResponse.status, errorText)
        return NextResponse.json(
          { error: `Failed to update profile: HTTP ${updateResponse.status}` },
          { status: updateResponse.status }
        )
      }

      console.log('✅ Profile updated:', profileId)
    } else {
      // Create new profile
      action = 'created'

      const createResponse = await fetch('https://a.klaviyo.com/api/profiles/', {
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
              ...(firstName && { first_name: firstName }),
              ...(lastName && { last_name: lastName }),
              properties
            }
          }
        })
      })

      if (!createResponse.ok) {
        const errorText = await createResponse.text()
        console.error('❌ Profile creation error:', createResponse.status, errorText)
        return NextResponse.json(
          { error: `Failed to create profile: HTTP ${createResponse.status}` },
          { status: createResponse.status }
        )
      }

      const newProfile = await createResponse.json()
      profileId = newProfile.data.id
      console.log('✅ Profile created:', profileId)
    }

    return NextResponse.json({
      success: true,
      data: {
        profileId,
        email,
        companyId,
        action,
        message: `Profile ${action} successfully with company_id: ${companyId}`
      }
    })

  } catch (error) {
    console.error('❌ Update profile error:', error)
    return NextResponse.json(
      { error: 'Sunucu hatası: ' + error.message },
      { status: 500 }
    )
  }
}