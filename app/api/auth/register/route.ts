import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { query, transaction } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      companyName,
      description,
      website,
      phone,
      role = 'admin'
    } = await request.json()

    // Validation
    if (!email || !password || !firstName || !lastName || !companyName) {
      return NextResponse.json(
        { error: 'E-posta, şifre, ad, soyad ve şirket adı gereklidir' },
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
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    )

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { error: 'Bu e-posta adresi zaten kullanımda' },
        { status: 400 }
      )
    }

    // Hash password
    const saltRounds = 12
    const passwordHash = await bcrypt.hash(password, saltRounds)

    // Transaction ile hem şirket hem kullanıcı oluştur
    const result = await transaction(async (client) => {
      // Şirket oluştur
      const companyResult = await client.query(
        `INSERT INTO companies (code, name, contact_person, email, phone, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING id, code, name, contact_person, email, phone`,
        [
          `COMP-${Date.now()}`, // Unique company code
          companyName,
          `${firstName} ${lastName}`,
          email.toLowerCase(),
          phone || null
        ]
      )

      const company = companyResult.rows[0]

      // Kullanıcı oluştur
      const userResult = await client.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, role, company_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING id, email, first_name, last_name, role, company_id, created_at`,
        [email.toLowerCase(), passwordHash, firstName, lastName, role, company.id]
      )

      const user = userResult.rows[0]

      return { user, company }
    })

    return NextResponse.json({
      message: 'Şirket ve kullanıcı hesabı başarıyla oluşturuldu',
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.first_name,
        lastName: result.user.last_name,
        role: result.user.role,
        companyId: result.user.company_id,
        createdAt: result.user.created_at
      },
      company: {
        id: result.company.id,
        code: result.company.code,
        name: result.company.name,
        contactPerson: result.company.contact_person,
        email: result.company.email,
        phone: result.company.phone
      }
    })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Kayıt sırasında bir hata oluştu. Lütfen tekrar deneyin.' },
      { status: 500 }
    )
  }
}