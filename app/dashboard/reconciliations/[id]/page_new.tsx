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
  reconciliation_period: ReconciliationPeriod
  excel_data: ExcelRecord[]
  company_name: string
  user_name: string
}

export default function ReconciliationDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [reconciliation, setReconciliation] = useState<ReconciliationDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (id) {
      fetchReconciliation()
    }
  }, [id])

  const fetchReconciliation = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/reconciliations/${id}`)
      if (response.ok) {
        const data = await response.json()
        setReconciliation(data)
      } else {
        console.error('Reconciliation not found')
        router.push('/dashboard/reconciliations')
      }
    } catch (error) {
      console.error('Error fetching reconciliation:', error)
      router.push('/dashboard/reconciliations')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR')
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      resolved: 'bg-green-100 text-green-800 border-green-200',
      disputed: 'bg-red-100 text-red-800 border-red-200',
      cancelled: 'bg-gray-100 text-gray-800 border-gray-200'
    }

    const labels = {
      pending: 'Beklemede',
      resolved: 'Çözüldü',
      disputed: 'İtilaflı',
      cancelled: 'İptal'
    }

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${styles[status as keyof typeof styles] || styles.pending}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    )
  }

  const getTotalAmount = () => {
    if (!reconciliation?.excel_data) return 0
    return reconciliation.excel_data.reduce((sum, record) => sum + (record.tutar || 0), 0)
  }

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

  const stats = getBorcAlacakStats()

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
              Mutabakat Detayı #{reconciliation.id}
            </h1>
            <p className="text-gray-600">{reconciliation.period}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {getStatusBadge(reconciliation.status)}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white/70 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Toplam Kayıt</p>
              <p className="text-2xl font-bold text-gray-900">{reconciliation.total_count}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Toplam Tutar</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(getTotalAmount())}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Borç Kayıtları</p>
              <p className="text-2xl font-bold text-gray-900">{stats.borc}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Alacak Kayıtları</p>
              <p className="text-2xl font-bold text-gray-900">{stats.alacak}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white/70 backdrop-blur-lg rounded-xl border border-white/20">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Genel Bilgiler
            </button>
            <button
              onClick={() => setActiveTab('excel-data')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'excel-data'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Excel Verileri ({reconciliation.excel_data?.length || 0})
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Period Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Dönem Bilgileri</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Dönem Adı</label>
                    <p className="mt-1 text-sm text-gray-900">{reconciliation.reconciliation_period?.name || reconciliation.period}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Durum</label>
                    <div className="mt-1">{getStatusBadge(reconciliation.status)}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Başlangıç Tarihi</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {reconciliation.reconciliation_period?.start_date ? formatDate(reconciliation.reconciliation_period.start_date) : '-'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Bitiş Tarihi</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {reconciliation.reconciliation_period?.end_date ? formatDate(reconciliation.reconciliation_period.end_date) : '-'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Oluşturma Tarihi</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(reconciliation.created_at)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Son Güncelleme</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(reconciliation.updated_at)}</p>
                  </div>
                </div>
              </div>

              {/* Description */}
              {reconciliation.reconciliation_period?.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Açıklama</label>
                  <p className="mt-1 text-sm text-gray-900">{reconciliation.reconciliation_period.description}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'excel-data' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Excel Verileri ({reconciliation.excel_data?.length || 0} kayıt)
              </h3>

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
                          Şube
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tutar
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Borç/Alacak
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          E-posta
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reconciliation.excel_data.map((record, index) => (
                        <tr key={record.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.sira_no}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">{record.cari_hesap_kodu}</div>
                            <div className="text-sm text-gray-500">{record.cari_hesap_adi}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.sube}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(record.tutar)} {record.birim}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              record.borc_alacak?.toUpperCase().includes('BORÇ')
                                ? 'bg-red-100 text-red-800'
                                : record.borc_alacak?.toUpperCase().includes('ALACAK')
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {record.borc_alacak}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.ilgili_kisi_eposta}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Excel verisi bulunamadı</h3>
                  <p className="mt-1 text-sm text-gray-500">Bu mutabakat için henüz Excel verisi yüklenmemiş.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}