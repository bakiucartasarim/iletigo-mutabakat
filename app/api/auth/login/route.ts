import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: "E-posta ve şifre gereklidir" },
        { status: 400 }
      )
    }

    console.log('Login attempt for email:', email)

    // Kullanıcıyı bul
    const userQuery = `
      SELECT u.id, u.email, u.password_hash, u.first_name, u.last_name,
             u.role, u.company_id, u.is_active,
             c.name as company_name
      FROM users u
      LEFT JOIN companies c ON u.company_id = c.id
      WHERE u.email = $1 AND u.is_active = true
    `

    const result = await query(userQuery, [email])
    console.log('User query result:', result.rows.length, 'rows found')

    if (result.rows.length === 0) {
      console.log('No user found with email:', email)
      return NextResponse.json(
        { error: "E-posta veya şifre hatalı" },
        { status: 401 }
      )
    }

    const user = result.rows[0]
    console.log('User found:', { id: user.id, email: user.email, role: user.role, company_name: user.company_name })

    // Şifre doğrulama
    console.log('Comparing password with hash...')
    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    console.log('Password validation result:', isValidPassword)

    if (!isValidPassword) {
      console.log('Password validation failed for user:', user.email)
      return NextResponse.json(
        { error: "E-posta veya şifre hatalı" },
        { status: 401 }
      )
    }

    // Son giriş zamanını güncelle
    await query(
      "UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = $1",
      [user.id]
    )

    // Başarılı giriş
    const response = NextResponse.json(
      {
        message: "Giriş başarılı",
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

    // Session cookie set
    const authToken = `user-${user.id}-${Date.now()}`
    console.log('Setting auth token:', authToken)
    response.cookies.set("auth-token", authToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7 // 7 gün
    })

    return response

  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json(
      { error: "Sunucu hatası" },
      { status: 500 }
    )
  }
}
