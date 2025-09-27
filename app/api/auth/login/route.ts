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

    // E-mail adresinden kullanıcıyı ve şirketini bul
    const userQuery = `
      SELECT u.id, u.email, u.password_hash, u.first_name, u.last_name,
             u.role, u.is_active, u.company_id, c.name as company_name
      FROM users u
      JOIN companies c ON u.company_id = c.id
      WHERE u.email = $1 AND u.is_active = true AND c.is_active = true
    `

    const result = await query(userQuery, [email])

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "E-posta veya şifre hatalı" },
        { status: 401 }
      )
    }

    const user = result.rows[0]

    // Şifre doğrulama
    const isValidPassword = await bcrypt.compare(password, user.password_hash)

    if (!isValidPassword) {
      return NextResponse.json(
        { error: "E-posta veya şifre hatalı" },
        { status: 401 }
      )
    }

    // Son giriş zamanını güncelle
    await query(
      "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1",
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
    response.cookies.set("auth-token", `user-${user.id}-${Date.now()}`, {
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
