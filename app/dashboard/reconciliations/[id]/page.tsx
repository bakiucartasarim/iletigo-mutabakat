'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import * as XLSX from 'xlsx'

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
  reconciliation_status: string
  disputed_amount: number | null
  disputed_currency: string | null
  response_note: string | null
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
  const [sendingMailId, setSendingMailId] = useState<number | null>(null)
  const [showMailTemplateModal, setShowMailTemplateModal] = useState(false)
  const [showPdfTemplateModal, setShowPdfTemplateModal] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<ExcelRecord | null>(null)

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

  const getReconciliationStatusBadge = (status: string) => {
    const styles = {
      beklemede: 'bg-gray-100 text-gray-800 border-gray-200',
      onaylandi: 'bg-green-100 text-green-800 border-green-200',
      itiraz: 'bg-orange-100 text-orange-800 border-orange-200'
    }

    const labels = {
      beklemede: 'Beklemede',
      onaylandi: 'Mutabık',
      itiraz: 'İtiraz'
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status] || styles.beklemede}`}>
        {labels[status] || 'Beklemede'}
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
      const status = record.mail_status || 'gonderilmedi'
      if (stats.hasOwnProperty(status)) {
        stats[status]++
      } else {
        stats.gonderilmedi++
      }
    })

    return stats
  }

  const getReconciliationStatusStats = () => {
    if (!reconciliation?.excel_data) {
      return {
        beklemede: 0,
        onaylandi: 0,
        itiraz: 0
      }
    }

    const stats = {
      beklemede: 0,
      onaylandi: 0,
      itiraz: 0
    }

    reconciliation.excel_data.forEach(record => {
      const status = record.reconciliation_status || 'beklemede'
      if (stats.hasOwnProperty(status)) {
        stats[status]++
      } else {
        stats.beklemede++
      }
    })

    return stats
  }

  const sendSingleMail = async (record: ExcelRecord) => {
    if (!record.ilgili_kisi_eposta || !record.ilgili_kisi_eposta.includes('@')) {
      alert('Geçerli bir e-posta adresi bulunamadı!')
      return
    }

    if (!confirm(`${record.cari_hesap_adi} için mail gönderilecek. Devam edilsin mi?`)) {
      return
    }

    try {
      setSendingMailId(record.id)

      const response = await fetch(`/api/reconciliations/${id}/send-mails`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          records: [{
            id: record.id,
            sira_no: record.sira_no,
            email: record.ilgili_kisi_eposta,
            cari_hesap_adi: record.cari_hesap_adi,
            tutar: record.tutar,
            borc_alacak: record.borc_alacak
          }]
        }),
      })

      const result = await response.json()

      if (result.success) {
        alert('Mail başarıyla gönderildi!')
        fetchReconciliation()
      } else {
        alert('Mail gönderiminde hata: ' + result.error)
      }
    } catch (error) {
      console.error('Mail gönderim hatası:', error)
      alert('Mail gönderiminde hata oluştu!')
    } finally {
      setSendingMailId(null)
    }
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
            sira_no: record.sira_no,
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

  const downloadExcel = () => {
    if (!reconciliation?.excel_data || reconciliation.excel_data.length === 0) {
      alert('İndirilecek veri bulunamadı!')
      return
    }

    // Reconciliation status label mapping
    const getReconciliationStatusLabel = (status: string) => {
      const labels = {
        beklemede: 'Beklemede',
        onaylandi: 'Mutabık',
        itiraz: 'İtiraz'
      }
      return labels[status] || 'Beklemede'
    }

    // Prepare data for Excel - Mutabakat Durumu should be first column
    const excelData = reconciliation.excel_data.map(record => ({
      'Mutabakat Durumu': getReconciliationStatusLabel(record.reconciliation_status || 'beklemede'),
      'Sıra No': record.sira_no,
      'Cari Hesap Kodu': record.cari_hesap_kodu,
      'Cari Hesap Adı': record.cari_hesap_adi,
      'Şube': record.sube,
      'Cari Hesap Türü': record.cari_hesap_turu,
      'Tutar': record.tutar,
      'Birim': record.birim,
      'Borç/Alacak': record.borc_alacak,
      'İtiraz Tutarı': record.disputed_amount || '',
      'İtiraz Dövizi': record.disputed_currency || '',
      'İtiraz Notu': record.response_note || '',
      'Vergi Dairesi': record.vergi_dairesi,
      'Vergi No': record.vergi_no,
      'Fax Numarası': record.fax_numarasi,
      'İlgili Kişi E-posta': record.ilgili_kisi_eposta
    }))

    // Create workbook
    const worksheet = XLSX.utils.json_to_sheet(excelData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Mutabakat Verileri')

    // Generate filename with period name
    const filename = `Mutabakat_${reconciliation.period_name || 'Veriler'}_${new Date().toISOString().split('T')[0]}.xlsx`

    // Download
    XLSX.writeFile(workbook, filename)
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
    <>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/dashboard/reconciliations"
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-base font-semibold text-gray-900">
              Mutabakat Detayı
            </h1>
          </div>
        </div>
      </div>

      {/* Excel Data Section */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-3">
          <div className="space-y-3">
              {/* Genel Bilgiler - Kompakt */}
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded p-2 border border-indigo-100">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500 block">Dönem:</span>
                    <span className="font-medium text-gray-900">
                      {reconciliation.period && reconciliation.period.match(/^\d{4}-\d{2}-\d{2}$/)
                        ? new Date(reconciliation.period).toLocaleDateString('tr-TR')
                        : reconciliation.period
                      }
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Tarih:</span>
                    <span className="font-medium text-gray-900">{formatDate(reconciliation.period_start_date)} - {formatDate(reconciliation.period_end_date)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Şirket:</span>
                    <span className="font-medium text-gray-900">{reconciliation.company_name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Durum:</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      {reconciliation.status === 'pending' ? 'Beklemede' : reconciliation.status === 'completed' ? 'Tamamlandı' : reconciliation.status === 'approved' ? 'Onaylandı' : reconciliation.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Mail İşlemleri Section */}
              <div className="bg-gray-50 rounded p-2">
                {/* Status Summary - Side by Side */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 mb-2">
                  {/* Mail Status Summary */}
                  <div className="flex items-center gap-2 bg-white p-2 rounded border border-gray-200">
                    <div className="text-xs font-medium text-gray-700">Mail:</div>
                    {(() => {
                      const mailStats = getMailStatusStats()
                      return (
                        <>
                          <div className="flex items-center gap-1">
                            <div className="text-sm font-bold text-gray-600">{mailStats.gonderilmedi}</div>
                            <div className="text-xs text-gray-500">Gönderilmemiş</div>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="text-sm font-bold text-green-600">{mailStats.gonderildi}</div>
                            <div className="text-xs text-gray-500">Gönderildi</div>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="text-sm font-bold text-red-600">{mailStats.hata}</div>
                            <div className="text-xs text-gray-500">Hata</div>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="text-sm font-bold text-yellow-600">{mailStats.beklemede}</div>
                            <div className="text-xs text-gray-500">Beklemede</div>
                          </div>
                        </>
                      )
                    })()}
                  </div>

                  {/* Reconciliation Status Summary */}
                  <div className="flex items-center gap-2 bg-blue-50 p-2 rounded border border-blue-200">
                    <div className="text-xs font-medium text-gray-700">Mutabakat:</div>
                    {(() => {
                      const reconStats = getReconciliationStatusStats()
                      return (
                        <>
                          <div className="flex items-center gap-1">
                            <div className="text-sm font-bold text-gray-600">{reconStats.beklemede}</div>
                            <div className="text-xs text-gray-500">Beklemede</div>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="text-sm font-bold text-green-600">{reconStats.onaylandi}</div>
                            <div className="text-xs text-gray-500">Mutabık</div>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="text-sm font-bold text-orange-600">{reconStats.itiraz}</div>
                            <div className="text-xs text-gray-500">İtiraz</div>
                          </div>
                        </>
                      )
                    })()}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={sendAllMails}
                    disabled={sendingMail}
                    className="bg-indigo-600 text-white px-3 py-1.5 text-sm rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {sendingMail ? 'Gönderiliyor...' : `Toplu Mail Gönder (${getMailStatusStats().gonderilmedi})`}
                  </button>

                  <button
                    onClick={downloadExcel}
                    className="bg-green-600 text-white px-3 py-1.5 text-sm rounded-md hover:bg-green-700 flex items-center gap-1.5"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Excel İndir
                  </button>
                </div>
              </div>

              {/* Excel Data Table */}
              {reconciliation.excel_data && reconciliation.excel_data.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Mutabakat Kodu
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Cari Hesap
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Tutar
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          B/A
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Mail
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Mail Durumu
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Mutabakat Durumu
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Şablonlar
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reconciliation.excel_data.map((record) => {
                        const codePrefix = reconciliation.reconciliation_code_prefix || 'MUT'
                        const mutabakatKodu = `${codePrefix}-${reconciliation.id}-${record.sira_no}`

                        return (
                        <tr key={record.id}>
                          <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-indigo-600">
                            {mutabakatKodu}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div>
                              <div className="text-xs font-medium text-gray-900">
                                {record.cari_hesap_adi}
                              </div>
                              <div className="text-xs text-gray-500">
                                {record.cari_hesap_kodu}
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                            {record.reconciliation_status === 'itiraz' && record.disputed_amount ? (
                              <div>
                                <div className="line-through text-gray-400">
                                  {formatCurrencyWithTL(record.tutar, record.birim, 1)}
                                </div>
                                <div className="font-semibold text-orange-600">
                                  {formatCurrencyWithTL(record.disputed_amount, record.disputed_currency || record.birim, 1)}
                                </div>
                                {record.response_note && (
                                  <div className="text-xs text-gray-500 mt-1 italic">
                                    "{record.response_note}"
                                  </div>
                                )}
                              </div>
                            ) : (
                              formatCurrencyWithTL(record.tutar, record.birim, 1)
                            )}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                            {record.borc_alacak}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                            {record.ilgili_kisi_eposta || '-'}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              {getMailStatusBadge(record.mail_status || 'gonderilmedi')}
                              {(!record.mail_status || record.mail_status === 'gonderilmedi' || record.mail_status === 'hata') &&
                               record.ilgili_kisi_eposta &&
                               record.ilgili_kisi_eposta.includes('@') && (
                                <button
                                  onClick={() => sendSingleMail(record)}
                                  disabled={sendingMailId === record.id}
                                  className={`p-1 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                    record.mail_status === 'hata'
                                      ? 'text-red-600 hover:text-red-800 hover:bg-red-50'
                                      : 'text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50'
                                  }`}
                                  title={record.mail_status === 'hata' ? 'Yeniden Gönder' : 'Mail Gönder'}
                                >
                                  {sendingMailId === record.id ? (
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                  ) : (
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                  )}
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            {getReconciliationStatusBadge(record.reconciliation_status || 'beklemede')}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {/* Mail Template Icon */}
                              <button
                                onClick={() => {
                                  setSelectedRecord(record)
                                  setShowMailTemplateModal(true)
                                }}
                                className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                                title="Mail Şablonu Önizle"
                              >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                              </button>

                              {/* PDF Template Icon */}
                              <button
                                onClick={() => {
                                  setSelectedRecord(record)
                                  setShowPdfTemplateModal(true)
                                }}
                                className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                                title="PDF Şablonu Önizle"
                              >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">Bu mutabakat için henüz Excel verisi yüklenmemiş.</p>
                </div>
              )}
            </div>
        </div>
      </div>
    </div>

    {/* Mail Template Preview Modal */}
    {showMailTemplateModal && selectedRecord && reconciliation && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-semibold">Mail Şablonu Önizleme</h3>
            <button
              onClick={() => {
                setShowMailTemplateModal(false)
                setSelectedRecord(null)
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="p-6 overflow-y-auto">
            <div className="bg-gray-50 rounded p-4 mb-4">
              <div className="text-sm text-gray-600 mb-2">
                <strong>Cari Hesap:</strong> {selectedRecord.cari_hesap_adi}
              </div>
              <div className="text-sm text-gray-600 mb-2">
                <strong>Tutar:</strong> {selectedRecord.tutar} {selectedRecord.birim}
              </div>
              <div className="text-sm text-gray-600">
                <strong>Mutabakat Kodu:</strong> {reconciliation.reconciliation_code_prefix || 'MUT'}-{reconciliation.id}-{selectedRecord.sira_no}
              </div>
            </div>
            <div className="border rounded p-4 bg-white">
              <div className="mb-4">
                <div className="text-sm font-semibold text-gray-700 mb-2">Konu:</div>
                <div className="text-gray-900">Mutabakat Mektubu - {reconciliation.reconciliation_code_prefix || 'MUT'}-{reconciliation.id}-{selectedRecord.sira_no} - {reconciliation.period}</div>
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-700 mb-2">İçerik:</div>
                <div className="prose max-w-none">
                  <p>Sayın {selectedRecord.cari_hesap_adi},</p>
                  <p>{reconciliation.period} dönemi için mutabakat mektubumuz ektedir.</p>
                  <p>Cari hesabınızın {reconciliation.period} tarihi itibariyle bakiyesi <strong>{selectedRecord.tutar} {selectedRecord.birim} {selectedRecord.borc_alacak}</strong> olarak görünmektedir.</p>
                  <p>Mutabakat Belge No: <strong>{reconciliation.reconciliation_code_prefix || 'MUT'}-{reconciliation.id}-{selectedRecord.sira_no}</strong></p>
                  <p>Lütfen mutabakat linkine tıklayarak onaylayınız.</p>
                  <p className="mt-4">Saygılarımızla,<br/>{reconciliation.company_name}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="p-4 border-t bg-gray-50 flex justify-end">
            <button
              onClick={() => {
                setShowMailTemplateModal(false)
                setSelectedRecord(null)
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Kapat
            </button>
          </div>
        </div>
      </div>
    )}

    {/* PDF Template Preview Modal */}
    {showPdfTemplateModal && selectedRecord && reconciliation && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-semibold">PDF Şablonu Önizleme</h3>
            <button
              onClick={() => {
                setShowPdfTemplateModal(false)
                setSelectedRecord(null)
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="p-6 overflow-y-auto">
            <div className="bg-white border-4 border-black p-8">
              <div className="border-b-2 border-gray-200 pb-4 mb-6">
                <h1 className="text-2xl font-bold text-center">MUTABAKAT MEKTUBU</h1>
                <p className="text-sm text-center mt-2">Mutabakat Kodu: <span className="font-semibold">{reconciliation.reconciliation_code_prefix || 'MUT'}-{reconciliation.id}-{selectedRecord.sira_no}</span></p>
              </div>

              <div className="mb-6">
                <p className="mb-4">Sayın, <span className="font-semibold">{selectedRecord.cari_hesap_adi}</span></p>
                <p className="mb-2"><strong>TARİH:</strong> {new Date(reconciliation.period).toLocaleDateString('tr-TR')}</p>
                <p className="leading-relaxed">
                  Giriş metnindeki cari hesabımız {new Date(reconciliation.period).toLocaleDateString('tr-TR')} tarihi itibarıyle {selectedRecord.tutar.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {selectedRecord.birim} {selectedRecord.borc_alacak} bakiyesi vermektedir. Mutabakat Belge No: {reconciliation.reconciliation_code_prefix || 'MUT'}-{reconciliation.id}-{selectedRecord.sira_no}
                </p>
              </div>

              <div className="border border-gray-300 mb-6">
                <table className="w-full">
                  <tbody>
                    <tr className="border-b border-gray-300">
                      <td className="bg-gray-50 px-4 py-3 font-semibold w-1/3">Form</td>
                      <td className="px-4 py-3">Cari Mutabakat Formu</td>
                    </tr>
                    <tr className="border-b border-gray-300">
                      <td className="bg-gray-50 px-4 py-3 font-semibold">Dönemi</td>
                      <td className="px-4 py-3">{new Date(reconciliation.period).toLocaleDateString('tr-TR')}</td>
                    </tr>
                    <tr>
                      <td className="bg-gray-50 px-4 py-3 font-semibold">Bakiye</td>
                      <td className="px-4 py-3">
                        {selectedRecord.tutar.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {selectedRecord.birim} -
                        <span className={`ml-2 font-semibold ${selectedRecord.borc_alacak === 'Borç' ? 'text-red-600' : 'text-green-600'}`}>
                          {selectedRecord.borc_alacak?.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="border-l-4 border-blue-600 pl-4 mb-6">
                <p className="font-semibold text-gray-800">{reconciliation.company_name}</p>
              </div>

              <div className="border border-gray-300 p-4 bg-gray-50">
                <p className="text-sm text-gray-700">
                  Mutabık olmanız durumunda firma@firma.com adresine e-posta olarak göndermenizi rica ederiz.
                </p>
              </div>
            </div>
          </div>
          <div className="p-4 border-t bg-gray-50 flex justify-end">
            <button
              onClick={() => {
                setShowPdfTemplateModal(false)
                setSelectedRecord(null)
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Kapat
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}