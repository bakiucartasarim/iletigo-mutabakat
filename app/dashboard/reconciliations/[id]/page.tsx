'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface ExcelRecord {
  id: number
  sira_no: number
  cari_hesap_kodu: string
  cari_hesap_adi: string
  sube: string
  cari_hesap_turu: string
  tutar: number
  birim: string
  borc_alacak: string
  vergi_dairesi: string
  vergi_no: string
  fax_numarasi: string
  ilgili_kisi_eposta: string
  hata: string
  mail_status: string
  created_at: string
}

interface ReconciliationPeriod {
  id: number
  name: string
  start_date: string
  end_date: string
  status: string
  description: string
  created_at: string
}

interface ReconciliationDetail {
  id: number
  period_id: number
  period: string
  status: string
  total_count: number
  matched: number
  unmatched: number
  created_at: string
  updated_at: string
  period_name: string
  period_start_date: string
  period_end_date: string
  period_status: string
  period_description: string
  period_created_at: string
  company_name: string
  user_name: string
  excel_data?: ExcelRecord[]
}

export default function ReconciliationDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [reconciliation, setReconciliation] = useState<ReconciliationDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [sendingMail, setSendingMail] = useState(false)

  const getBorcAlacakStats = () => {
    if (!reconciliation?.excel_data) return { borc: 0, alacak: 0 }

    const borcRecords = reconciliation.excel_data.filter(record =>
      record.borc_alacak && record.borc_alacak.toUpperCase().includes('BORÇ')
    )
    const alacakRecords = reconciliation.excel_data.filter(record =>
      record.borc_alacak && record.borc_alacak.toUpperCase().includes('ALACAK')
    )

    return {
      borc: borcRecords.length,
      alacak: alacakRecords.length
    }
  }

  const stats = getBorcAlacakStats()

  useEffect(() => {
    if (id) {
      fetchReconciliation()
    }
  }, [id])

  const fetchReconciliation = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/reconciliations/${id}`)

      if (!response.ok) {
        throw new Error('Failed to fetch reconciliation')
      }

      const data = await response.json()

      if (data.success) {
        setReconciliation(data.data)
      } else {
        console.error('API Error:', data.error)
      }
    } catch (error) {
      console.error('Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number, currency: string = 'TRY') => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: currency || 'TRY',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  const formatCurrencyWithTL = (amount: number, currency: string = 'TRY', exchangeRate: number = 1) => {
    // Default exchange rates (should be fetched from TCMB API in production)
    const exchangeRates: { [key: string]: number } = {
      'USD': 34.50,
      'EUR': 37.80,
      'GBP': 44.20,
      'TRY': 1,
      'TL': 1
    }

    const rate = exchangeRates[currency?.toUpperCase()] || 1
    const originalAmount = formatCurrency(amount, currency)

    // If not TRY, also show TL equivalent
    if (currency && currency !== 'TRY' && currency !== 'TL') {
      const tlAmount = amount * rate
      const tlFormatted = formatCurrency(tlAmount, 'TRY')
      return (
        <div>
          <div className="font-semibold">{originalAmount}</div>
          <div className="text-xs text-gray-500">≈ {tlFormatted}</div>
        </div>
      )
    }

    return originalAmount
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR')
  }

  const getMailStatusBadge = (status: string) => {
    const styles = {
      gonderilmedi: 'bg-gray-100 text-gray-800 border-gray-200',
      gonderildi: 'bg-green-100 text-green-800 border-green-200',
      hata: 'bg-red-100 text-red-800 border-red-200',
      beklemede: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    }

    const labels = {
      gonderilmedi: 'Gönderilmedi',
      gonderildi: 'Gönderildi',
      hata: 'Hata',
      beklemede: 'Beklemede'
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status] || styles.gonderilmedi}`}>
        {labels[status] || 'Bilinmiyor'}
      </span>
    )
  }

  const getMailStatusStats = () => {
    if (!reconciliation?.excel_data) {
      return {
        gonderilmedi: 0,
        gonderildi: 0,
        hata: 0,
        beklemede: 0
      }
    }

    const stats = {
      gonderilmedi: 0,
      gonderildi: 0,
      hata: 0,
      beklemede: 0
    }

    reconciliation.excel_data.forEach(record => {
      if (record.mail_status && stats.hasOwnProperty(record.mail_status)) {
        stats[record.mail_status]++
      } else {
        stats.gonderilmedi++
      }
    })

    return stats
  }

  const sendAllMails = async () => {
    if (!reconciliation?.excel_data) return

    const unsent = reconciliation.excel_data.filter(record =>
      record.ilgili_kisi_eposta &&
      record.ilgili_kisi_eposta.includes('@') &&
      (!record.mail_status || record.mail_status === 'gonderilmedi')
    )

    if (unsent.length === 0) {
      alert('Gönderilecek mail bulunamadı!')
      return
    }

    if (!confirm(`${unsent.length} adet mail gönderilecek. Devam etmek istiyor musunuz?`)) {
      return
    }

    try {
      setSendingMail(true)

      const response = await fetch(`/api/reconciliations/${id}/send-mails`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          records: unsent.map(record => ({
            id: record.id,
            email: record.ilgili_kisi_eposta,
            cari_hesap_adi: record.cari_hesap_adi,
            tutar: record.tutar,
            borc_alacak: record.borc_alacak
          }))
        }),
      })

      const result = await response.json()

      if (result.success) {
        alert(`${result.sent_count} mail başarıyla gönderildi!`)
        fetchReconciliation()
      } else {
        alert('Mail gönderiminde hata: ' + result.error)
      }
    } catch (error) {
      console.error('Mail gönderim hatası:', error)
      alert('Mail gönderiminde hata oluştu!')
    } finally {
      setSendingMail(false)
    }
  }

  const getTotalAmount = () => {
    if (!reconciliation?.excel_data || reconciliation.excel_data.length === 0) return 0
    return reconciliation.excel_data.reduce((sum, record) => {
      const amount = typeof record.tutar === 'string' ? parseFloat(record.tutar) : record.tutar
      return sum + (isNaN(amount) ? 0 : amount)
    }, 0)
  }

  const getTotalsByCurrency = () => {
    if (!reconciliation?.excel_data || reconciliation.excel_data.length === 0) return {}

    const totals: { [key: string]: number } = {}

    reconciliation.excel_data.forEach(record => {
      const amount = typeof record.tutar === 'string' ? parseFloat(record.tutar) : record.tutar
      const currency = record.birim || 'TRY'

      if (!isNaN(amount)) {
        totals[currency] = (totals[currency] || 0) + amount
      }
    })

    return totals
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!reconciliation) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Mutabakat kaydı bulunamadı</h3>
        <Link
          href="/dashboard/reconciliations"
          className="text-indigo-600 hover:text-indigo-500"
        >
          Mutabakat listesine geri dön
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/dashboard/reconciliations"
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Mutabakat Detayı
            </h1>
            <p className="text-sm text-gray-500">
              {reconciliation.period_name} - {reconciliation.period}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div>
              <p className="text-sm font-medium text-gray-600">Toplam Kayıt</p>
              <p className="text-2xl font-bold text-gray-900">{reconciliation.total_count}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div>
              <p className="text-sm font-medium text-gray-600">Borç Kayıtları</p>
              <p className="text-2xl font-bold text-gray-900">{stats.borc}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div>
              <p className="text-sm font-medium text-gray-600">Alacak Kayıtları</p>
              <p className="text-2xl font-bold text-gray-900">{stats.alacak}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-full">
              <p className="text-sm font-medium text-gray-600 mb-2">Toplam Tutar</p>
              {Object.entries(getTotalsByCurrency()).map(([currency, amount]) => (
                <div key={currency} className="mb-1">
                  <span className="text-lg font-bold text-gray-900">{formatCurrency(amount, currency)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-6 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Genel Bilgiler
            </button>
            <button
              onClick={() => setActiveTab('excel-data')}
              className={`py-4 px-6 border-b-2 font-medium text-sm ${
                activeTab === 'excel-data'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Excel Verileri
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Mutabakat Bilgileri</h3>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Dönem</dt>
                      <dd className="text-sm text-gray-900">{reconciliation.period}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Durum</dt>
                      <dd className="text-sm text-gray-900">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          {reconciliation.status}
                        </span>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Oluşturulma Tarihi</dt>
                      <dd className="text-sm text-gray-900">{formatDate(reconciliation.created_at)}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Güncelleme Tarihi</dt>
                      <dd className="text-sm text-gray-900">{formatDate(reconciliation.updated_at)}</dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Dönem Bilgileri</h3>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Dönem Adı</dt>
                      <dd className="text-sm text-gray-900">{reconciliation.period_name}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Başlangıç Tarihi</dt>
                      <dd className="text-sm text-gray-900">{formatDate(reconciliation.period_start_date)}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Bitiş Tarihi</dt>
                      <dd className="text-sm text-gray-900">{formatDate(reconciliation.period_end_date)}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Açıklama</dt>
                      <dd className="text-sm text-gray-900">{reconciliation.period_description}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Organizasyon Bilgileri</h3>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Şirket</dt>
                    <dd className="text-sm text-gray-900">{reconciliation.company_name}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Kullanıcı</dt>
                    <dd className="text-sm text-gray-900">{reconciliation.user_name}</dd>
                  </div>
                </dl>
              </div>
            </div>
          )}

          {activeTab === 'excel-data' && (
            <div className="space-y-6">
              {/* Mail İşlemleri Section */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Mail İşlemleri</h3>

                {/* Mail Status Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  {(() => {
                    const mailStats = getMailStatusStats()
                    return (
                      <>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-600">{mailStats.gonderilmedi}</div>
                          <div className="text-sm text-gray-500">Gönderilmemiş</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">{mailStats.gonderildi}</div>
                          <div className="text-sm text-gray-500">Gönderildi</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-600">{mailStats.hata}</div>
                          <div className="text-sm text-gray-500">Hata</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-yellow-600">{mailStats.beklemede}</div>
                          <div className="text-sm text-gray-500">Beklemede</div>
                        </div>
                      </>
                    )
                  })()}
                </div>

                {/* Toplu Mail Gönder Button */}
                <button
                  onClick={sendAllMails}
                  disabled={sendingMail}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingMail ? 'Gönderiliyor...' : `Toplu Mail Gönder (${getMailStatusStats().gonderilmedi} gönderilmemiş)`}
                </button>
              </div>

              {/* Excel Data Table */}
              {reconciliation.excel_data && reconciliation.excel_data.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Sıra No
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cari Hesap
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tutar
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          B/A
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Mail
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Mail Durumu
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reconciliation.excel_data.map((record) => (
                        <tr key={record.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.sira_no}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {record.cari_hesap_adi}
                              </div>
                              <div className="text-sm text-gray-500">
                                {record.cari_hesap_kodu}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrencyWithTL(record.tutar, record.birim, 1)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.borc_alacak}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.ilgili_kisi_eposta || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getMailStatusBadge(record.mail_status || 'gonderilmedi')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">Bu mutabakat için henüz Excel verisi yüklenmemiş.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}