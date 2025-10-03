'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [hasCompanyTemplate, setHasCompanyTemplate] = useState(false)
  const [hasEmailTemplate, setHasEmailTemplate] = useState(false)
  const [templateLoading, setTemplateLoading] = useState(true)

  useEffect(() => {
    console.log('Dashboard component mounted!')
    fetchStats()
    checkTemplates()
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

  const checkTemplates = async () => {
    try {
      // Önce kullanıcı bilgisini al
      const userResponse = await fetch('/api/auth/verify')
      let companyId = null

      if (userResponse.ok) {
        const userData = await userResponse.json()
        companyId = userData.user?.companyId
      }

      // Company template kontrolü
      const companyTemplateResponse = await fetch('/api/company-templates')
      setHasCompanyTemplate(companyTemplateResponse.ok)

      // Email template kontrolü
      if (companyId) {
        const emailTemplateResponse = await fetch(`/api/mail-templates?company_id=${companyId}`)
        if (emailTemplateResponse.ok) {
          const emailData = await emailTemplateResponse.json()
          setHasEmailTemplate(emailData.data && emailData.data.length > 0)
        } else {
          setHasEmailTemplate(false)
        }
      } else {
        setHasEmailTemplate(false)
      }
    } catch (error) {
      console.error('Error checking templates:', error)
    } finally {
      setTemplateLoading(false)
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">İletigo Mutabakat Sistemi</h1>
        <div className="text-sm text-gray-600">
          {new Date().toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            weekday: 'long'
          })}
        </div>
      </div>

      {/* Quick Actions Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold mb-4">Hızlı Aksiyonlar</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <Link href="/dashboard/reconciliations/new" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition duration-200">
            <div className="bg-blue-600 p-2 rounded-full text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-sm">Yeni Mutabakat Oluştur</p>
              <p className="text-xs text-gray-600">Cari, BA, BS</p>
            </div>
          </Link>
          <Link href="/dashboard/reconciliations" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition duration-200">
            <div className="bg-blue-500 p-2 rounded-full text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-sm">Tüm Mutabakatlarım</p>
              <p className="text-xs text-gray-600">Gönderilen ve Gelen</p>
            </div>
          </Link>
          <Link href="/dashboard/reports" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition duration-200">
            <div className="bg-blue-500 p-2 rounded-full text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-sm">Raporları Görüntüle</p>
              <p className="text-xs text-gray-600">Tüm analizler</p>
            </div>
          </Link>
          <Link href="/dashboard/settings" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition duration-200">
            <div className="bg-blue-500 p-2 rounded-full text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-sm">Şirket Ayarları</p>
              <p className="text-xs text-gray-600">Yönetim ve Yapılandırma</p>
            </div>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="md:col-span-1 space-y-6">
          {/* Welcome Card */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold mb-4">Hoşgeldiniz!</h2>
            {templateLoading ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : !hasCompanyTemplate || !hasEmailTemplate ? (
              <div className="flex items-start space-x-4">
                <div className="relative">
                  <svg className="w-16 h-16" viewBox="0 0 36 36">
                    <path className="text-gray-200" d="M18 2.0845
                                                    a 15.9155 15.9155 0 0 1 0 31.831
                                                    a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4"></path>
                    <path className="text-yellow-500" d="M18 2.0845
                                                    a 15.9155 15.9155 0 0 1 0 31.831
                                                    a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray={`${(!hasCompanyTemplate && !hasEmailTemplate) ? '0' : (!hasCompanyTemplate || !hasEmailTemplate) ? '50' : '100'}, 100`} strokeLinecap="round" strokeWidth="4"></path>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-bold text-yellow-500">!</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-3">
                    {!hasCompanyTemplate && !hasEmailTemplate
                      ? 'Şablonlarınızı oluşturmanız gerekiyor. Mutabakat oluşturmak için her iki şablon da zorunludur.'
                      : !hasCompanyTemplate
                      ? 'PDF şablonunuzu oluşturmanız gerekiyor.'
                      : 'Mail metin şablonunuzu oluşturmanız gerekiyor.'
                    }
                  </p>
                  <div className="flex gap-2">
                    {!hasCompanyTemplate && (
                      <Link href="/dashboard/company-templates" className="text-blue-600 text-sm font-medium hover:underline">
                        PDF Şablon Oluştur
                      </Link>
                    )}
                    {!hasEmailTemplate && (
                      <Link href="/dashboard/mail-content-templates" className="text-blue-600 text-sm font-medium hover:underline">
                        Mail Şablon Oluştur
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-start space-x-4">
                <div className="relative">
                  <svg className="w-16 h-16" viewBox="0 0 36 36">
                    <path className="text-gray-200" d="M18 2.0845
                                                    a 15.9155 15.9155 0 0 1 0 31.831
                                                    a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4"></path>
                    <path className="text-green-600" d="M18 2.0845
                                                    a 15.9155 15.9155 0 0 1 0 31.831
                                                    a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray="100, 100" strokeLinecap="round" strokeWidth="4"></path>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">Tebrikler! Tüm şablonlarınız hazır.</p>
                  <Link href="/dashboard/reconciliations/new" className="text-blue-600 text-sm font-medium hover:underline">
                    Hemen Mutabakat Oluştur →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Info Cards */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-center space-x-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600">Mutabakat gönderim detaylarını incelemek için dashboard sayfasını ziyaret edin</p>
              <Link href="/dashboard/reconciliations" className="text-blue-600 text-sm font-medium">Mutabakatlarım</Link>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-center space-x-4">
            <div className="bg-orange-100 p-3 rounded-lg">
              <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600">İletigo olarak düzenli eğitimler veriyoruz. Online eğitimlere katılmak için hemen rezervasyon yapın.</p>
              <a href="#" className="text-blue-600 text-sm font-medium">Rezervasyon</a>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-center space-x-4">
            <div className="bg-indigo-100 p-3 rounded-lg">
              <svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600">Eğitim Kütüphanemizde tüm sunumlarımızı video gösterimlerle beraber görebilirsiniz.</p>
              <a href="#" className="text-blue-600 text-sm font-medium flex items-center">
                İncele
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="md:col-span-2 space-y-6">
          {/* Mutabakat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <h3 className="font-semibold mb-2">Cari Mutabakatı</h3>
              <p className="text-xs text-gray-600 mb-4">Henüz oluşturulmuş mutabakat dönemi bulunmamaktadır.</p>
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 px-4 rounded-lg flex items-center justify-center space-x-2 transition duration-200">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Yeni Mutabakat Oluştur</span>
              </button>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <h3 className="font-semibold mb-2">BA Mutabakatı</h3>
              <p className="text-xs text-gray-600 mb-4">Henüz oluşturulmuş mutabakat dönemi bulunmamaktadır.</p>
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 px-4 rounded-lg flex items-center justify-center space-x-2 transition duration-200">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Yeni Mutabakat Oluştur</span>
              </button>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <h3 className="font-semibold mb-2">BS Mutabakatı</h3>
              <p className="text-xs text-gray-600 mb-4">Henüz oluşturulmuş mutabakat dönemi bulunmamaktadır.</p>
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 px-4 rounded-lg flex items-center justify-center space-x-2 transition duration-200">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Yeni Mutabakat Oluştur</span>
              </button>
            </div>
          </div>

          {/* Performance Chart and Recent Activities */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Performance Chart */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-sm">Aylık Performans</p>
                  <p className="text-xs text-gray-600">Özet İstatistikler</p>
                </div>
              </div>
              <div className="h-32 flex items-end space-x-2 mb-3">
                {[
                  { value: 45 },
                  { value: 52 },
                  { value: 38 },
                  { value: 61 },
                  { value: 55 },
                  { value: 67 }
                ].map((item, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-blue-600 rounded-t transition-all duration-300 hover:opacity-80"
                      style={{ height: `${item.value}%` }}
                    ></div>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-600 mb-3">Son 6 ayda toplam 318 mutabakat tamamlandı.</p>
              <a href="#" className="text-blue-600 text-sm font-medium flex items-center">
                İncele
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>

            {/* Recent Activities */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Son Hareketler</p>
                    <p className="text-xs text-gray-600">Sistem Aktiviteleri</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3 mb-3">
                <div className="flex items-center text-sm">
                  <div className="flex-1">
                    <p className="font-medium text-xs">{new Date().toLocaleDateString('tr-TR')}</p>
                    <p className="text-gray-600 text-xs">Cari Hesap Mutabakatı</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-xs">Test Şirketi</p>
                    <p className="text-gray-600 text-xs">mutabakat gönderdi</p>
                  </div>
                </div>
              </div>
              <a href="#" className="text-blue-600 text-sm font-medium flex items-center">
                Tümünü Gör
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}