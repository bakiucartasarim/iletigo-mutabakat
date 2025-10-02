import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: { referenceCode: string } }
) {
  try {
    const { referenceCode } = params
    const { taxNumberLast4 } = await request.json()

    // Validate input
    if (!taxNumberLast4 || taxNumberLast4.length !== 4 || !/^\d{4}$/.test(taxNumberLast4)) {
      return NextResponse.json(
        { error: 'Lütfen 4 haneli sayı giriniz' },
        { status: 400 }
      )
    }

    // Fetch reconciliation link with recipient tax number
    const result = await query(`
      SELECT
        rl.*,
        red.vergi_no as recipient_tax_number,
        red.ilgili_kisi_eposta as recipient_email
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

    // Check if locked due to too many attempts
    if (linkData.verification_locked_until) {
      const lockedUntil = new Date(linkData.verification_locked_until)
      const now = new Date()
      if (now < lockedUntil) {
        const remainingSeconds = Math.ceil((lockedUntil.getTime() - now.getTime()) / 1000)
        return NextResponse.json(
          {
            error: `Çok fazla yanlış deneme. Lütfen ${remainingSeconds} saniye bekleyiniz.`,
            locked: true,
            remainingSeconds
          },
          { status: 429 }
        )
      }
    }

    // Check if already verified
    if (linkData.is_verified) {
      return NextResponse.json({
        success: true,
        verified: true,
        message: 'Doğrulama zaten yapılmış'
      })
    }

    // Verify tax number last 4 digits
    const recipientTaxNumber = linkData.recipient_tax_number?.toString() || ''
    const actualLast4 = recipientTaxNumber.slice(-4)

    if (taxNumberLast4 !== actualLast4) {
      // Increment attempts
      const newAttempts = (linkData.verification_attempts || 0) + 1

      // Lock if 3 or more failed attempts
      let lockUntil = null
      if (newAttempts >= 3) {
        lockUntil = new Date(Date.now() + 60000) // Lock for 1 minute
      }

      await query(`
        UPDATE reconciliation_links
        SET
          verification_attempts = $1,
          verification_locked_until = $2,
          updated_at = NOW()
        WHERE id = $3
      `, [newAttempts, lockUntil, linkData.id])

      if (lockUntil) {
        return NextResponse.json(
          {
            error: 'Çok fazla yanlış deneme. 60 saniye bekleyiniz.',
            locked: true,
            remainingSeconds: 60,
            attemptsRemaining: 0
          },
          { status: 429 }
        )
      }

      return NextResponse.json(
        {
          error: 'Vergi numarası yanlış. Lütfen tekrar deneyin.',
          attemptsRemaining: 3 - newAttempts
        },
        { status: 400 }
      )
    }

    // Tax number verified successfully
    // Generate 6-digit OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
    const codeExpiresAt = new Date(Date.now() + 5 * 60000) // 5 minutes

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

    // Send OTP code via email
    if (linkData.recipient_email) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/send-verification-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: linkData.recipient_email,
            code: otpCode,
            recipientName: linkData.recipient_name
          })
        })
      } catch (emailError) {
        console.error('Email send error:', emailError)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Doğrulama kodu email adresinize gönderildi',
      email: linkData.recipient_email ? `${linkData.recipient_email.substring(0, 3)}***@${linkData.recipient_email.split('@')[1]}` : null,
      expiresIn: 300 // seconds
    })

  } catch (error) {
    console.error('Tax verification error:', error)
    return NextResponse.json(
      { error: 'Doğrulama sırasında hata oluştu' },
      { status: 500 }
    )
  }
}
