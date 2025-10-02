import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { referenceCode: string } }
) {
  try {
    const { referenceCode } = params

    // Validate reference code format
    if (!referenceCode || !referenceCode.startsWith('MUT-')) {
      return NextResponse.json(
        { error: 'Geçersiz referans kodu' },
        { status: 400 }
      )
    }

    // Fetch reconciliation link with security checks
    const result = await query(`
      SELECT
        rl.*,
        r.reconciliation_period,
        c.name as company_name
      FROM reconciliation_links rl
      JOIN reconciliations r ON rl.reconciliation_id = r.id
      JOIN companies c ON r.company_id = c.id
      WHERE rl.reference_code = $1
    `, [referenceCode])

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Mutabakat talebi bulunamadı' },
        { status: 404 }
      )
    }

    const linkData = result.rows[0]

    // Check if expired
    const now = new Date()
    const expiresAt = new Date(linkData.expires_at)
    const isExpired = now > expiresAt

    // Update expired status if needed
    if (isExpired && !linkData.is_expired) {
      await query(`
        UPDATE reconciliation_links
        SET is_expired = true, updated_at = NOW()
        WHERE id = $1
      `, [linkData.id])
    }

    // Return reconciliation data
    return NextResponse.json({
      reference_code: linkData.reference_code,
      company_name: linkData.company_name,
      recipient_name: linkData.recipient_name,
      amount: parseFloat(linkData.amount),
      balance_type: linkData.balance_type,
      reconciliation_period: linkData.reconciliation_period,
      is_expired: isExpired || linkData.is_expired,
      is_used: linkData.is_used,
      response_status: linkData.response_status
    })

  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.json(
      { error: 'Doğrulama sırasında hata oluştu' },
      { status: 500 }
    )
  }
}
