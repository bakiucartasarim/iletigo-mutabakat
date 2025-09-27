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

    // Check if company already exists (by email)
    const existingEmailQuery = `SELECT id FROM companies WHERE email = $1`
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

    // Şirket oluştur
    const companyResult = await query(
      `INSERT INTO companies (name, tax_number, contact_person, email, phone, address, city, country, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING id, name, tax_number, contact_person, email, phone, address, city, country, created_at`,
      [
        companyName,
        (taxNumber && taxNumber.trim() !== '') ? taxNumber.trim() : null,
        contactPerson,
        email.toLowerCase(),
        (phone && phone.trim() !== '') ? phone.trim() : null,
        (address && address.trim() !== '') ? address.trim() : null,
        (city && city.trim() !== '') ? city.trim() : null,
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
    console.error('Error details:', error.message)
    console.error('Error stack:', error.stack)
    return NextResponse.json(
      { error: 'Şirket kaydı sırasında bir hata oluştu: ' + error.message },
      { status: 500 }
    )
  }
}