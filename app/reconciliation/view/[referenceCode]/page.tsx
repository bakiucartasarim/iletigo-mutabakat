'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

interface ReconciliationData {
  reference_code: string
  company_name: string
  recipient_name: string
  amount: number
  balance_type: string
  reconciliation_period: string
  is_expired: boolean
  is_used: boolean
  response_status: string | null
}

export default function ReconciliationViewPage() {
  const params = useParams()
  const referenceCode = params.referenceCode as string

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<ReconciliationData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [responseStatus, setResponseStatus] = useState<'mutabik' | 'itiraz' | null>(null)
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    fetchReconciliationData()
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
    } catch (err) {
      setError('Bağlantı hatası oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!responseStatus) {
      alert('Lütfen bir seçim yapın')
      return
    }

    if (responseStatus === 'itiraz' && !note.trim()) {
      alert('İtiraz nedeni girmeniz gerekmektedir')
      return
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
          response_note: note
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
            <p className="text-sm text-gray-500">Referans Kodu: {data.reference_code}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Cari Hesap Mutabakatı</h1>
          <p className="text-gray-600">Lütfen aşağıdaki bilgileri kontrol ediniz</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Company Info */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
            <p className="text-sm font-medium opacity-90 mb-1">Gönderen Şirket</p>
            <h2 className="text-2xl font-bold">{data.company_name}</h2>
          </div>

          {/* Reconciliation Details */}
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-600 mb-1">Cari Hesap Adı</p>
                <p className="text-lg font-semibold text-gray-900">{data.recipient_name}</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-600 mb-1">Referans Kodu</p>
                <p className="text-lg font-mono font-semibold text-gray-900">{data.reference_code}</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-600 mb-1">Mutabakat Dönemi</p>
                <p className="text-lg font-semibold text-gray-900">
                  {new Date(data.reconciliation_period).toLocaleDateString('tr-TR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-600 mb-1">Bakiye</p>
                <p className="text-lg font-semibold text-gray-900">
                  {data.amount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                  <span className={`ml-2 text-sm ${data.balance_type === 'Borç' ? 'text-red-600' : 'text-green-600'}`}>
                    ({data.balance_type})
                  </span>
                </p>
              </div>
            </div>

            {/* Response Section */}
            {!data.is_used && !data.is_expired && (
              <div className="mt-8 border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Yanıtınız</h3>

                <div className="space-y-4">
                  {/* Radio Options */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      onClick={() => setResponseStatus('mutabik')}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                        responseStatus === 'mutabik'
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-green-300'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 ${
                          responseStatus === 'mutabik' ? 'border-green-500' : 'border-gray-400'
                        }`}>
                          {responseStatus === 'mutabik' && (
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                          )}
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-gray-900">Mutabıkım</p>
                          <p className="text-sm text-gray-600">Bakiye doğru</p>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => setResponseStatus('itiraz')}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                        responseStatus === 'itiraz'
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-200 hover:border-red-300'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 ${
                          responseStatus === 'itiraz' ? 'border-red-500' : 'border-gray-400'
                        }`}>
                          {responseStatus === 'itiraz' && (
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                          )}
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-gray-900">İtiraz Ediyorum</p>
                          <p className="text-sm text-gray-600">Bakiye hatalı</p>
                        </div>
                      </div>
                    </button>
                  </div>

                  {/* Note Field (shown when itiraz is selected) */}
                  {responseStatus === 'itiraz' && (
                    <div className="animate-fadeIn">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        İtiraz Nedeni (Zorunlu)
                      </label>
                      <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Lütfen itiraz nedeninizi detaylı olarak açıklayınız..."
                      />
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    onClick={handleSubmit}
                    disabled={submitting || !responseStatus}
                    className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 ${
                      submitting || !responseStatus
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl'
                    }`}
                  >
                    {submitting ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
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
              <div className={`mt-8 p-4 rounded-xl ${
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
              <div className="mt-8 p-4 rounded-xl bg-red-50">
                <p className="font-semibold text-red-900 mb-2">⚠ Süre Doldu</p>
                <p className="text-sm text-red-700">
                  Bu mutabakat talebi için yanıt verme süresi dolmuştur. Lütfen gönderen şirketle iletişime geçin.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Bu link 30 gün boyunca geçerlidir.</p>
          <p className="mt-2">Bu sayfa güvenli bir şekilde şifrelenmiştir 🔒</p>
        </div>
      </div>
    </div>
  )
}
