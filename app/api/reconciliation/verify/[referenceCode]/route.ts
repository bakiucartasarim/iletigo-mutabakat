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

    // Fetch reconciliation link with security checks and company template
    const result = await query(`
      SELECT
        rl.*,
        r.period as reconciliation_period,
        c.name as company_name,
        c.tax_number as company_tax_number,
        c.address as company_address,
        ct.template_name,
        ct.header_text,
        ct.intro_text,
        ct.note1,
        ct.note2,
        ct.note3,
        ct.note4,
        ct.note5,
        red.birim as currency
      FROM reconciliation_links rl
      JOIN reconciliations r ON rl.reconciliation_id = r.id
      JOIN companies c ON r.company_id = c.id
      LEFT JOIN company_templates ct ON c.id = ct.company_id AND ct.is_active = true
      LEFT JOIN reconciliation_excel_data red ON rl.record_id = red.id
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

    // Return reconciliation data with company template
    return NextResponse.json({
      reference_code: linkData.reference_code,
      company_name: linkData.company_name,
      company_tax_number: linkData.company_tax_number,
      company_address: linkData.company_address,
      recipient_name: linkData.recipient_name,
      amount: parseFloat(linkData.amount),
      currency: linkData.currency || 'TRY',
      balance_type: linkData.balance_type,
      reconciliation_period: linkData.reconciliation_period,
      is_expired: isExpired || linkData.is_expired,
      is_used: linkData.is_used,
      response_status: linkData.response_status,
      company_template: {
        template_name: linkData.template_name,
        header_text: linkData.header_text,
        intro_text: linkData.intro_text,
        note1: linkData.note1,
        note2: linkData.note2,
        note3: linkData.note3,
        note4: linkData.note4,
        note5: linkData.note5
      }
    })

  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.json(
      { error: 'Doğrulama sırasında hata oluştu' },
      { status: 500 }
    )
  }
}
