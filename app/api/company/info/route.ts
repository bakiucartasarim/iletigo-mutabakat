import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Get auth token from cookies
    const authToken = request.cookies.get('auth-token')?.value
    console.log('Company info - auth token:', authToken)

    if (!authToken) {
      return NextResponse.json(
        { error: 'No authentication token' },
        { status: 401 }
      )
    }

    // Extract company ID from auth token (format: user-{id}-{timestamp})
    const tokenParts = authToken.split('-')
    if (tokenParts.length < 2) {
      return NextResponse.json(
        { error: 'Invalid token format' },
        { status: 401 }
      )
    }

    const companyId = tokenParts[1]
    console.log('Fetching company info for ID:', companyId)

    // Get company information
    const companyQuery = `
      SELECT id, name, email, tax_number, contact_person, phone, address, website, description, logo_url, stamp_url, is_active,
             reconciliation_code_prefix, require_tax_verification, require_otp_verification
      FROM companies
      WHERE id = $1 AND is_active = true
    `

    const result = await query(companyQuery, [companyId])
    console.log('Company query result:', result.rows.length, 'rows found')

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      )
    }

    const company = result.rows[0]

    console.log('📸 Company logo_url:', company.logo_url)
    console.log('📸 Company stamp_url:', company.stamp_url)

    return NextResponse.json({
      id: company.id,
      name: company.name,
      email: company.email,
      tax_number: company.tax_number,
      contact_person: company.contact_person,
      phone: company.phone,
      address: company.address,
      website: company.website,
      description: company.description,
      reconciliation_code_prefix: company.reconciliation_code_prefix,
      logo_url: company.logo_url,
      stamp_url: company.stamp_url,
      is_active: company.is_active,
      require_tax_verification: company.require_tax_verification,
      require_otp_verification: company.require_otp_verification
    })

  } catch (error) {
    console.error('Company info error:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}