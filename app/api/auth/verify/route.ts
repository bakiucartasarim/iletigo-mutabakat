import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

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

    // Extract user ID from token (format: user-{id}-{timestamp})
    if (authToken.startsWith('user-')) {
      const tokenParts = authToken.split('-')
      if (tokenParts.length >= 2) {
        const userId = tokenParts[1]

        // Fetch user info from database
        const userQuery = `
          SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.company_id,
                 c.name as company_name
          FROM users u
          LEFT JOIN companies c ON u.company_id = c.id
          WHERE u.id = $1 AND u.is_active = true
        `

        const result = await query(userQuery, [userId])

        if (result.rows.length > 0) {
          const user = result.rows[0]
          return NextResponse.json(
            {
              message: 'Authenticated',
              user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                role: user.role,
                companyId: user.company_id,
                companyName: user.company_name
              }
            },
            { status: 200 }
          )
        }
      }
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