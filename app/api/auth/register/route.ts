import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const {
      companyName,
      taxNumber,
      contactPerson,
      email,
      phone,
      address,
      city,
      country = 'Türkiye'
    } = await request.json()

    // Validation
    if (!companyName || !contactPerson || !email) {
      return NextResponse.json(
        { error: 'Şirket adı, yetkili kişi ve e-posta gereklidir' },
        { status: 400 }
      )
    }

    // Check if company already exists (by email or tax number)
    const existingCompanyQuery = `
      SELECT id FROM companies
      WHERE email = $1 OR (tax_number = $2 AND tax_number IS NOT NULL)
    `
    const existingCompany = await query(existingCompanyQuery, [
      email.toLowerCase(),
      taxNumber || null
    ])

    if (existingCompany.rows.length > 0) {
      return NextResponse.json(
        { error: 'Bu e-posta adresi veya vergi numarası zaten kayıtlı' },
        { status: 400 }
      )
    }

    // Şirket oluştur
    const companyResult = await query(
      `INSERT INTO companies (name, tax_number, contact_person, email, phone, address, city, country, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING id, name, tax_number, contact_person, email, phone, address, city, country, created_at`,
      [
        companyName,
        taxNumber || null,
        contactPerson,
        email.toLowerCase(),
        phone || null,
        address || null,
        city || null,
        country
      ]
    )

    const company = companyResult.rows[0]

    return NextResponse.json({
      message: 'Şirket başarıyla kaydedildi',
      company: {
        id: company.id,
        name: company.name,
        taxNumber: company.tax_number,
        contactPerson: company.contact_person,
        email: company.email,
        phone: company.phone,
        address: company.address,
        city: company.city,
        country: company.country,
        createdAt: company.created_at
      }
    })

  } catch (error) {
    console.error('Company registration error:', error)
    return NextResponse.json(
      { error: 'Şirket kaydı sırasında bir hata oluştu. Lütfen tekrar deneyin.' },
      { status: 500 }
    )
  }
}