import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Check for auth token in cookies
    const authToken = request.cookies.get('auth-token')?.value
    console.log('Verify - auth token:', authToken)

    if (!authToken) {
      console.log('Verify - no auth token found')
      return NextResponse.json(
        { error: 'No authentication token' },
        { status: 401 }
      )
    }

    // For now, just check if token exists and follows our format
    // In production, you'd validate the JWT or session token properly
    if (authToken.startsWith('user-')) {
      return NextResponse.json(
        { message: 'Authenticated', userId: authToken },
        { status: 200 }
      )
    }

    return NextResponse.json(
      { error: 'Invalid token' },
      { status: 401 }
    )

  } catch (error) {
    console.error('Auth verification error:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}