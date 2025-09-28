import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Get auth token from cookies
    const authToken = request.cookies.get('auth-token')?.value

    if (!authToken) {
      return NextResponse.json(
        { error: 'No authentication token' },
        { status: 401 }
      )
    }

    // Extract company ID from auth token
    const tokenParts = authToken.split('-')
    if (tokenParts.length < 2) {
      return NextResponse.json(
        { error: 'Invalid token format' },
        { status: 401 }
      )
    }

    const companyId = tokenParts[1]

    // Get users from the same company
    const result = await query(
      `SELECT
         id,
         email,
         first_name,
         last_name,
         phone,
         role,
         department,
         position,
         is_active,
         last_login,
         created_at
       FROM users
       WHERE company_id = $1
       ORDER BY created_at DESC`,
      [companyId]
    )

    const users = result.rows.map(user => ({
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      full_name: `${user.first_name} ${user.last_name}`,
      phone: user.phone,
      role: user.role,
      role_display: getRoleDisplay(user.role),
      department: user.department,
      position: user.position,
      is_active: user.is_active,
      last_login: user.last_login,
      created_at: user.created_at
    }))

    return NextResponse.json({
      users,
      total: users.length
    })

  } catch (error) {
    console.error('Users list error:', error)
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    )
  }
}

function getRoleDisplay(role: string): string {
  const roleMap: { [key: string]: string } = {
    'super_admin': 'Süper Admin (Sistem)',
    'company_admin': 'Firma Admini',
    'company_user': 'Firma Kullanıcısı'
  }
  return roleMap[role] || role
}