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
      // Mock data fallback
      const mockTemplates: EmailTemplate[] = [
        {
          id: '1',
          name: 'Mutabakat Bildirimi',
          subject: 'Cari Hesap Mutabakat Bilgilendirmesi - {{company_name}}',
          content: `Sayın {{customer_name}},

Cari hesap mutabakat bilgileriniz aşağıdaki gibidir:

Hesap Kodu: {{account_code}}
Tutar: {{amount}} TL
Durum: {{status}}
Dönem: {{period}}

Bu bilgileri kontrol ederek, varsa farklılıkları bize bildiriniz.

Saygılarımızla,
{{from_name}}`,
          type: 'reconciliation'
        },
        {
          id: '2',
          name: 'Hatırlatma Emaili',
          subject: 'Mutabakat Onayı Bekliyor - {{company_name}}',
          content: `Sayın {{customer_name}},

Daha önce göndermiş olduğumuz mutabakat bilgileriniz henüz onaylanmamıştır.

Lütfen en kısa sürede kontrol ederek onayınızı iletiniz.

Teşekkürler,
{{from_name}}`,
          type: 'reminder'
        }
      ]

      return NextResponse.json({
        success: true,
        data: mockTemplates
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