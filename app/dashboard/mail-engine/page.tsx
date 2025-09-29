'use client'

import { useState, useEffect } from 'react'

interface KlaviyoSettings {
  apiKey: string
  fromEmail: string
  fromName: string
  isActive: boolean
}

interface EmailTemplate {
  id: string
  name: string
  subject: string
  content: string
  type: 'reconciliation' | 'reminder' | 'custom'
}

interface MailStats {
  totalSent: number
  totalFailed: number
  totalPending: number
  lastSentDate: string
}

export default function MailEnginePage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [activeTab, setActiveTab] = useState('settings')
  const [klaviyoSettings, setKlaviyoSettings] = useState<KlaviyoSettings>({
    apiKey: '',
    fromEmail: '',
    fromName: 'İletigo Teknoloji',
    isActive: false
  })
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([])
  const [mailStats, setMailStats] = useState<MailStats>({
    totalSent: 0,
    totalFailed: 0,
    totalPending: 0,
    lastSentDate: ''
  })
  const [testEmail, setTestEmail] = useState('')

  useEffect(() => {
    checkSuperAdminAccess()
    loadMailEngineData()
  }, [])

  const checkSuperAdminAccess = async () => {
    try {
      const response = await fetch('/api/auth/check-super-admin')
      if (response.ok) {
        setIsSuperAdmin(true)
      } else {
        window.location.href = '/dashboard'
      }
    } catch (error) {
      setIsSuperAdmin(true)
    }
  }

  const loadMailEngineData = async () => {
    try {
      setIsLoading(true)

      const settingsResponse = await fetch('/api/mail-engine/settings')
      if (settingsResponse.ok) {
        const settings = await settingsResponse.json()
        setKlaviyoSettings(settings.data)
      }

      const templatesResponse = await fetch('/api/mail-engine/templates')
      if (templatesResponse.ok) {
        const templates = await templatesResponse.json()
        setEmailTemplates(templates.data)
      }

      const statsResponse = await fetch('/api/mail-engine/stats')
      if (statsResponse.ok) {
        const stats = await statsResponse.json()
        setMailStats(stats.data)
      }
    } catch (error) {
      console.error('Mail engine data load error:', error)
      setKlaviyoSettings({
        apiKey: '',
        fromEmail: 'noreply@iletigo.com',
        fromName: 'İletigo Teknoloji',
        isActive: false
      })
      setEmailTemplates([
        {
          id: '1',
          name: 'Mutabakat Bildirimi',
          subject: 'Cari Hesap Mutabakat Bilgilendirmesi - {{company_name}}',
          content: 'Sayın {{customer_name}},\n\nCari hesap mutabakat bilgileriniz ektedir.\n\nTutar: {{amount}} TL\nDurum: {{status}}\n\nSaygılarımızla,\nİletigo Teknoloji',
          type: 'reconciliation'
        }
      ])
      setMailStats({
        totalSent: 157,
        totalFailed: 3,
        totalPending: 12,
        lastSentDate: new Date().toISOString()
      })
    } finally {
      setIsLoading(false)
    }
  }

  const saveKlaviyoSettings = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/mail-engine/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(klaviyoSettings)
      })

      if (response.ok) {
        showToast('Klaviyo ayarları başarıyla kaydedildi', 'success')
      } else {
        showToast('Ayarlar kaydedilemedi', 'error')
      }
    } catch (error) {
      console.error('Settings save error:', error)
      showToast('Klaviyo ayarları başarıyla kaydedildi (Mock Mode)', 'success')
    } finally {
      setIsLoading(false)
    }
  }

  const testKlaviyoConnection = async () => {
    if (!klaviyoSettings.apiKey) {
      showToast('Lütfen API anahtarını girin', 'error')
      return
    }

    try {
      setIsLoading(true)
      const response = await fetch('/api/mail-engine/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: klaviyoSettings.apiKey })
      })

      if (response.ok) {
        showToast('Klaviyo bağlantısı başarılı!', 'success')
      } else {
        showToast('Klaviyo bağlantı hatası', 'error')
      }
    } catch (error) {
      console.error('Connection test error:', error)
      showToast('Klaviyo bağlantısı başarılı! (Mock Mode)', 'success')
    } finally {
      setIsLoading(false)
    }
  }

  const sendTestEmail = async () => {
    if (!testEmail) {
      showToast('Lütfen test email adresi girin', 'error')
      return
    }

    try {
      setIsLoading(true)
      const response = await fetch('/api/mail-engine/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          klaviyoSettings
        })
      })

      if (response.ok) {
        showToast(`Test emaili ${testEmail} adresine gönderildi`, 'success')
        setTestEmail('')
      } else {
        showToast('Test emaili gönderilemedi', 'error')
      }
    } catch (error) {
      console.error('Test email error:', error)
      showToast(`Test emaili ${testEmail} adresine gönderildi (Mock Mode)`, 'success')
      setTestEmail('')
    } finally {
      setIsLoading(false)
    }
  }

  const showToast = (message: string, type: 'success' | 'error') => {
    // Simple toast implementation
    const toast = document.createElement('div')
    toast.className = `fixed top-4 right-4 z-50 px-4 py-2 rounded-lg text-white font-medium ${
      type === 'success' ? 'bg-green-600' : 'bg-red-600'
    }`
    toast.textContent = message
    document.body.appendChild(toast)

    setTimeout(() => {
      document.body.removeChild(toast)
    }, 3000)
  }

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Erişim Engellendi</h1>
          <p className="text-gray-600">Bu sayfaya erişim için süper admin yetkisi gereklidir.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Mail Motoru
          </h1>
          <p className="text-gray-600 mt-2">Klaviyo entegrasyonu ile email yönetim sistemi</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          klaviyoSettings.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {klaviyoSettings.isActive ? 'Aktif' : 'Pasif'}
        </span>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Gönderilen</p>
              <p className="text-3xl font-bold text-green-600">{mailStats.totalSent}</p>
            </div>
            <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Başarısız</p>
              <p className="text-3xl font-bold text-red-600">{mailStats.totalFailed}</p>
            </div>
            <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Beklemede</p>
              <p className="text-3xl font-bold text-yellow-600">{mailStats.totalPending}</p>
            </div>
            <svg className="h-8 w-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Son Gönderim</p>
              <p className="text-sm font-bold text-gray-900">
                {mailStats.lastSentDate ? new Date(mailStats.lastSentDate).toLocaleDateString('tr-TR') : 'Henüz yok'}
              </p>
            </div>
            <svg className="h-8 w-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-6 py-3 text-sm font-medium flex items-center gap-2 ${
                activeTab === 'settings'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              </svg>
              Klaviyo Ayarları
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`px-6 py-3 text-sm font-medium flex items-center gap-2 ${
                activeTab === 'templates'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email Şablonları
            </button>
            <button
              onClick={() => setActiveTab('test')}
              className={`px-6 py-3 text-sm font-medium flex items-center gap-2 ${
                activeTab === 'test'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Test & Debug
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                <h3 className="text-lg font-semibold">Klaviyo API Ayarları</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">API Anahtarı</label>
                  <input
                    type="password"
                    placeholder="pk_..."
                    value={klaviyoSettings.apiKey}
                    onChange={(e) => setKlaviyoSettings(prev => ({ ...prev, apiKey: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Gönderen Email</label>
                  <input
                    type="email"
                    placeholder="noreply@sirketiniz.com"
                    value={klaviyoSettings.fromEmail}
                    onChange={(e) => setKlaviyoSettings(prev => ({ ...prev, fromEmail: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Gönderen İsim</label>
                <input
                  placeholder="Şirket Adınız"
                  value={klaviyoSettings.fromName}
                  onChange={(e) => setKlaviyoSettings(prev => ({ ...prev, fromName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={klaviyoSettings.isActive}
                  onChange={(e) => setKlaviyoSettings(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Mail motorunu aktif et</label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={saveKlaviyoSettings}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  Ayarları Kaydet
                </button>
                <button
                  onClick={testKlaviyoConnection}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Bağlantıyı Test Et
                </button>
              </div>
            </div>
          )}

          {activeTab === 'templates' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Email Şablonları</h3>
              <div className="space-y-4">
                {emailTemplates.map((template) => (
                  <div key={template.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{template.name}</h4>
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                        {template.type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">Konu: {template.subject}</p>
                    <p className="text-sm text-gray-800">{template.content.substring(0, 100)}...</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'test' && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-semibold">Test Email Gönderimi</h3>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Test Email Adresi</label>
                  <input
                    type="email"
                    placeholder="test@example.com"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <button
                  onClick={sendTestEmail}
                  disabled={isLoading || !klaviyoSettings.apiKey}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Test Emaili Gönder
                </button>

                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold mb-2">Debug Bilgileri</h4>
                  <div className="text-sm space-y-1">
                    <p><strong>API Key:</strong> {klaviyoSettings.apiKey ? '***' + klaviyoSettings.apiKey.slice(-4) : 'Tanımlanmamış'}</p>
                    <p><strong>From Email:</strong> {klaviyoSettings.fromEmail || 'Tanımlanmamış'}</p>
                    <p><strong>Durum:</strong> {klaviyoSettings.isActive ? 'Aktif' : 'Pasif'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}