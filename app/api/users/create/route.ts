import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
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

    const {
      first_name,
      last_name,
      email,
      phone,
      department,
      position,
      role,
      password,
      is_active = true
    } = await request.json()

    // Validate required fields
    if (!first_name || !last_name || !email || !role) {
      return NextResponse.json(
        { error: 'Ad, soyad, e-posta ve rol gereklidir' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Geçerli bir e-posta adresi girin' },
        { status: 400 }
      )
    }

    // Validate role - companies can only create company_admin and company_user
    const allowedRoles = ['company_admin', 'company_user']
    if (!allowedRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Firmalar sadece Firma Admini ve Firma Kullanıcısı rolleri atayabilir' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    )

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { error: 'Bu e-posta adresi zaten kullanılıyor' },
        { status: 400 }
      )
    }

    // Generate password if not provided
    const userPassword = password || Math.random().toString(36).slice(-8)

    // Hash password
    const passwordHash = await bcrypt.hash(userPassword, 12)

    // Create user
    const result = await query(
      `INSERT INTO users
       (email, password_hash, first_name, last_name, phone, role, department, position, company_id, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, email, first_name, last_name, role`,
      [email, passwordHash, first_name, last_name, phone, role, department, position, companyId, is_active]
    )

    const newUser = result.rows[0]

    return NextResponse.json({
      message: 'Kullanıcı başarıyla oluşturuldu',
      user: {
        id: newUser.id,
        email: newUser.email,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        role: newUser.role
      },
      temporaryPassword: password ? undefined : userPassword
    })

  } catch (error) {
    console.error('User creation error:', error)
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    )
  }
}