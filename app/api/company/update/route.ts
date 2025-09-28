import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

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
    const {
      name,
      tax_number,
      email,
      phone,
      address,
      contact_person,
      website,
      description
    } = await request.json()

    // Validate required fields
    if (!name || !tax_number || !email || !contact_person) {
      return NextResponse.json(
        { error: 'Şirket adı, vergi numarası, e-posta ve yetkili kişi gereklidir' },
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

    // Check if tax number is already used by another company
    const existingCompany = await query(
      'SELECT id FROM companies WHERE tax_number = $1 AND id != $2',
      [tax_number, companyId]
    )

    if (existingCompany.rows.length > 0) {
      return NextResponse.json(
        { error: 'Bu vergi numarası başka bir şirket tarafından kullanılıyor' },
        { status: 400 }
      )
    }

    // Check if email is already used by another company
    const existingEmail = await query(
      'SELECT id FROM companies WHERE email = $1 AND id != $2',
      [email, companyId]
    )

    if (existingEmail.rows.length > 0) {
      return NextResponse.json(
        { error: 'Bu e-posta adresi başka bir şirket tarafından kullanılıyor' },
        { status: 400 }
      )
    }

    // Update company information
    await query(
      `UPDATE companies
       SET name = $1,
           tax_number = $2,
           email = $3,
           phone = $4,
           address = $5,
           contact_person = $6,
           website = $7,
           description = $8,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $9`,
      [name, tax_number, email, phone, address, contact_person, website, description, companyId]
    )

    return NextResponse.json(
      { message: 'Firma bilgileri başarıyla güncellendi' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Company update error:', error)
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    )
  }
}