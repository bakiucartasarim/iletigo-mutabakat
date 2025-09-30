import { NextRequest, NextResponse } from 'next/server'

interface KlaviyoTestRequest {
  apiKey: string
  testEmail: string
  testType: 'connection' | 'profile' | 'email' | 'campaign' | 'client-events' | 'all'
}

interface KlaviyoTestResult {
  testType: string
  success: boolean
  data?: any
  error?: string
  duration?: number
  debug?: {
    requestUrl?: string
    requestMethod?: string
    requestHeaders?: any
    requestBody?: any
    responseStatus?: number
    responseHeaders?: any
    rawResponse?: string
    timestamp?: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const { apiKey, testEmail, testType }: KlaviyoTestRequest = await request.json()

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API anahtarı gereklidir' },
        { status: 400 }
      )
    }

    if (!testEmail) {
      return NextResponse.json(
        { error: 'Test email adresi gereklidir' },
        { status: 400 }
      )
    }

    const results: KlaviyoTestResult[] = []

    // Test 1: API Connection Test
    if (testType === 'connection' || testType === 'all') {
      const connectionResult = await testKlaviyoConnection(apiKey)
      results.push(connectionResult)
    }

    // Test 2: Profile Management Test
    if (testType === 'profile' || testType === 'all') {
      const profileResult = await testProfileManagement(apiKey, testEmail)
      results.push(profileResult)
    }

    // Test 3: Email Sending Test
    if (testType === 'email' || testType === 'all') {
      const emailResult = await testEmailSending(apiKey, testEmail)
      results.push(emailResult)
    }

    // Test 4: Campaigns Access Test
    if (testType === 'campaign' || testType === 'all') {
      const campaignResult = await testCampaignsAccess(apiKey)
      results.push(campaignResult)
    }

    // Test 5: Client Events API Test
    if (testType === 'client-events' || testType === 'all') {
      const clientEventsResult = await testClientEvents(apiKey, testEmail)
      results.push(clientEventsResult)
    }

    const allSuccess = results.every(r => r.success)
    const totalDuration = results.reduce((sum, r) => sum + (r.duration || 0), 0)

    return NextResponse.json({
      success: allSuccess,
      message: allSuccess ? 'Tüm testler başarılı!' : 'Bazı testler başarısız oldu',
      totalTests: results.length,
      successfulTests: results.filter(r => r.success).length,
      totalDuration: `${totalDuration}ms`,
      results
    })

  } catch (error) {
    console.error('Klaviyo test error:', error)
    return NextResponse.json(
      { error: 'Test sırasında hata oluştu: ' + error.message },
      { status: 500 }
    )
  }
}

async function testKlaviyoConnection(apiKey: string): Promise<KlaviyoTestResult> {
  const startTime = Date.now()
  const timestamp = new Date().toISOString()
  const requestUrl = 'https://a.klaviyo.com/api/accounts/'
  const requestMethod = 'GET'
  const requestHeaders = {
    'Authorization': `Klaviyo-API-Key ${apiKey.substring(0, 8)}...`,
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'REVISION': '2024-10-15'
  }

  try {
    console.log('🔗 Testing Klaviyo connection...')
    console.log('📡 Request Details:', { url: requestUrl, method: requestMethod, headers: requestHeaders })

    const response = await fetch(requestUrl, {
      method: requestMethod,
      headers: {
        'Authorization': `Klaviyo-API-Key ${apiKey}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'REVISION': '2024-10-15'
      }
    })

    const duration = Date.now() - startTime
    const responseHeaders = Object.fromEntries(response.headers.entries())
    const responseText = await response.text()

    console.log('📥 Response Details:', {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      bodyLength: responseText.length
    })

    if (response.ok) {
      let data = {}
      try {
        data = responseText ? JSON.parse(responseText) : {}
      } catch (parseError) {
        console.log('⚠️ JSON parse warning:', parseError.message)
      }

      console.log('✅ Connection test successful')

      return {
        testType: 'Connection Test',
        success: true,
        data: {
          accountId: data.data?.[0]?.id,
          accountType: data.data?.[0]?.type,
          organizationName: data.data?.[0]?.attributes?.contact_information?.organization_name,
          testAccount: data.data?.[0]?.attributes?.test_account
        },
        duration,
        debug: {
          requestUrl,
          requestMethod,
          requestHeaders,
          responseStatus: response.status,
          responseHeaders,
          rawResponse: responseText.substring(0, 1000) + (responseText.length > 1000 ? '...' : ''),
          timestamp
        }
      }
    } else {
      let errorData = {}
      try {
        errorData = responseText ? JSON.parse(responseText) : {}
      } catch (parseError) {
        console.log('⚠️ Error response parse warning:', parseError.message)
      }

      console.log('❌ Connection test failed:', response.status)

      return {
        testType: 'Connection Test',
        success: false,
        error: `HTTP ${response.status}: ${errorData.detail || errorData.message || 'Unknown error'}`,
        duration,
        debug: {
          requestUrl,
          requestMethod,
          requestHeaders,
          responseStatus: response.status,
          responseHeaders,
          rawResponse: responseText.substring(0, 1000) + (responseText.length > 1000 ? '...' : ''),
          timestamp
        }
      }
    }
  } catch (error) {
    const duration = Date.now() - startTime
    console.log('❌ Connection test error:', error.message)

    return {
      testType: 'Connection Test',
      success: false,
      error: error.message,
      duration,
      debug: {
        requestUrl,
        requestMethod,
        requestHeaders,
        timestamp,
        rawResponse: `Network Error: ${error.message}`
      }
    }
  }
}

async function testProfileManagement(apiKey: string, email: string): Promise<KlaviyoTestResult> {
  const startTime = Date.now()

  try {
    console.log('👤 Testing profile management...')

    // First, try to get existing profile with additional fields
    const getResponse = await fetch(`https://a.klaviyo.com/api/profiles/?filter=equals(email,"${email}")&additional-fields[profile]=properties`, {
      method: 'GET',
      headers: {
        'Authorization': `Klaviyo-API-Key ${apiKey}`,
        'Accept': 'application/json',
        'REVISION': '2024-10-15'
      }
    })

    if (!getResponse.ok) {
      const duration = Date.now() - startTime
      return {
        testType: 'Profile Management',
        success: false,
        error: `Failed to fetch profile: HTTP ${getResponse.status}`,
        duration
      }
    }

    const existingData = await getResponse.json()
    let profileId = null
    let profileData = null
    let companyId = null

    if (existingData.data && existingData.data.length > 0) {
      profileId = existingData.data[0].id
      profileData = existingData.data[0].attributes
      companyId = profileData?.properties?.company_id || null
      console.log('📋 Profile already exists:', profileId)
      console.log('🏢 Company ID from profile:', companyId)
    } else {
      // Create new profile with company_id in properties
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
              first_name: 'Test',
              last_name: 'User',
              properties: {
                'test_account': true,
                'created_by': 'İletigo Mail Engine',
                'company_id': 1 // Default test company ID
              }
            }
          }
        })
      })

      if (createResponse.ok) {
        const newProfile = await createResponse.json()
        profileId = newProfile.data.id
        profileData = newProfile.data.attributes
        companyId = 1 // Set default company_id for new profiles
        console.log('✅ Profile created:', profileId)
      } else {
        const duration = Date.now() - startTime
        const errorData = await createResponse.json().catch(() => ({}))
        return {
          testType: 'Profile Management',
          success: false,
          error: `Failed to create profile: HTTP ${createResponse.status} - ${errorData.detail || 'Unknown error'}`,
          duration
        }
      }
    }

    const duration = Date.now() - startTime

    return {
      testType: 'Profile Management',
      success: true,
      data: {
        profileId,
        email,
        companyId,
        firstName: profileData?.first_name,
        lastName: profileData?.last_name,
        properties: profileData?.properties,
        action: existingData.data?.length > 0 ? 'found_existing' : 'created_new',
        note: 'company_id is stored in profile properties and can be used for filtering'
      },
      duration
    }

  } catch (error) {
    const duration = Date.now() - startTime
    console.log('❌ Profile management test error:', error.message)

    return {
      testType: 'Profile Management',
      success: false,
      error: error.message,
      duration
    }
  }
}

async function testCampaignsAccess(apiKey: string): Promise<KlaviyoTestResult> {
  const startTime = Date.now()

  try {
    console.log('📧 Testing campaigns access...')

    const response = await fetch('https://a.klaviyo.com/api/campaigns/', {
      method: 'GET',
      headers: {
        'Authorization': `Klaviyo-API-Key ${apiKey}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'REVISION': '2024-10-15'
      }
    })

    const duration = Date.now() - startTime

    if (response.ok) {
      let responseData = {}
      try {
        const responseText = await response.text()
        if (responseText.trim()) {
          responseData = JSON.parse(responseText)
        }
      } catch (parseError) {
        console.log('⚠️ Campaigns response parsing warning:', parseError.message)
      }

      console.log('✅ Campaigns access test successful')

      const campaigns = responseData.data || []
      return {
        testType: 'Campaigns Access',
        success: true,
        data: {
          totalCampaigns: campaigns.length,
          campaignTypes: campaigns.map(c => c.attributes?.type).filter(Boolean),
          message: 'Successfully accessed campaigns API.',
          note: 'This tests read access to campaigns - required for email functionality',
          responseStatus: response.status
        },
        duration
      }
    } else {
      let errorData = {}
      try {
        const errorText = await response.text()
        if (errorText.trim()) {
          errorData = JSON.parse(errorText)
        }
      } catch (parseError) {
        console.log('⚠️ Campaigns error response parsing warning:', parseError.message)
      }

      console.log('❌ Campaigns access test failed:', response.status)

      return {
        testType: 'Campaigns Access',
        success: false,
        error: `HTTP ${response.status}: ${errorData.detail || errorData.message || 'Unknown error'}`,
        duration
      }
    }

  } catch (error) {
    const duration = Date.now() - startTime
    console.log('❌ Campaigns access test error:', error.message)

    return {
      testType: 'Campaigns Access',
      success: false,
      error: error.message,
      duration
    }
  }
}

async function testClientEvents(apiKey: string, email: string): Promise<KlaviyoTestResult> {
  const startTime = Date.now()
  const timestamp = new Date().toISOString()

  // Note: This endpoint typically needs a company_id which we'll try to derive from account info
  // For testing purposes, we'll use a mock company ID and expect it might fail
  const requestUrl = 'https://a.klaviyo.com/client/events/?company_id=TEST_COMPANY_ID'
  const requestMethod = 'POST'
  const requestBody = {
    data: {
      type: 'event',
      attributes: {
        properties: {
          'test_client_event': true,
          'event_source': 'İletigo Mail Engine Client Test',
          'test_message': 'Client events API test',
          'timestamp': timestamp
        },
        metric: {
          name: 'Client Event Test'
        },
        profile: {
          email: email,
          first_name: 'Test',
          last_name: 'User'
        }
      }
    }
  }
  const requestHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Klaviyo-API-Key ${apiKey.substring(0, 8)}...`
  }

  try {
    console.log('🎯 Testing client events...')
    console.log('📡 Request Details:', { url: requestUrl, method: requestMethod, headers: requestHeaders })

    const response = await fetch(requestUrl, {
      method: requestMethod,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Klaviyo-API-Key ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    })

    const duration = Date.now() - startTime
    const responseHeaders = Object.fromEntries(response.headers.entries())
    const responseText = await response.text()

    console.log('📥 Response Details:', {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      bodyLength: responseText.length
    })

    if (response.ok) {
      let data = {}
      try {
        data = responseText ? JSON.parse(responseText) : {}
      } catch (parseError) {
        console.log('⚠️ Client events response parsing warning:', parseError.message)
      }

      console.log('✅ Client events test successful')

      return {
        testType: 'Client Events API',
        success: true,
        data: {
          eventId: data.data?.id || 'Event created (ID not available)',
          email,
          message: 'Client event created successfully.',
          note: 'Client events API allows frontend event tracking',
          responseStatus: response.status
        },
        duration,
        debug: {
          requestUrl,
          requestMethod,
          requestHeaders,
          requestBody,
          responseStatus: response.status,
          responseHeaders,
          rawResponse: responseText.substring(0, 1000) + (responseText.length > 1000 ? '...' : ''),
          timestamp
        }
      }
    } else {
      let errorData = {}
      try {
        errorData = responseText ? JSON.parse(responseText) : {}
      } catch (parseError) {
        console.log('⚠️ Client events error response parsing warning:', parseError.message)
      }

      console.log('❌ Client events test failed:', response.status)

      return {
        testType: 'Client Events API',
        success: false,
        error: `HTTP ${response.status}: ${errorData.detail || errorData.message || 'Unknown error - might need valid company_id'}`,
        duration,
        debug: {
          requestUrl,
          requestMethod,
          requestHeaders,
          requestBody,
          responseStatus: response.status,
          responseHeaders,
          rawResponse: responseText.substring(0, 1000) + (responseText.length > 1000 ? '...' : ''),
          timestamp
        }
      }
    }

  } catch (error) {
    const duration = Date.now() - startTime
    console.log('❌ Client events test error:', error.message)

    return {
      testType: 'Client Events API',
      success: false,
      error: error.message,
      duration,
      debug: {
        requestUrl,
        requestMethod,
        requestHeaders,
        requestBody,
        timestamp,
        rawResponse: `Network Error: ${error.message}`
      }
    }
  }
}

async function testEmailSending(apiKey: string, email: string): Promise<KlaviyoTestResult> {
  const startTime = Date.now()

  try {
    console.log('📧 Testing email sending...')

    // Create an event to trigger email (this is how Klaviyo typically sends emails)
    const eventResponse = await fetch('https://a.klaviyo.com/api/events/', {
      method: 'POST',
      headers: {
        'Authorization': `Klaviyo-API-Key ${apiKey}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'REVISION': '2024-10-15'
      },
      body: JSON.stringify({
        data: {
          type: 'event',
          attributes: {
            properties: {
              'test_event': true,
              'event_source': 'İletigo Mail Engine',
              'test_message': 'Bu İletigo Mail Engine test emailidir',
              'timestamp': new Date().toISOString()
            },
            metric: {
              data: {
                type: 'metric',
                attributes: {
                  name: 'İletigo Test Email'
                }
              }
            },
            profile: {
              data: {
                type: 'profile',
                attributes: {
                  email,
                  first_name: 'Test',
                  last_name: 'User'
                }
              }
            }
          }
        }
      })
    })

    const duration = Date.now() - startTime

    if (eventResponse.ok) {
      let eventData = {}
      try {
        const responseText = await eventResponse.text()
        if (responseText.trim()) {
          eventData = JSON.parse(responseText)
        }
      } catch (parseError) {
        console.log('⚠️ Event response parsing warning:', parseError.message)
      }

      console.log('✅ Event created successfully')

      return {
        testType: 'Email Sending (Event)',
        success: true,
        data: {
          eventId: eventData.data?.id || 'Event created (ID not available)',
          email,
          message: 'Event created successfully. Email will be sent based on flow configuration.',
          note: 'Actual email delivery depends on configured flows/campaigns in Klaviyo',
          responseStatus: eventResponse.status
        },
        duration
      }
    } else {
      let errorData = {}
      try {
        const errorText = await eventResponse.text()
        if (errorText.trim()) {
          errorData = JSON.parse(errorText)
        }
      } catch (parseError) {
        console.log('⚠️ Error response parsing warning:', parseError.message)
      }

      console.log('❌ Email sending test failed:', eventResponse.status)

      return {
        testType: 'Email Sending (Event)',
        success: false,
        error: `HTTP ${eventResponse.status}: ${errorData.detail || errorData.message || 'Unknown error'}`,
        duration
      }
    }

  } catch (error) {
    const duration = Date.now() - startTime
    console.log('❌ Email sending test error:', error.message)

    return {
      testType: 'Email Sending (Event)',
      success: false,
      error: error.message,
      duration
    }
  }
}