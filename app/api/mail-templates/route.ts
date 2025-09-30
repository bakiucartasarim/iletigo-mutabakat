import { NextRequest, NextResponse } from 'next/server'
import { Client } from 'pg'

const getDbClient = () => {
  return new Client({
    connectionString: process.env.DATABASE_URL
  })
}

/**
 * GET /api/mail-templates
 * Fetch email templates for a specific company
 */
export async function GET(request: NextRequest) {
  const client = getDbClient()

  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('company_id')

    if (!companyId) {
      return NextResponse.json(
        { error: 'company_id parametresi gereklidir' },
        { status: 400 }
      )
    }

    await client.connect()

    const result = await client.query(
      `SELECT id, company_id, name, subject, content, variables, is_active, created_at, updated_at
       FROM email_templates
       WHERE company_id = $1
       ORDER BY created_at DESC`,
      [companyId]
    )

    return NextResponse.json({
      success: true,
      data: result.rows
    })

  } catch (error: any) {
    console.error('❌ Error fetching templates:', error)
    return NextResponse.json(
      { error: 'Şablonlar yüklenemedi', details: error.message },
      { status: 500 }
    )
  } finally {
    await client.end()
  }
}

/**
 * POST /api/mail-templates
 * Create a new email template
 */
export async function POST(request: NextRequest) {
  const client = getDbClient()

  try {
    const { company_id, name, subject, content, variables, is_active } = await request.json()

    if (!company_id || !name || !subject || !content) {
      return NextResponse.json(
        { error: 'company_id, name, subject ve content alanları gereklidir' },
        { status: 400 }
      )
    }

    await client.connect()

    // Extract variables from content (find all {{variable}} patterns)
    const variableMatches = content.match(/\{\{(\w+)\}\}/g) || []
    const extractedVariables = variableMatches.map((v: string) => v.replace(/[{}]/g, ''))
    const finalVariables = variables || extractedVariables

    const result = await client.query(
      `INSERT INTO email_templates (company_id, name, subject, content, variables, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [company_id, name, subject, content, JSON.stringify(finalVariables), is_active !== false]
    )

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'Şablon başarıyla oluşturuldu'
    })

  } catch (error: any) {
    console.error('❌ Error creating template:', error)
    return NextResponse.json(
      { error: 'Şablon oluşturulamadı', details: error.message },
      { status: 500 }
    )
  } finally {
    await client.end()
  }
}

/**
 * PUT /api/mail-templates
 * Update an existing email template
 */
export async function PUT(request: NextRequest) {
  const client = getDbClient()

  try {
    const { id, company_id, name, subject, content, variables, is_active } = await request.json()

    if (!id || !company_id) {
      return NextResponse.json(
        { error: 'id ve company_id alanları gereklidir' },
        { status: 400 }
      )
    }

    await client.connect()

    // Extract variables if content is provided
    let finalVariables = variables
    if (content) {
      const variableMatches = content.match(/\{\{(\w+)\}\}/g) || []
      const extractedVariables = variableMatches.map((v: string) => v.replace(/[{}]/g, ''))
      finalVariables = variables || extractedVariables
    }

    // Build dynamic update query
    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`)
      values.push(name)
    }
    if (subject !== undefined) {
      updates.push(`subject = $${paramIndex++}`)
      values.push(subject)
    }
    if (content !== undefined) {
      updates.push(`content = $${paramIndex++}`)
      values.push(content)
    }
    if (finalVariables !== undefined) {
      updates.push(`variables = $${paramIndex++}`)
      values.push(JSON.stringify(finalVariables))
    }
    if (is_active !== undefined) {
      updates.push(`is_active = $${paramIndex++}`)
      values.push(is_active)
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'Güncellenecek alan bulunamadı' },
        { status: 400 }
      )
    }

    values.push(id, company_id)

    const result = await client.query(
      `UPDATE email_templates
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex++} AND company_id = $${paramIndex++}
       RETURNING *`,
      values
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Şablon bulunamadı veya bu şirkete ait değil' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'Şablon başarıyla güncellendi'
    })

  } catch (error: any) {
    console.error('❌ Error updating template:', error)
    return NextResponse.json(
      { error: 'Şablon güncellenemedi', details: error.message },
      { status: 500 }
    )
  } finally {
    await client.end()
  }
}

/**
 * DELETE /api/mail-templates
 * Delete an email template
 */
export async function DELETE(request: NextRequest) {
  const client = getDbClient()

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const companyId = searchParams.get('company_id')

    if (!id || !companyId) {
      return NextResponse.json(
        { error: 'id ve company_id parametreleri gereklidir' },
        { status: 400 }
      )
    }

    await client.connect()

    const result = await client.query(
      `DELETE FROM email_templates
       WHERE id = $1 AND company_id = $2
       RETURNING id`,
      [id, companyId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Şablon bulunamadı veya bu şirkete ait değil' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Şablon başarıyla silindi'
    })

  } catch (error: any) {
    console.error('❌ Error deleting template:', error)
    return NextResponse.json(
      { error: 'Şablon silinemedi', details: error.message },
      { status: 500 }
    )
  } finally {
    await client.end()
  }
}
