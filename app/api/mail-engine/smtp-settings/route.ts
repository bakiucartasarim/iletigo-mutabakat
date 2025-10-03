import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

// GET - Fetch SMTP settings
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

    // Fetch SMTP settings
    const result = await query(
      `SELECT smtp_host, smtp_port, smtp_user, smtp_password, from_email, from_name, is_active, updated_at
       FROM smtp_settings
       ORDER BY id DESC
       LIMIT 1`
    )

    if (result.rows.length === 0) {
      return NextResponse.json({
        smtp_host: '',
        smtp_port: 465,
        smtp_user: '',
        smtp_password: '',
        from_email: '',
        from_name: '',
        is_active: false
      })
    }

    return NextResponse.json(result.rows[0])

  } catch (error) {
    console.error('Error fetching SMTP settings:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}

// POST - Save SMTP settings
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

    const { smtp_host, smtp_port, smtp_user, smtp_password, from_email, from_name, is_active } = await request.json()

    // Check if settings exist
    const existing = await query('SELECT id FROM smtp_settings LIMIT 1')

    let result
    if (existing.rows.length > 0) {
      // Update existing
      result = await query(
        `UPDATE smtp_settings
         SET smtp_host = $1, smtp_port = $2, smtp_user = $3, smtp_password = $4,
             from_email = $5, from_name = $6, is_active = $7, updated_at = CURRENT_TIMESTAMP
         WHERE id = $8
         RETURNING *`,
        [smtp_host, smtp_port, smtp_user, smtp_password, from_email, from_name, is_active !== false, existing.rows[0].id]
      )
    } else {
      // Insert new
      result = await query(
        `INSERT INTO smtp_settings (smtp_host, smtp_port, smtp_user, smtp_password, from_email, from_name, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [smtp_host, smtp_port, smtp_user, smtp_password, from_email, from_name, is_active !== false]
      )
    }

    return NextResponse.json({
      message: 'SMTP settings saved successfully',
      data: result.rows[0]
    })

  } catch (error) {
    console.error('Error saving SMTP settings:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}
