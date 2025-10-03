import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: { referenceCode: string } }
) {
  try {
    const { referenceCode } = params

    console.log('📧 Direct OTP request for reference:', referenceCode)

    // Fetch reconciliation link with recipient email
    const result = await query(`
      SELECT
        rl.*,
        red.ilgili_kisi_eposta as recipient_email,
        red.cari_hesap_adi as recipient_name
      FROM reconciliation_links rl
      JOIN reconciliation_excel_data red ON rl.record_id = red.id
      WHERE rl.reference_code = $1
    `, [referenceCode])

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Mutabakat talebi bulunamadı' },
        { status: 404 }
      )
    }

    const linkData = result.rows[0]

    if (!linkData.recipient_email) {
      console.error('❌ No recipient email found')
      return NextResponse.json(
        { error: 'Email adresi bulunamadı' },
        { status: 400 }
      )
    }

    // Generate 6-digit OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
    const codeExpiresAt = new Date(Date.now() + 5 * 60000) // 5 minutes

    console.log('📧 Generated OTP:', otpCode)
    console.log('📧 Expires at:', codeExpiresAt)

    // Save OTP code to database
    await query(`
      UPDATE reconciliation_links
      SET
        verification_code = $1,
        verification_code_expires_at = $2,
        verification_attempts = 0,
        verification_locked_until = NULL,
        updated_at = NOW()
      WHERE id = $3
    `, [otpCode, codeExpiresAt, linkData.id])

    console.log('📧 OTP saved to database')

    // Send OTP code via email
    try {
      console.log('📧 Sending OTP email to:', linkData.recipient_email)

      const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/send-verification-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: linkData.recipient_email,
          code: otpCode,
          recipientName: linkData.recipient_name
        })
      })

      const emailResult = await emailResponse.json()

      if (emailResponse.ok) {
        console.log('✅ OTP email sent successfully:', emailResult)
      } else {
        console.error('❌ OTP email failed:', emailResult)
        return NextResponse.json(
          { error: 'Email gönderilemedi: ' + (emailResult.error || 'Bilinmeyen hata') },
          { status: 500 }
        )
      }
    } catch (emailError) {
      console.error('❌ Email send error:', emailError)
      return NextResponse.json(
        { error: 'Email gönderimi sırasında hata oluştu' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Doğrulama kodu email adresinize gönderildi',
      email: `${linkData.recipient_email.substring(0, 3)}***@${linkData.recipient_email.split('@')[1]}`,
      expiresIn: 300 // seconds
    })

  } catch (error) {
    console.error('Direct OTP send error:', error)
    return NextResponse.json(
      { error: 'OTP gönderimi sırasında hata oluştu' },
      { status: 500 }
    )
  }
}
