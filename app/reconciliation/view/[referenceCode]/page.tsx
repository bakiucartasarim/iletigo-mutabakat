'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'

interface CompanyTemplate {
  template_name: string | null
  header_text: string | null
  intro_text: string | null
  note1: string | null
  note2: string | null
  note3: string | null
  note4: string | null
  note5: string | null
}

interface ReconciliationData {
  reference_code: string
  company_name: string
  company_tax_number: string | null
  company_tax_office: string | null
  company_address: string | null
  company_logo_url: string | null
  company_stamp_url: string | null
  recipient_name: string
  amount: number
  currency: string
  balance_type: string
  reconciliation_period: string
  is_expired: boolean
  is_used: boolean
  response_status: string | null
  company_template: CompanyTemplate
  require_tax_verification: boolean
  require_otp_verification: boolean
}

export default function ReconciliationViewPage() {
  const params = useParams()
  const referenceCode = params.referenceCode as string

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<ReconciliationData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [responseStatus, setResponseStatus] = useState<'mutabik' | 'itiraz' | null>(null)
  const [note, setNote] = useState('')
  const [disputedAmount, setDisputedAmount] = useState('')
  const [disputedCurrency, setDisputedCurrency] = useState('TRY')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // Verification states
  const [verificationStep, setVerificationStep] = useState<'tax' | 'otp' | 'verified'>('tax')
  const [taxNumber, setTaxNumber] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [verificationError, setVerificationError] = useState<string | null>(null)
  const [attemptsRemaining, setAttemptsRemaining] = useState(3)
  const [maskedEmail, setMaskedEmail] = useState<string | null>(null)
  const [otpExpiresIn, setOtpExpiresIn] = useState(300)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const otpSentRef = useRef(false)

  useEffect(() => {
    fetchReconciliationData()

    // Cleanup timer on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [referenceCode])

  const fetchReconciliationData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/reconciliation/verify/${referenceCode}`)

      if (!response.ok) {
        const errorData = await response.json()
        setError(errorData.error || 'Bir hata oluştu')
        return
      }

      const result = await response.json()
      setData(result)

      // Set initial verification step based on company settings
      if (!result.require_tax_verification && !result.require_otp_verification) {
        // No verification required
        setVerificationStep('verified')
      } else if (result.require_tax_verification && result.require_otp_verification) {
        // Both verifications required - start with tax (OTP will be sent after tax verification)
        setVerificationStep('tax')
      } else if (result.require_tax_verification) {
        // Only tax verification required
        setVerificationStep('tax')
      } else if (result.require_otp_verification) {
        // Only OTP verification required - send OTP immediately (but only once)
        setVerificationStep('otp')
        if (!otpSentRef.current) {
          otpSentRef.current = true
          await sendOtpDirectly(referenceCode)
        }
      }
    } catch (err) {
      setError('Bağlantı hatası oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handleTaxVerification = async () => {
    if (taxNumber.length !== 4) {
      setVerificationError('Lütfen 4 haneli sayı giriniz')
      return
    }

    try {
      setVerifying(true)
      setVerificationError(null)

      const response = await fetch(`/api/reconciliation/verify-tax/${referenceCode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taxNumberLast4: taxNumber })
      })

      const result = await response.json()

      if (!response.ok) {
        setVerificationError(result.error)
        if (result.attemptsRemaining !== undefined) {
          setAttemptsRemaining(result.attemptsRemaining)
        }
        return
      }

      // Success - check if OTP is required or if already verified
      if (result.verified) {
        // Tax verification complete, no OTP required
        setVerificationStep('verified')
        setVerificationError(null)
      } else if (data?.require_otp_verification) {
        // Move to OTP step
        setMaskedEmail(result.email)
        setOtpExpiresIn(result.expiresIn || 300)
        setVerificationStep('otp')
        setVerificationError(null)

        // Clear any existing timer
        if (timerRef.current) {
          clearInterval(timerRef.current)
        }

        // Start countdown timer
        timerRef.current = setInterval(() => {
          setOtpExpiresIn(prev => {
            if (prev <= 1) {
              if (timerRef.current) {
                clearInterval(timerRef.current)
                timerRef.current = null
              }
              return 0
            }
            return prev - 1
          })
        }, 1000)
      } else {
        // No OTP required, go directly to verified
        setVerificationStep('verified')
        setVerificationError(null)
      }

    } catch (err) {
      setVerificationError('Bağlantı hatası oluştu')
    } finally {
      setVerifying(false)
    }
  }

  const handleOtpVerification = async () => {
    if (otpCode.length !== 6) {
      setVerificationError('Lütfen 6 haneli kodu giriniz')
      return
    }

    try {
      setVerifying(true)
      setVerificationError(null)

      const response = await fetch(`/api/reconciliation/verify-otp/${referenceCode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otpCode })
      })

      const result = await response.json()

      if (!response.ok) {
        setVerificationError(result.error)
        return
      }

      // Success - show reconciliation content
      setVerificationStep('verified')
      setVerificationError(null)

    } catch (err) {
      setVerificationError('Bağlantı hatası oluştu')
    } finally {
      setVerifying(false)
    }
  }

  const sendOtpDirectly = async (refCode: string) => {
    try {
      console.log('🔄 Sending OTP directly (no tax verification required)')

      const response = await fetch(`/api/reconciliation/send-otp-direct/${refCode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      const result = await response.json()

      if (!response.ok) {
        setVerificationError(result.error || 'OTP gönderilemedi')
        return
      }

      setMaskedEmail(result.email)
      setOtpExpiresIn(result.expiresIn || 300)

      // Clear any existing timer
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }

      // Start countdown timer
      timerRef.current = setInterval(() => {
        setOtpExpiresIn(prev => {
          if (prev <= 1) {
            if (timerRef.current) {
              clearInterval(timerRef.current)
              timerRef.current = null
            }
            return 0
          }
          return prev - 1
        })
      }, 1000)

    } catch (err) {
      console.error('OTP send error:', err)
      setVerificationError('OTP gönderimi sırasında hata oluştu')
    }
  }

  const handleResendOtp = async () => {
    // Clear timer when resending
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    setOtpCode('')
    setVerificationError(null)
    setOtpExpiresIn(300)

    // Resend OTP (always allow manual resend)
    otpSentRef.current = false
    await sendOtpDirectly(referenceCode)
    otpSentRef.current = true
  }

  const handleSubmit = async () => {
    if (!responseStatus) {
      alert('Lütfen bir seçim yapın')
      return
    }

    if (responseStatus === 'itiraz') {
      if (!disputedAmount.trim()) {
        alert('Lütfen doğru tutarı giriniz')
        return
      }
      if (!note.trim()) {
        alert('İtiraz nedeni girmeniz gerekmektedir')
        return
      }
    }

    try {
      setSubmitting(true)
      const response = await fetch(`/api/reconciliation/respond/${referenceCode}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          response_status: responseStatus,
          response_note: note,
          disputed_amount: responseStatus === 'itiraz' ? parseFloat(disputedAmount) : null,
          disputed_currency: responseStatus === 'itiraz' ? disputedCurrency : null
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        alert(errorData.error || 'Bir hata oluştu')
        return
      }

      setSubmitted(true)
    } catch (err) {
      alert('Bağlantı hatası oluştu')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  // Show verification screens if not verified yet
  if (data && verificationStep !== 'verified') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Güvenlik Doğrulama</h2>
            <p className="text-gray-600 text-sm">
              {verificationStep === 'tax'
                ? 'Mutabakat mektubunuzu görüntülemek için lütfen vergi numaranızın son 4 hanesini giriniz'
                : 'Email adresinize gönderilen 6 haneli doğrulama kodunu giriniz'
              }
            </p>
          </div>

          {verificationStep === 'tax' && data.require_tax_verification && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vergi Numarası Son 4 Hane
                </label>
                <input
                  type="text"
                  maxLength={4}
                  value={taxNumber}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '')
                    setTaxNumber(value)
                    setVerificationError(null)
                  }}
                  placeholder="****"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-center text-2xl font-mono tracking-widest"
                  disabled={verifying}
                />
              </div>

              {verificationError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                  <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-red-600">{verificationError}</p>
                </div>
              )}

              {attemptsRemaining < 3 && attemptsRemaining > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-700">
                    ⚠️ Kalan deneme hakkı: {attemptsRemaining}
                  </p>
                </div>
              )}

              <button
                onClick={handleTaxVerification}
                disabled={verifying || taxNumber.length !== 4}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {verifying ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>Doğrulanıyor...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                    <span>Devam Et</span>
                  </>
                )}
              </button>
            </div>
          )}

          {verificationStep === 'otp' && data.require_otp_verification && (
            <div className="space-y-4">
              {maskedEmail && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-blue-700 text-center">
                    📧 Doğrulama kodu <strong>{maskedEmail}</strong> adresine gönderildi
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  6 Haneli Doğrulama Kodu
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '')
                    setOtpCode(value)
                    setVerificationError(null)
                  }}
                  placeholder="000000"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-center text-2xl font-mono tracking-widest"
                  disabled={verifying}
                />
              </div>

              {otpExpiresIn > 0 && (
                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    ⏰ Kod geçerlilik süresi: <span className="font-semibold text-blue-600">{Math.floor(otpExpiresIn / 60)}:{(otpExpiresIn % 60).toString().padStart(2, '0')}</span>
                  </p>
                </div>
              )}

              {verificationError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                  <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-red-600">{verificationError}</p>
                </div>
              )}

              <button
                onClick={handleOtpVerification}
                disabled={verifying || otpCode.length !== 6}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {verifying ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>Doğrulanıyor...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Doğrula</span>
                  </>
                )}
              </button>

              <button
                onClick={handleResendOtp}
                className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium py-2"
              >
                Yeni kod gönder
              </button>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-500">
              🔒 Kişisel verilerinizin güvenliği için iki aşamalı doğrulama yapılmaktadır
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Hata</h2>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return null
  }

  // Helper function to replace template variables
  const replaceVariables = (text: string) => {
    if (!text) return ''
    const formattedAmount = data.amount.toLocaleString('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) + ' ' + (data.currency || 'TRY')

    return text
      .replace(/%DÖNEM%/g, new Date(data.reconciliation_period).toLocaleDateString('tr-TR'))
      .replace(/%TUTAR%/g, formattedAmount)
      .replace(/%BORÇALACAK%/g, data.balance_type)
      .replace(/%CARİ_HESAP%/g, data.recipient_name)
      .replace(/%ŞİRKET%/g, data.company_name)
  }

  const primaryColor = '#2563eb'
  const secondaryColor = '#4f46e5'

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Başarılı!</h2>
            <p className="text-gray-600 mb-4">
              {responseStatus === 'mutabik'
                ? 'Mutabakat onayınız başarıyla kaydedildi. Teşekkür ederiz.'
                : 'İtirazınız başarıyla kaydedildi. En kısa sürede sizinle iletişime geçilecektir.'}
            </p>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Referans Kodu:</p>
              <p className="text-xs font-mono text-gray-700 break-all">{data.reference_code}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Mutabakat Mektubu - Letter Style - Left (2/3) */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow-lg">
          {/* Logo Header */}
          <div className="border-b-2 border-gray-200 p-6">
            <div className="flex items-center">
              {data.company_logo_url ? (
                <img
                  src={data.company_logo_url}
                  alt={data.company_name}
                  className="h-16 w-auto object-contain"
                />
              ) : (
                <>
                  <svg className="w-12 h-12 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 18c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z"/>
                  </svg>
                  <span className="ml-3 text-xl font-bold text-gray-800">{data.company_name}</span>
                </>
              )}
            </div>
          </div>

          {/* Document Title */}
          <div className="border-4 border-black p-4 mx-6 mt-8 text-center">
            <h1 className="text-2xl font-bold">MUTABAKAT MEKTUBU</h1>
            <p className="text-sm mt-2">Referans Kodu: <span className="font-semibold">{data.reference_code}</span></p>
          </div>

          {/* Blue Line */}
          <div className="h-1 bg-blue-600 mx-6 mt-4"></div>

          {/* Letter Content */}
          <div className="p-8 space-y-6">
            {/* Greeting and Intro */}
            <div>
              <p className="mb-4">
                Sayın, <span className="font-semibold">{data.recipient_name}</span>
              </p>
              <p className="mb-2">
                <strong>TARİH:</strong> {new Date(data.reconciliation_period).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
              {data.company_template?.intro_text && (
                <p className="leading-relaxed">
                  {replaceVariables(data.company_template.intro_text)}
                </p>
              )}
            </div>

            {/* Form Table */}
            <div className="border border-gray-300">
              <table className="w-full">
                <tbody>
                  <tr className="border-b border-gray-300">
                    <td className="bg-gray-50 px-4 py-3 font-semibold w-1/3">Form</td>
                    <td className="px-4 py-3">{data.company_template?.template_name || 'İletigo Mutabakat'}</td>
                  </tr>
                  <tr className="border-b border-gray-300">
                    <td className="bg-gray-50 px-4 py-3 font-semibold">Dönemi</td>
                    <td className="px-4 py-3">
                      {new Date(data.reconciliation_period).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </td>
                  </tr>
                  <tr>
                    <td className="bg-gray-50 px-4 py-3 font-semibold">Bakiye</td>
                    <td className="px-4 py-3">
                      {data.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {data.currency || 'TRY'} -
                      <span className={`ml-2 font-semibold ${data.balance_type === 'Borç' ? 'text-red-600' : 'text-green-600'}`}>
                        {data.balance_type?.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Company Info */}
            <div className="border-l-4 border-blue-600 pl-4">
              <p className="font-semibold text-gray-800">{data.company_name}</p>
              {data.company_tax_number && (
                <p className="text-sm text-gray-600">Vergi Numarası: {data.company_tax_number}</p>
              )}
              {data.company_tax_office && (
                <p className="text-sm text-gray-600">Vergi Dairesi: {data.company_tax_office}</p>
              )}
              {data.company_address && (
                <p className="text-sm text-gray-600">Adres: {data.company_address}</p>
              )}
            </div>

            {/* Notes Section */}
            {(data.company_template?.note1 || data.company_template?.note2 || data.company_template?.note3 ||
              data.company_template?.note4 || data.company_template?.note5) && (
              <div className="border border-gray-300 p-6">
                <h3 className="text-lg font-bold mb-4 text-blue-600">Mutabakat Notları</h3>
                <ol className="space-y-2 text-sm text-gray-700">
                  {data.company_template.note1 && (
                    <li className="flex">
                      <span className="mr-2 font-semibold">1.</span>
                      <span>{replaceVariables(data.company_template.note1)}</span>
                    </li>
                  )}
                  {data.company_template.note2 && (
                    <li className="flex">
                      <span className="mr-2 font-semibold">2.</span>
                      <span>{replaceVariables(data.company_template.note2)}</span>
                    </li>
                  )}
                  {data.company_template.note3 && (
                    <li className="flex">
                      <span className="mr-2 font-semibold">3.</span>
                      <span>{replaceVariables(data.company_template.note3)}</span>
                    </li>
                  )}
                  {data.company_template.note4 && (
                    <li className="flex">
                      <span className="mr-2 font-semibold">4.</span>
                      <span>{replaceVariables(data.company_template.note4)}</span>
                    </li>
                  )}
                  {data.company_template.note5 && (
                    <li className="flex">
                      <span className="mr-2 font-semibold">5.</span>
                      <span>{replaceVariables(data.company_template.note5)}</span>
                    </li>
                  )}
                </ol>
              </div>
            )}

            {/* Company Stamp - Bottom Right */}
            {data.company_stamp_url && (
              <div className="flex justify-end mt-8">
                <div className="text-center">
                  <img
                    src={data.company_stamp_url}
                    alt="Şirket Kaşesi"
                    className="h-32 w-auto object-contain"
                  />
                  <p className="text-xs text-gray-500 mt-2">{data.company_name}</p>
                </div>
              </div>
            )}
          </div>
        </div>
          </div>

          {/* Response Section - Right Side (1/3) */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow-lg p-8 sticky top-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Yanıtınız</h2>

          {/* Response Section */}
          {!data.is_used && !data.is_expired && (
            <div>
              <div className="space-y-4">
                {/* Radio Options */}
                <div className="space-y-3">
                  <button
                    onClick={() => setResponseStatus('mutabik')}
                    className={`w-full p-4 rounded-lg border-2 transition-all duration-200 ${
                      responseStatus === 'mutabik'
                        ? 'border-green-600 bg-green-50 shadow-lg'
                        : 'border-gray-300 hover:border-green-400 hover:shadow'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className={`w-12 h-12 rounded-full border-4 flex items-center justify-center mr-3 ${
                        responseStatus === 'mutabik' ? 'border-green-600 bg-green-600' : 'border-gray-400'
                      }`}>
                        {responseStatus === 'mutabik' ? (
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <div className="text-left">
                        <p className="text-lg font-bold text-gray-900">Mutabıkım</p>
                        <p className="text-xs text-gray-600">Bakiye doğru</p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setResponseStatus('itiraz')}
                    className={`w-full p-4 rounded-lg border-2 transition-all duration-200 ${
                      responseStatus === 'itiraz'
                        ? 'border-red-600 bg-red-50 shadow-lg'
                        : 'border-gray-300 hover:border-red-400 hover:shadow'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className={`w-12 h-12 rounded-full border-4 flex items-center justify-center mr-3 ${
                        responseStatus === 'itiraz' ? 'border-red-600 bg-red-600' : 'border-gray-400'
                      }`}>
                        {responseStatus === 'itiraz' ? (
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        ) : (
                          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                      </div>
                      <div className="text-left">
                        <p className="text-lg font-bold text-gray-900">İtiraz Ediyorum</p>
                        <p className="text-xs text-gray-600">Bakiye hatalı</p>
                      </div>
                    </div>
                  </button>
                </div>

                {/* Amount and Note Fields (shown when itiraz is selected) */}
                {responseStatus === 'itiraz' && (
                  <div className="animate-fadeIn space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Doğru Tutar (Zorunlu)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          step="0.01"
                          value={disputedAmount}
                          onChange={(e) => setDisputedAmount(e.target.value)}
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Örn: 2555.00"
                        />
                        <select
                          value={disputedCurrency}
                          onChange={(e) => setDisputedCurrency(e.target.value)}
                          className="w-24 px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="TRY">TRY</option>
                          <option value="USD">USD</option>
                          <option value="EUR">EUR</option>
                          <option value="GBP">GBP</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        İtiraz Nedeni (Zorunlu)
                      </label>
                      <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Lütfen itiraz nedeninizi detaylı olarak açıklayınız..."
                      />
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !responseStatus}
                  className={`w-full py-4 px-6 rounded-lg text-base font-bold text-white transition-all duration-200 shadow-lg hover:shadow-xl mt-4 ${
                    submitting || !responseStatus
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {submitting ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Gönderiliyor...
                    </span>
                  ) : (
                    'Yanıtı Gönder'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Already Responded */}
          {data.is_used && data.response_status && (
            <div className={`p-4 rounded-xl ${
              data.response_status === 'mutabik' ? 'bg-green-50' : 'bg-yellow-50'
            }`}>
              <p className="font-semibold text-gray-900 mb-2">
                {data.response_status === 'mutabik' ? '✓ Mutabık kalındı' : '⚠ İtiraz edildi'}
              </p>
              <p className="text-sm text-gray-600">
                Bu mutabakat talebi için zaten yanıt verilmiştir.
              </p>
            </div>
          )}

          {/* Expired */}
          {data.is_expired && !data.is_used && (
            <div className="p-4 rounded-xl bg-red-50">
              <p className="font-semibold text-red-900 mb-2">⚠ Süre Doldu</p>
              <p className="text-sm text-red-700">
                Bu mutabakat talebi için yanıt verme süresi dolmuştur. Lütfen gönderen şirketle iletişime geçin.
              </p>
            </div>
          )}

          {/* Footer Info */}
          <div className="mt-6 text-center text-xs text-gray-500 bg-blue-50 p-3 rounded-lg">
            <p className="font-semibold">ℹ️ Bilgilendirme</p>
            <p className="mt-1">Bu link 30 gün boyunca geçerlidir.</p>
            <p className="mt-1">🔒 Güvenli sayfa</p>
          </div>
        </div>
          </div>
        </div>
      </div>
    </div>
  )
}
