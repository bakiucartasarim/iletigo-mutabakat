import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

// GET - Fetch Brevo settings
export async function GET(request: NextRequest) {
  try {
    const authToken = request.cookies.get('auth-token')?.value

    if (!authToken) {
      return NextResponse.json(
        { error: 'No authentication token' },
        { status: 401 }
      )
    }

    // Get user info
    const tokenParts = authToken.split('-')
    if (tokenParts.length < 2) {
      return NextResponse.json(
        { error: 'Invalid token format' },
        { status: 401 }
      )
    }

    const userId = tokenParts[1]

    // Fetch user to get company_id
    const userQuery = `SELECT company_id, role FROM users WHERE id = $1 AND is_active = true`
    const userResult = await query(userQuery, [userId])

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const user = userResult.rows[0]

    // Only super_admin can access
    if (user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Super admin only' },
        { status: 403 }
      )
    }

    // Fetch Brevo settings
    const result = await query(
      `SELECT api_key, from_email, from_name, is_active, updated_at
       FROM brevo_settings
       ORDER BY id DESC
       LIMIT 1`
    )

    if (result.rows.length === 0) {
      return NextResponse.json({
        api_key: '',
        from_email: '',
        from_name: '',
        is_active: false
      })
    }

    return NextResponse.json(result.rows[0])

  } catch (error) {
    console.error('Error fetching Brevo settings:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}

// POST - Save Brevo settings
export async function POST(request: NextRequest) {
  try {
    const authToken = request.cookies.get('auth-token')?.value

    if (!authToken) {
      return NextResponse.json(
        { error: 'No authentication token' },
        { status: 401 }
      )
    }

    const tokenParts = authToken.split('-')
    if (tokenParts.length < 2) {
      return NextResponse.json(
        { error: 'Invalid token format' },
        { status: 401 }
      )
    }

    const userId = tokenParts[1]

    // Fetch user to check role
    const userQuery = `SELECT role FROM users WHERE id = $1 AND is_active = true`
    const userResult = await query(userQuery, [userId])

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const user = userResult.rows[0]

    // Only super_admin can save
    if (user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Super admin only' },
        { status: 403 }
      )
    }

    const { api_key, from_email, from_name, is_active } = await request.json()

    // Check if settings exist
    const existing = await query('SELECT id FROM brevo_settings LIMIT 1')

    let result
    if (existing.rows.length > 0) {
      // Update existing
      result = await query(
        `UPDATE brevo_settings
         SET api_key = $1, from_email = $2, from_name = $3, is_active = $4, updated_at = CURRENT_TIMESTAMP
         WHERE id = $5
         RETURNING *`,
        [api_key, from_email, from_name, is_active !== false, existing.rows[0].id]
      )
    } else {
      // Insert new
      result = await query(
        `INSERT INTO brevo_settings (api_key, from_email, from_name, is_active)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [api_key, from_email, from_name, is_active !== false]
      )
    }

    return NextResponse.json({
      message: 'Brevo settings saved successfully',
      data: result.rows[0]
    })

  } catch (error) {
    console.error('Error saving Brevo settings:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}
