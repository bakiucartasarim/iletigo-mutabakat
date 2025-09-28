// This endpoint is for system administrators only
// Companies should NOT have access to this endpoint
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    // TODO: Add super admin authentication check here
    // This endpoint should only be accessible by super admins

    const {
      first_name,
      last_name,
      email,
      phone,
      department,
      position,
      role,
      password,
      company_id,
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

    // Validate role - system admins can create any role
    const validRoles = ['super_admin', 'company_admin', 'company_user']
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Geçersiz rol seçimi' },
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
      [email, passwordHash, first_name, last_name, phone, role, department, position, company_id, is_active]
    )

    const newUser = result.rows[0]

    return NextResponse.json({
      message: 'Kullanıcı başarıyla oluşturuldu (Sistem Yöneticisi)',
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
    console.error('Admin user creation error:', error)
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    )
  }
}