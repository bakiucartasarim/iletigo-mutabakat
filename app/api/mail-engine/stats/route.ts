import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'

interface MailStats {
  totalSent: number
  totalFailed: number
  totalPending: number
  lastSentDate: string
}

export async function GET() {
  try {
    if (!process.env.DATABASE_URL) {
      // Return empty stats if no database
      const emptyStats: MailStats = {
        totalSent: 0,
        totalFailed: 0,
        totalPending: 0,
        lastSentDate: ''
      }

      return NextResponse.json({
        success: true,
        data: emptyStats
      })
    }

    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: false
    })

    try {
      // Get mail statistics from reconciliation_excel_data table
      const statsQuery = `
        SELECT
          COUNT(CASE WHEN mail_status = 'gonderildi' THEN 1 END) as total_sent,
          COUNT(CASE WHEN mail_status = 'hata' THEN 1 END) as total_failed,
          COUNT(CASE WHEN mail_status = 'gonderilmedi' OR mail_status IS NULL THEN 1 END) as total_pending,
          MAX(CASE WHEN mail_status = 'gonderildi' THEN updated_at END) as last_sent_date
        FROM reconciliation_excel_data
        WHERE ilgili_kisi_eposta IS NOT NULL
        AND ilgili_kisi_eposta != ''
      `

      const result = await pool.query(statsQuery)
      const stats = result.rows[0]

      const mailStats: MailStats = {
        totalSent: parseInt(stats.total_sent) || 0,
        totalFailed: parseInt(stats.total_failed) || 0,
        totalPending: parseInt(stats.total_pending) || 0,
        lastSentDate: stats.last_sent_date || ''
      }

      return NextResponse.json({
        success: true,
        data: mailStats
      })

    } finally {
      await pool.end()
    }

  } catch (error) {
    console.error('Mail stats fetch error:', error)
    return NextResponse.json(
      { error: 'İstatistikler getirilemedi' },
      { status: 500 }
    )
  }
}