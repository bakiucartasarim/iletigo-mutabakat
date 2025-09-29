import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'

// Update mail status for a specific Excel record
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; excel_id: string } }
) {
  try {
    const { mail_status } = await request.json()
    const { id: reconciliationId, excel_id } = params

    if (!mail_status) {
      return NextResponse.json(
        { error: 'mail_status gereklidir' },
        { status: 400 }
      )
    }

    // Validate mail_status values
    const validStatuses = ['gonderilmedi', 'gonderildi', 'hata', 'beklemede']
    if (!validStatuses.includes(mail_status)) {
      return NextResponse.json(
        { error: 'Geçersiz mail_status değeri' },
        { status: 400 }
      )
    }

    if (!process.env.DATABASE_URL) {
      // Mock mode fallback
      return NextResponse.json({
        success: true,
        message: 'Mail durumu güncellendi (Mock Mode)',
        data: {
          excel_id: parseInt(excel_id),
          mail_status,
          updated_at: new Date().toISOString()
        }
      })
    }

    // Real database operations
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: false
    })

    try {
      const updateQuery = `
        UPDATE reconciliation_excel_data
        SET mail_status = $1, updated_at = NOW()
        WHERE id = $2 AND reconciliation_id = $3
        RETURNING id, mail_status, updated_at
      `

      const result = await pool.query(updateQuery, [mail_status, excel_id, reconciliationId])

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: 'Excel kaydı bulunamadı' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Mail durumu başarıyla güncellendi',
        data: result.rows[0]
      })

    } finally {
      await pool.end()
    }

  } catch (error) {
    console.error('Mail status update error:', error)
    return NextResponse.json(
      { error: 'Mail durumu güncellenirken hata oluştu' },
      { status: 500 }
    )
  }
}

// Bulk update mail status for multiple Excel records
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { excel_ids, mail_status } = await request.json()
    const { id: reconciliationId } = params

    if (!excel_ids || !Array.isArray(excel_ids) || excel_ids.length === 0) {
      return NextResponse.json(
        { error: 'excel_ids dizisi gereklidir' },
        { status: 400 }
      )
    }

    if (!mail_status) {
      return NextResponse.json(
        { error: 'mail_status gereklidir' },
        { status: 400 }
      )
    }

    // Validate mail_status values
    const validStatuses = ['gonderilmedi', 'gonderildi', 'hata', 'beklemede']
    if (!validStatuses.includes(mail_status)) {
      return NextResponse.json(
        { error: 'Geçersiz mail_status değeri' },
        { status: 400 }
      )
    }

    if (!process.env.DATABASE_URL) {
      // Mock mode fallback
      return NextResponse.json({
        success: true,
        message: `${excel_ids.length} kayıt için mail durumu güncellendi (Mock Mode)`,
        data: {
          updated_count: excel_ids.length,
          mail_status,
          updated_at: new Date().toISOString()
        }
      })
    }

    // Real database operations
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: false
    })

    try {
      const placeholders = excel_ids.map((_, index) => `$${index + 3}`).join(', ')
      const updateQuery = `
        UPDATE reconciliation_excel_data
        SET mail_status = $1, updated_at = NOW()
        WHERE reconciliation_id = $2 AND id IN (${placeholders})
        RETURNING id, mail_status, updated_at
      `

      const params = [mail_status, reconciliationId, ...excel_ids]
      const result = await pool.query(updateQuery, params)

      return NextResponse.json({
        success: true,
        message: `${result.rows.length} kayıt için mail durumu başarıyla güncellendi`,
        data: {
          updated_count: result.rows.length,
          mail_status,
          updated_records: result.rows
        }
      })

    } finally {
      await pool.end()
    }

  } catch (error) {
    console.error('Bulk mail status update error:', error)
    return NextResponse.json(
      { error: 'Mail durumları güncellenirken hata oluştu' },
      { status: 500 }
    )
  }
}