import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: { referenceCode: string } }
) {
  try {
    const { referenceCode } = params
    const { otpCode } = await request.json()

    // Validate input
    if (!otpCode || otpCode.length !== 6 || !/^\d{6}$/.test(otpCode)) {
      return NextResponse.json(
        { error: 'Lütfen 6 haneli kodu giriniz' },
        { status: 400 }
      )
    }

    // Fetch reconciliation link
    const result = await query(`
      SELECT * FROM reconciliation_links
      WHERE reference_code = $1
    `, [referenceCode])

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Mutabakat talebi bulunamadı' },
        { status: 404 }
      )
    }

    const linkData = result.rows[0]

    // Check if already verified
    if (linkData.is_verified) {
      return NextResponse.json({
        success: true,
        verified: true,
        message: 'Doğrulama zaten yapılmış'
      })
    }

    // Check if code exists
    if (!linkData.verification_code) {
      return NextResponse.json(
        { error: 'Önce vergi numarası doğrulaması yapmanız gerekiyor' },
        { status: 400 }
      )
    }

    // Check if code expired
    const now = new Date()
    const expiresAt = new Date(linkData.verification_code_expires_at)
    if (now > expiresAt) {
      return NextResponse.json(
        { error: 'Doğrulama kodu süresi dolmuş. Lütfen yeni kod isteyin.' },
        { status: 400 }
      )
    }

    // Verify OTP code
    if (otpCode !== linkData.verification_code) {
      return NextResponse.json(
        { error: 'Doğrulama kodu yanlış. Lütfen tekrar deneyin.' },
        { status: 400 }
      )
    }

    // OTP verified successfully
    await query(`
      UPDATE reconciliation_links
      SET
        is_verified = true,
        verified_at = NOW(),
        verification_code = NULL,
        verification_code_expires_at = NULL,
        updated_at = NOW()
      WHERE id = $1
    `, [linkData.id])

    return NextResponse.json({
      success: true,
      verified: true,
      message: 'Doğrulama başarılı'
    })

  } catch (error) {
    console.error('OTP verification error:', error)
    return NextResponse.json(
      { error: 'Doğrulama sırasında hata oluştu' },
      { status: 500 }
    )
  }
}
