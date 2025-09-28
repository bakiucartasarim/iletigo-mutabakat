import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function PUT(request: NextRequest) {
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
    const { contact_person, email, phone, current_password, new_password, confirm_password } = await request.json()

    // Validate required fields
    if (!contact_person || !email) {
      return NextResponse.json(
        { error: 'Ad soyad ve e-posta adresi gereklidir' },
        { status: 400 }
      )
    }

    // Validate password change if requested
    if (new_password) {
      if (!current_password) {
        return NextResponse.json(
          { error: 'Yeni şifre için mevcut şifre gereklidir' },
          { status: 400 }
        )
      }

      if (new_password !== confirm_password) {
        return NextResponse.json(
          { error: 'Yeni şifreler eşleşmiyor' },
          { status: 400 }
        )
      }

      if (new_password.length < 6) {
        return NextResponse.json(
          { error: 'Yeni şifre en az 6 karakter olmalıdır' },
          { status: 400 }
        )
      }

      // Verify current password
      const currentCompany = await query(
        'SELECT password_hash FROM companies WHERE id = $1',
        [companyId]
      )

      if (currentCompany.rows.length === 0) {
        return NextResponse.json(
          { error: 'Şirket bulunamadı' },
          { status: 404 }
        )
      }

      const isValidPassword = await bcrypt.compare(current_password, currentCompany.rows[0].password_hash)
      if (!isValidPassword) {
        return NextResponse.json(
          { error: 'Mevcut şifre hatalı' },
          { status: 400 }
        )
      }

      // Hash new password and update
      const hashedPassword = await bcrypt.hash(new_password, 12)

      await query(
        `UPDATE companies
         SET contact_person = $1, email = $2, phone = $3, password_hash = $4, updated_at = CURRENT_TIMESTAMP
         WHERE id = $5`,
        [contact_person, email, phone, hashedPassword, companyId]
      )
    } else {
      // Update without password change
      await query(
        `UPDATE companies
         SET contact_person = $1, email = $2, phone = $3, updated_at = CURRENT_TIMESTAMP
         WHERE id = $4`,
        [contact_person, email, phone, companyId]
      )
    }

    return NextResponse.json(
      { message: 'Profil başarıyla güncellendi' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    )
  }
}