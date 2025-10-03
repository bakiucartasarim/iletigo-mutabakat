'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Reconciliation {
  id: number
  reference_number: string
  title: string
  company_name: string
  our_amount: number
  their_amount: number
  difference: number
  currency: string
  status: string
  priority: string
  due_date: string
  assigned_to: string
  created_at: string
  updated_at: string
}

interface ReconciliationResponse {
  data: Reconciliation[]
  pagination: {
    current_page: number
    per_page: number
    total: number
    total_pages: number
  }
  filters: {
    status: string | null
    priority: string | null
    search: string | null
  }
}

export default function ReconciliationsPage() {
  const [reconciliations, setReconciliations] = useState<ReconciliationResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    search: '',
    page: 1
  })

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchInput, page: 1 }))
    }, 500)

    return () => clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    fetchReconciliations()
  }, [filters.status, filters.priority, filters.search, filters.page])

  const fetchReconciliations = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: filters.page.toString(),
        limit: '10',
        ...(filters.status !== 'all' && { status: filters.status }),
        ...(filters.priority !== 'all' && { priority: filters.priority }),
        ...(filters.search && { search: filters.search })
      })
      
      const response = await fetch(`/api/reconciliations?${params}`)
      if (response.ok) {
        const data = await response.json()
        setReconciliations(data)
      }
    } catch (error) {
      console.error('Error fetching reconciliations:', error)
    } finally {
      setLoading(false)
    }
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
      resolved: 'Cozuldu',
      disputed: 'Itilafli',
      cancelled: 'Iptal'
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status as keyof typeof styles] || styles.pending}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    )
  }

  const getPriorityBadge = (priority: string) => {
    const styles = {
      low: 'bg-blue-100 text-blue-800',
      medium: 'bg-orange-100 text-orange-800',
      high: 'bg-purple-100 text-purple-800',
      urgent: 'bg-red-100 text-red-800'
    }
    
    const labels = {
      low: 'Dusuk',
      medium: 'Orta',
      high: 'Yuksek',
      urgent: 'Acil'
    }
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${styles[priority as keyof typeof styles] || styles.medium}`}>
        {labels[priority as keyof typeof labels] || priority}
      </span>
    )
  }

  const formatCurrency = (amount: number, currency: string = 'TRY') => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: currency || 'TRY',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR')
  }

  const isOverdue = (dueDateString: string, status: string) => {
    if (status === 'resolved') return false
    const dueDate = new Date(dueDateString)
    const today = new Date()
    return dueDate < today
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-3">

      {/* Filters */}
      <div className="bg-white rounded-lg shadow border p-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Arama</label>
            <input
              type="text"
              placeholder="Baslik, sirket veya referans..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Durum</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="all">Tum Durumlar</option>
              <option value="pending">Beklemede</option>
              <option value="resolved">Cozuldu</option>
              <option value="disputed">Itilafli</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Oncelik</label>
            <select
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value, page: 1 })}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="all">Tum Oncelikler</option>
              <option value="low">Dusuk</option>
              <option value="medium">Orta</option>
              <option value="high">Yuksek</option>
              <option value="urgent">Acil</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchInput('')
                setFilters({ status: 'all', priority: 'all', search: '', page: 1 })
              }}
              className="w-full px-3 py-1.5 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Temizle
            </button>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      {reconciliations && (
        <div className="bg-blue-50 border border-blue-200 rounded px-3 py-2">
          <p className="text-xs text-blue-800">
            <span className="font-semibold">{reconciliations.pagination.total}</span> kayit bulundu
            {filters.search && (
              <span> - "{filters.search}"</span>
            )}
          </p>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Referans / Baslik
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Sirket
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Tutar
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Durum
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Tarih
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Islemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reconciliations?.data.map((reconciliation) => (
                <tr key={reconciliation.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2">
                    <div className="text-xs font-medium text-indigo-600">
                      {reconciliation.reference_number}
                    </div>
                    <div className="text-xs text-gray-600 truncate max-w-xs">
                      {reconciliation.title}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="text-xs text-gray-900">{reconciliation.company_name}</div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="text-xs font-medium text-gray-900">
                      {formatCurrency(reconciliation.our_amount, reconciliation.currency)}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    {getStatusBadge(reconciliation.status)}
                  </td>
                  <td className="px-3 py-2">
                    <div className={`text-xs ${
                      isOverdue(reconciliation.due_date, reconciliation.status) ? 'text-red-600 font-medium' : 'text-gray-900'
                    }`}>
                      {formatDate(reconciliation.due_date)}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <Link
                      href={`/dashboard/reconciliations/${reconciliation.id}`}
                      className="text-indigo-600 hover:text-indigo-900 text-xs font-medium"
                    >
                      Detay
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {reconciliations && reconciliations.pagination.total_pages > 1 && (
          <div className="bg-gray-50 px-3 py-2 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-700">
                <span className="font-medium">{(reconciliations.pagination.current_page - 1) * reconciliations.pagination.per_page + 1}</span>
                -
                <span className="font-medium">
                  {Math.min(reconciliations.pagination.current_page * reconciliations.pagination.per_page, reconciliations.pagination.total)}
                </span>
                {' / '}
                <span className="font-medium">{reconciliations.pagination.total}</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setFilters({ ...filters, page: Math.max(1, filters.page - 1) })}
                  disabled={reconciliations.pagination.current_page <= 1}
                  className="px-2 py-1 border border-gray-300 rounded text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  ‹
                </button>
                <span className="text-xs text-gray-700">
                  {reconciliations.pagination.current_page} / {reconciliations.pagination.total_pages}
                </span>
                <button
                  onClick={() => setFilters({ ...filters, page: Math.min(reconciliations.pagination.total_pages, filters.page + 1) })}
                  disabled={reconciliations.pagination.current_page >= reconciliations.pagination.total_pages}
                  className="px-2 py-1 border border-gray-300 rounded text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  ›
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Empty State */}
      {reconciliations && reconciliations.data.length === 0 && (
        <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Mutabakat kaydi bulunamadi</h3>
          <p className="text-gray-600 mb-6">Filtreleri degistirerek tekrar deneyin veya yeni bir mutabakat olusturun.</p>
        </div>
      )}
    </div>
  )
}