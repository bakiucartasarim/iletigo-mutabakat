import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'

export async function GET(request: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      // Mock mode - allow access for bakiucartasarim@gmail.com
      console.log('🔒 Mock mode: Super admin check passed for development')

      return NextResponse.json({
        success: true,
        data: {
          isSuperAdmin: true,
          user: {
            id: 1,
            name: 'Baki Ucar',
            email: 'bakiucartasarim@gmail.com',
            role: 'super_admin'
          }
        }
      })
    }

    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: false
    })

    try {
      // For now, we'll check for the super admin user by email
      // In a real application, you would get this from session/JWT token
      const superAdminEmail = 'bakiucartasarim@gmail.com'

      const result = await pool.query(`
        SELECT
          u.id,
          u.first_name,
          u.last_name,
          u.email,
          u.role,
          u.is_active
        FROM users u
        WHERE u.email = $1 AND u.role = 'super_admin' AND u.is_active = true
      `, [superAdminEmail])

      if (result.rows.length === 0) {
        console.log('❌ Super admin access denied - user not found or not active')
        return NextResponse.json(
          { error: 'Super admin yetkisi gereklidir' },
          { status: 403 }
        )
      }

      const user = result.rows[0]
      console.log('✅ Super admin access granted for:', user.email)

      return NextResponse.json({
        success: true,
        data: {
          isSuperAdmin: true,
          user: {
            id: user.id,
            name: `${user.first_name} ${user.last_name}`,
            email: user.email,
            role: user.role
          }
        }
      })

    } finally {
      await pool.end()
    }

  } catch (error) {
    console.error('Super admin check error:', error)

    // Fallback to mock mode if database error
    console.log('🔒 Database error - falling back to mock mode for development')
    return NextResponse.json({
      success: true,
      data: {
        isSuperAdmin: true,
        user: {
          id: 1,
          name: 'Baki Ucar',
          email: 'bakiucartasarim@gmail.com',
          role: 'super_admin'
        }
      }
    })
  }
}