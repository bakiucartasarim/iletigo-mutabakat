import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'

interface EmailTemplate {
  id: string
  name: string
  subject: string
  content: string
  type: 'reconciliation' | 'reminder' | 'custom'
}

export async function GET() {
  try {
    if (!process.env.DATABASE_URL) {
      // Return empty templates if no database
      return NextResponse.json({
        success: true,
        data: []
      })
    }

    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: false
    })

    try {
      const result = await pool.query(`
        SELECT id, name, subject, content, type, created_at, updated_at
        FROM email_templates
        WHERE is_active = true
        ORDER BY created_at DESC
      `)

      const templates = result.rows.map(row => ({
        id: row.id.toString(),
        name: row.name,
        subject: row.subject,
        content: row.content,
        type: row.type
      }))

      return NextResponse.json({
        success: true,
        data: templates
      })

    } finally {
      await pool.end()
    }

  } catch (error) {
    console.error('Email templates fetch error:', error)
    return NextResponse.json(
      { error: 'Şablonlar getirilemedi' },
      { status: 500 }
    )
  }
}