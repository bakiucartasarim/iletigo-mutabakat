import { NextRequest, NextResponse } from 'next/server'
import { query, transaction } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const {
      companyName,
      taxNumber,
      contactPerson,
      email,
      password,
      phone,
      address
    } = await request.json()

    // Validation
    if (!companyName || !contactPerson || !email || !password) {
      return NextResponse.json(
        { error: 'Şirket adı, yetkili kişi, e-posta ve şifre gereklidir' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Şifre en az 6 karakter olmalıdır' },
        { status: 400 }
      )
    }

    // Check if email already exists (both companies and users)
    const existingEmailQuery = `
      SELECT 'company' as type FROM companies WHERE email = $1
      UNION
      SELECT 'user' as type FROM users WHERE email = $1
    `
    const existingEmail = await query(existingEmailQuery, [email.toLowerCase()])

    if (existingEmail.rows.length > 0) {
      return NextResponse.json(
        { error: 'Bu e-posta adresi zaten kayıtlı' },
        { status: 400 }
      )
    }

    // Check if tax number already exists (only if provided)
    if (taxNumber && taxNumber.trim() !== '') {
      const existingTaxQuery = `SELECT id FROM companies WHERE tax_number = $1`
      const existingTax = await query(existingTaxQuery, [taxNumber.trim()])

      if (existingTax.rows.length > 0) {
        return NextResponse.json(
          { error: 'Bu vergi numarası zaten kayıtlı' },
          { status: 400 }
        )
      }
    }

    // Hash password
    const saltRounds = 12
    const passwordHash = await bcrypt.hash(password, saltRounds)

    // Şirket oluştur (şifreyi de companies tablosuna ekleyelim geçici olarak)
    const companyCode = `COMP-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`

    const companyResult = await query(
      `INSERT INTO companies (code, name, tax_number, contact_person, email, phone, address, password_hash, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING id, code, name, tax_number, contact_person, email, phone, address, created_at`,
      [
        companyCode,
        companyName,
        (taxNumber && taxNumber.trim() !== '') ? taxNumber.trim() : null,
        contactPerson,
        email.toLowerCase(),
        (phone && phone.trim() !== '') ? phone.trim() : null,
        (address && address.trim() !== '') ? address.trim() : null,
        passwordHash
      ]
    )

    const company = companyResult.rows[0]

    return NextResponse.json({
      message: 'Şirket başarıyla kaydedildi',
      company: {
        id: company.id,
        code: company.code,
        name: company.name,
        taxNumber: company.tax_number,
        contactPerson: company.contact_person,
        email: company.email,
        phone: company.phone,
        address: company.address,
        createdAt: company.created_at
      }
    })

  } catch (error) {
    console.error('Company registration error:', error)
    console.error('Error details:', error.message)
    console.error('Error stack:', error.stack)
    return NextResponse.json(
      { error: 'Şirket kaydı sırasında bir hata oluştu: ' + error.message },
      { status: 500 }
    )
  }
}