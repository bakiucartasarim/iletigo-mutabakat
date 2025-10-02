import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

// Simple rate limiting using in-memory store (for production, use Redis)
const rateLimitStore = new Map<string, { count: number; timestamp: number }>()
const RATE_LIMIT_WINDOW = 60000 // 1 minute
const MAX_REQUESTS = 5

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const record = rateLimitStore.get(ip)

  if (!record || now - record.timestamp > RATE_LIMIT_WINDOW) {
    rateLimitStore.set(ip, { count: 1, timestamp: now })
    return true
  }

  if (record.count >= MAX_REQUESTS) {
    return false
  }

  record.count++
  return true
}

export async function POST(
  request: NextRequest,
  { params }: { params: { referenceCode: string } }
) {
  try {
    const { referenceCode } = params
    const { response_status, response_note, disputed_amount, disputed_currency } = await request.json()

    // Get IP address for security logging and rate limiting
    const ip = request.headers.get('x-forwarded-for') ||
               request.headers.get('x-real-ip') ||
               'unknown'

    // Rate limiting
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Çok fazla istek gönderdiniz. Lütfen bir dakika bekleyin.' },
        { status: 429 }
      )
    }

    // Get user agent for security logging
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Validate reference code format
    if (!referenceCode || !referenceCode.startsWith('MUT-')) {
      return NextResponse.json(
        { error: 'Geçersiz referans kodu' },
        { status: 400 }
      )
    }

    // Validate response status
    if (!response_status || !['mutabik', 'itiraz'].includes(response_status)) {
      return NextResponse.json(
        { error: 'Geçersiz yanıt durumu' },
        { status: 400 }
      )
    }

    // If itiraz, note and disputed amount are required
    if (response_status === 'itiraz') {
      if (!disputed_amount || isNaN(parseFloat(disputed_amount))) {
        return NextResponse.json(
          { error: 'Doğru tutar zorunludur' },
          { status: 400 }
        )
      }
      if (!response_note || !response_note.trim()) {
        return NextResponse.json(
          { error: 'İtiraz nedeni zorunludur' },
          { status: 400 }
        )
      }
    }

    // Fetch reconciliation link with security checks
    const linkResult = await query(`
      SELECT * FROM reconciliation_links
      WHERE reference_code = $1
    `, [referenceCode])

    if (linkResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Mutabakat talebi bulunamadı' },
        { status: 404 }
      )
    }

    const linkData = linkResult.rows[0]

    // Check if already used
    if (linkData.is_used) {
      return NextResponse.json(
        { error: 'Bu mutabakat talebi için zaten yanıt verilmiş' },
        { status: 400 }
      )
    }

    // Check if expired
    const now = new Date()
    const expiresAt = new Date(linkData.expires_at)
    if (now > expiresAt || linkData.is_expired) {
      return NextResponse.json(
        { error: 'Bu mutabakat talebi süresi dolmuş' },
        { status: 400 }
      )
    }

    // Update reconciliation link with response
    await query(`
      UPDATE reconciliation_links
      SET
        is_used = true,
        used_at = NOW(),
        response_status = $1,
        response_note = $2,
        disputed_amount = $3,
        disputed_currency = $4,
        ip_address = $5,
        user_agent = $6,
        updated_at = NOW()
      WHERE id = $7
    `, [
      response_status,
      response_note || null,
      disputed_amount ? parseFloat(disputed_amount) : null,
      disputed_currency || null,
      ip,
      userAgent,
      linkData.id
    ])

    // Update reconciliation_excel_data with response status
    await query(`
      UPDATE reconciliation_excel_data
      SET
        reconciliation_status = CASE
          WHEN $1 = 'mutabik' THEN 'onaylandi'
          WHEN $1 = 'itiraz' THEN 'itiraz'
          ELSE reconciliation_status
        END,
        updated_at = NOW()
      WHERE id = $2 AND reconciliation_id = $3
    `, [response_status, linkData.record_id, linkData.reconciliation_id])

    // Log the response for audit
    console.log(`✅ Reconciliation response recorded:`, {
      reference_code: referenceCode,
      status: response_status,
      ip: ip,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      message: response_status === 'mutabik'
        ? 'Mutabakat onayınız başarıyla kaydedildi'
        : 'İtirazınız başarıyla kaydedildi'
    })

  } catch (error) {
    console.error('Response submission error:', error)
    return NextResponse.json(
      { error: 'Yanıt kaydedilirken hata oluştu' },
      { status: 500 }
    )
  }
}
