import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

// GET - Fetch company template
export async function GET(request: NextRequest) {
  try {
    const authToken = request.cookies.get('auth-token')?.value

    if (!authToken) {
      return NextResponse.json(
        { error: 'No authentication token' },
        { status: 401 }
      )
    }

    const tokenParts = authToken.split('-')
    if (tokenParts.length < 2) {
      return NextResponse.json(
        { error: 'Invalid token format' },
        { status: 401 }
      )
    }

    const companyId = tokenParts[1]

    const result = await query(
      `SELECT * FROM company_templates WHERE company_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [companyId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error('Error fetching company template:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}

// POST - Create or update company template
export async function POST(request: NextRequest) {
  try {
    const authToken = request.cookies.get('auth-token')?.value

    if (!authToken) {
      return NextResponse.json(
        { error: 'No authentication token' },
        { status: 401 }
      )
    }

    const tokenParts = authToken.split('-')
    if (tokenParts.length < 2) {
      return NextResponse.json(
        { error: 'Invalid token format' },
        { status: 401 }
      )
    }

    const companyId = tokenParts[1]
    const {
      template_name,
      header_text,
      intro_text,
      note1,
      note2,
      note3,
      note4,
      note5
    } = await request.json()

    // Check if template exists
    const existing = await query(
      'SELECT id FROM company_templates WHERE company_id = $1',
      [companyId]
    )

    let result
    if (existing.rows.length > 0) {
      // Update existing template
      result = await query(
        `UPDATE company_templates
         SET template_name = $1,
             header_text = $2,
             intro_text = $3,
             note1 = $4,
             note2 = $5,
             note3 = $6,
             note4 = $7,
             note5 = $8,
             updated_at = CURRENT_TIMESTAMP
         WHERE company_id = $9
         RETURNING *`,
        [template_name, header_text, intro_text, note1, note2, note3, note4, note5, companyId]
      )
    } else {
      // Create new template
      result = await query(
        `INSERT INTO company_templates
         (company_id, template_name, header_text, intro_text, note1, note2, note3, note4, note5)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [companyId, template_name, header_text, intro_text, note1, note2, note3, note4, note5]
      )
    }

    return NextResponse.json({
      message: 'Template saved successfully',
      data: result.rows[0]
    })
  } catch (error) {
    console.error('Error saving company template:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}
