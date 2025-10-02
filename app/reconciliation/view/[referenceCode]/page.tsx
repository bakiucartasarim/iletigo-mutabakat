'use client'

import { useState, useEffect } from 'react'
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
  recipient_name: string
  amount: number
  currency: string
  balance_type: string
  reconciliation_period: string
  is_expired: boolean
  is_used: boolean
  response_status: string | null
  company_template: CompanyTemplate
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
            <p className="text-sm text-gray-500">Referans Kodu: {data.reference_code}</p>
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
              <svg className="w-12 h-12 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 18c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z"/>
              </svg>
              <span className="ml-3 text-xl font-bold text-gray-800">iletigo</span>
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
