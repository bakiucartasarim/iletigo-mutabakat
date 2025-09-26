import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

// Mock users database (in-memory)
const mockUsers: any[] = [
  {
    id: 1,
    email: 'admin@iletigo.com',
    password_hash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBDwpsDukeHjq6', // admin123
    first_name: 'Admin',
    last_name: 'User',
    role: 'admin',
    is_active: true,
    created_at: new Date()
  }
]

export async function POST(request: NextRequest) {
  try {
    const { email, password, firstName, lastName, role = 'user' } = await request.json()

    // Validation
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Tüm alanlar gereklidir' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Şifre en az 6 karakter olmalıdır' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = mockUsers.find(user => user.email === email.toLowerCase())

    if (existingUser) {
      return NextResponse.json(
        { error: 'Bu e-posta adresi zaten kullanımda' },
        { status: 400 }
      )
    }

    // Hash password
    const saltRounds = 12
    const passwordHash = await bcrypt.hash(password, saltRounds)

    // Create user
    const newUser = {
      id: mockUsers.length + 1,
      email: email.toLowerCase(),
      password_hash: passwordHash,
      first_name: firstName,
      last_name: lastName,
      role,
      is_active: true,
      created_at: new Date()
    }

    // Add to mock database
    mockUsers.push(newUser)

    return NextResponse.json({
      message: 'Kullanıcı başarıyla oluşturuldu',
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.first_name,
        lastName: newUser.last_name,
        role: newUser.role,
        createdAt: newUser.created_at
      }
    })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    )
  }

  // Export mock users for login
  export { mockUsers }
}