'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    console.log('Dashboard component mounted!')
    // Skip auth check for now since ports are different (3000 vs 3001)
    // Just load dashboard directly
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'from-green-400 to-green-600'
      case 'pending': return 'from-yellow-400 to-orange-500'
      case 'disputed': return 'from-red-400 to-red-600'
      default: return 'from-gray-400 to-gray-600'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'resolved': return 'Çözüldü'
      case 'pending': return 'Beklemede'
      case 'disputed': return 'İtilaflı'
      default: return status
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-1">
              İletigo Dashboard
            </h2>
            <p className="text-gray-600 text-sm">
              Bugün {new Date().toLocaleDateString('tr-TR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </p>
          </div>
          <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Toplam Mutabakat</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats?.totals?.total_reconciliations || 0}
              </p>
              <p className="text-xs text-green-600 mt-1">+12% bu ay</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Aktif Şirketler</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats?.totals?.total_companies || 0}
              </p>
              <p className="text-xs text-green-600 mt-1">+3 yeni şirket</p>
            </div>
            <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Aktif Kullanıcılar</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats?.totals?.total_users || 0}
              </p>
              <div className="flex items-center mt-1">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                <p className="text-xs text-gray-600">Hepsi online</p>
              </div>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Geciken İşler</p>
              <p className="text-2xl font-semibold text-red-600">
                {stats?.overdue_count || 0}
              </p>
              <p className="text-xs text-red-600 mt-1">Acil müdahale</p>
            </div>
            <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Aylık Performans</h3>
          <p className="text-gray-600 text-sm">Son 6 ayın mutabakat istatistikleri</p>
        </div>
        <div className="p-6">
          <div className="h-64 flex items-end space-x-4">
            {[
              { month: 'Oca', value: 45, color: 'bg-blue-500' },
              { month: 'Şub', value: 52, color: 'bg-blue-500' },
              { month: 'Mar', value: 38, color: 'bg-blue-500' },
              { month: 'Nis', value: 61, color: 'bg-blue-500' },
              { month: 'May', value: 55, color: 'bg-blue-500' },
              { month: 'Haz', value: 67, color: 'bg-blue-600' }
            ].map((item, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div
                  className={`w-full ${item.color} rounded-t transition-all duration-300 hover:opacity-80`}
                  style={{ height: `${item.value}%` }}
                ></div>
                <div className="mt-2 text-xs text-gray-600 font-medium">{item.month}</div>
                <div className="text-xs text-gray-500">{item.value}</div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                <span className="text-gray-600">Tamamlanan Mutabakatlar</span>
              </div>
            </div>
            <div className="text-gray-600">
              Toplam: {[45, 52, 38, 61, 55, 67].reduce((a, b) => a + b, 0)} adet
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Hızlı İşlemler</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[
            { title: 'Yeni Mutabakat', desc: 'Mutabakat kaydı oluştur', href: '/dashboard/reconciliations/new' },
            { title: 'Şirket Ekle', desc: 'Yeni şirket kaydı', href: '/dashboard/companies/new' },
            { title: 'Raporlar', desc: 'Detaylı analiz', href: '/dashboard/reports' },
          ].map((action, index) => (
            <Link key={index} href={action.href} className="group p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-all duration-200 block">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors duration-200">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors duration-200 text-sm">{action.title}</p>
                  <p className="text-xs text-gray-600 mt-1">{action.desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}