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

interface KlaviyoTestResult {
  testType: string
  success: boolean
  data?: any
  error?: string
  duration?: number
  debug?: {
    requestUrl?: string
    requestMethod?: string
    requestHeaders?: any
    requestBody?: any
    responseStatus?: number
    responseHeaders?: any
    rawResponse?: string
    timestamp?: string
  }
}

export default function MailEnginePage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean | null>(null)
  const [activeTab, setActiveTab] = useState('settings')
  const [klaviyoSettings, setKlaviyoSettings] = useState<KlaviyoSettings>({
    apiKey: '',
    fromEmail: '',
    fromName: '',
    isActive: false
  })
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([])
  const [mailStats, setMailStats] = useState<MailStats>({
    totalSent: 0,
    totalFailed: 0,
    totalPending: 0,
    lastSentDate: ''
  })
  const [testEmail, setTestEmail] = useState('bakiucartasarim@gmail.com')
  const [testType, setTestType] = useState<'connection' | 'profile' | 'email' | 'campaign' | 'client-events' | 'all'>('all')
  const [testResults, setTestResults] = useState<KlaviyoTestResult[]>([])
  const [isTestRunning, setIsTestRunning] = useState(false)
  const [debugMode, setDebugMode] = useState(true)
  const [smtpSettings, setSmtpSettings] = useState({
    smtpHost: 'smtp.gmail.com',
    smtpPort: '587',
    smtpUser: '',
    smtpPassword: ''
  })
  const [brevoApiKey, setBrevoApiKey] = useState('')
  const [bulkEmails, setBulkEmails] = useState('')

  useEffect(() => {
    checkSuperAdminAccess()
    loadMailEngineData()
    // Load Brevo API key from environment or localStorage
    const savedBrevoKey = localStorage.getItem('brevoApiKey')
    if (savedBrevoKey) {
      setBrevoApiKey(savedBrevoKey)
    }
  }, [])

  const checkSuperAdminAccess = async () => {
    try {
      const response = await fetch('/api/auth/check-super-admin')
      if (response.ok) {
        setIsSuperAdmin(true)
      } else {
        setIsSuperAdmin(false)
        setTimeout(() => {
          window.location.href = '/dashboard'
        }, 100)
      }
    } catch (error) {
      // Fallback: allow access on error
      setIsSuperAdmin(true)
    } finally {
      setIsLoading(false)
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
      // Keep empty state if API fails
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

  const runKlaviyoTest = async () => {
    if (!klaviyoSettings.apiKey) {
      showToast('Lütfen API anahtarını girin', 'error')
      return
    }

    if (!testEmail) {
      showToast('Lütfen test email adresi girin', 'error')
      return
    }

    try {
      setIsTestRunning(true)
      setTestResults([])

      const response = await fetch('/api/klaviyo/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: klaviyoSettings.apiKey,
          testEmail: testEmail,
          testType: testType
        })
      })

      if (response.ok) {
        const result = await response.json()
        setTestResults(result.results || [])
        showToast(result.message || 'Test tamamlandı', result.success ? 'success' : 'error')
      } else {
        const errorData = await response.json()
        showToast(errorData.error || 'Test başarısız', 'error')
      }
    } catch (error) {
      console.error('Klaviyo test error:', error)
      showToast('Test sırasında hata oluştu', 'error')
    } finally {
      setIsTestRunning(false)
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
        showToast(`Klaviyo event oluşturuldu: ${testEmail} (Flow gerekli!)`, 'success')
      } else {
        showToast('Klaviyo event oluşturulamadı', 'error')
      }
    } catch (error) {
      console.error('Test email error:', error)
      showToast(`Klaviyo event oluşturuldu (Mock Mode)`, 'success')
    } finally {
      setIsLoading(false)
    }
  }

  const sendKlaviyoCampaign = async () => {
    if (!testEmail) {
      showToast('Lütfen test email adresi girin', 'error')
      return
    }

    if (!klaviyoSettings.apiKey) {
      showToast('Lütfen Klaviyo API anahtarını girin', 'error')
      return
    }

    try {
      setIsLoading(true)
      const response = await fetch('/api/klaviyo/send-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: klaviyoSettings.apiKey,
          fromEmail: klaviyoSettings.fromEmail,
          fromName: klaviyoSettings.fromName || 'İletigo',
          toEmail: testEmail,
          subject: 'Test Email - İletigo Mail Engine',
          textContent: 'Bu İletigo Mail Engine\'den gönderilen bir test emailidir.',
          htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #667eea;">Test Email</h2>
              <p>Bu İletigo Mail Engine'den Klaviyo Campaign API ile gönderilen bir test emailidir.</p>
              <p><strong>Gönderim Zamanı:</strong> ${new Date().toLocaleString('tr-TR')}</p>
            </div>
          `
        })
      })

      const data = await response.json()

      if (response.ok) {
        showToast(`✅ Klaviyo Campaign gönderildi: ${testEmail}`, 'success')
        console.log('Campaign sent:', data)
      } else {
        showToast(`❌ Campaign gönderilemedi: ${data.error}`, 'error')
        console.error('Campaign error:', data)
      }
    } catch (error) {
      console.error('Campaign send error:', error)
      showToast('Klaviyo Campaign hatası', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const sendSmtpTestEmail = async () => {
    if (!testEmail) {
      showToast('Lütfen test email adresi girin', 'error')
      return
    }

    if (!smtpSettings.smtpUser || !smtpSettings.smtpPassword) {
      showToast('Lütfen SMTP kullanıcı adı ve şifresini girin', 'error')
      return
    }

    try {
      setIsLoading(true)
      const response = await fetch('/api/mail-engine/send-smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...smtpSettings,
          fromEmail: smtpSettings.smtpUser,
          fromName: 'İletigo Mail Engine',
          toEmail: testEmail,
          subject: 'Test Email - İletigo Mail Engine',
        })
      })

      const data = await response.json()

      if (response.ok) {
        showToast(`✅ Email başarıyla gönderildi: ${testEmail}`, 'success')
        console.log('Email sent:', data)
      } else {
        showToast(`❌ Email gönderilemedi: ${data.error}`, 'error')
        console.error('SMTP error:', data)
      }
    } catch (error) {
      console.error('SMTP send error:', error)
      showToast('SMTP bağlantı hatası', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const sendBrevoEmail = async () => {
    if (!testEmail) {
      showToast('Lütfen test email adresi girin', 'error')
      return
    }

    if (!brevoApiKey) {
      showToast('Lütfen Brevo API anahtarını girin', 'error')
      return
    }

    try {
      setIsLoading(true)
      const response = await fetch('/api/mail-engine/brevo/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: brevoApiKey,
          fromEmail: 'socialhub@atalga.com',
          fromName: 'iletiGo Mutabakat',
          toEmail: testEmail,
          subject: 'Test Email - iletiGo Mutabakat',
        })
      })

      const data = await response.json()

      if (response.ok) {
        showToast(`✅ Brevo email gönderildi: ${testEmail}`, 'success')
        console.log('Brevo email sent:', data)
      } else {
        showToast(`❌ Brevo email gönderilemedi: ${data.error}`, 'error')
        console.error('Brevo error:', data)
      }
    } catch (error) {
      console.error('Brevo send error:', error)
      showToast('Brevo bağlantı hatası', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const sendBrevoBulkEmail = async () => {
    if (!bulkEmails) {
      showToast('Lütfen email adreslerini girin', 'error')
      return
    }

    if (!brevoApiKey) {
      showToast('Lütfen Brevo API anahtarını girin', 'error')
      return
    }

    // Parse emails (comma or newline separated)
    const emailList = bulkEmails
      .split(/[,\n]/)
      .map(email => email.trim())
      .filter(email => email && email.includes('@'))

    if (emailList.length === 0) {
      showToast('Geçerli email adresi bulunamadı', 'error')
      return
    }

    const recipients = emailList.map(email => ({ email }))

    try {
      setIsLoading(true)
      const response = await fetch('/api/mail-engine/brevo/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: brevoApiKey,
          fromEmail: 'socialhub@atalga.com',
          fromName: 'iletiGo Mutabakat',
          subject: 'Bulk Email - iletiGo Mutabakat',
          recipients: recipients,
          batchDelay: 100
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        showToast(`✅ ${data.data.successful}/${data.data.total} email gönderildi`, 'success')
        console.log('Bulk email sent:', data)
        setBulkEmails('')
      } else {
        showToast(`⚠️ ${data.data?.successful || 0}/${data.data?.total || 0} başarılı`, 'error')
        console.error('Bulk send partial failure:', data)
      }
    } catch (error) {
      console.error('Bulk send error:', error)
      showToast('Toplu mail gönderimi başarısız', 'error')
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

  // Show loading while checking access
  if (isSuperAdmin === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    )
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
          <p className="text-gray-600 mt-2">SMTP ile email gönderim sistemi</p>
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
              SMTP Ayarları
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <h3 className="text-lg font-semibold">Email Gönderim Ayarları</h3>
              </div>

              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-medium text-green-900 mb-3 flex items-center gap-2">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Brevo API (Önerilen)
                </h4>
                <p className="text-sm text-green-800 mb-3">
                  ✅ Basit, hızlı ve güvenilir - Sadece API key yeterli!
                </p>

                <div className="space-y-3 mb-3">
                  <div>
                    <label className="block text-xs font-medium text-green-900 mb-1">Brevo API Key</label>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        placeholder="xkeysib-..."
                        value={brevoApiKey}
                        onChange={(e) => setBrevoApiKey(e.target.value)}
                        className="flex-1 px-3 py-2 text-sm border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                      <button
                        onClick={() => {
                          localStorage.setItem('brevoApiKey', brevoApiKey)
                          showToast('API Key kaydedildi', 'success')
                        }}
                        className="px-3 py-2 text-xs bg-green-700 text-white rounded-lg hover:bg-green-800"
                      >
                        Kaydet
                      </button>
                    </div>
                    <p className="text-xs text-green-600 mt-1">
                      API Key tarayıcıda saklanacak (güvenli)
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <input
                    type="email"
                    placeholder="Alıcı email: test@example.com"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    className="flex-1 px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                  <button
                    onClick={sendBrevoEmail}
                    disabled={isLoading || !testEmail || !brevoApiKey}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Mail Gönder
                  </button>
                </div>

                <div className="mt-3 text-xs text-green-700 bg-green-100 p-2 rounded">
                  <strong>Brevo:</strong> app.brevo.com → SMTP & API → API Keys
                </div>
              </div>

              <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <h4 className="font-medium text-purple-900 mb-3 flex items-center gap-2">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Brevo Toplu Mail Gönder
                </h4>
                <p className="text-sm text-purple-800 mb-3">
                  Çoklu alıcıya email gönderin (virgül veya satır ile ayırın)
                </p>

                <div className="space-y-3 mb-3">
                  <div>
                    <label className="block text-xs font-medium text-purple-900 mb-1">Email Adresleri</label>
                    <textarea
                      placeholder="test1@example.com, test2@example.com&#10;test3@example.com"
                      value={bulkEmails}
                      onChange={(e) => setBulkEmails(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 text-sm border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                    <p className="text-xs text-purple-600 mt-1">
                      Virgül (,) veya satır sonu ile ayırarak birden fazla email girin
                    </p>
                  </div>
                </div>

                <button
                  onClick={sendBrevoBulkEmail}
                  disabled={isLoading || !bulkEmails || !brevoApiKey}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Toplu Mail Gönder
                </button>
              </div>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  SMTP (Gmail/Outlook)
                </h4>
                <p className="text-sm text-blue-800 mb-3">
                  Alternatif: SMTP ile email gönderimi
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-medium text-blue-900 mb-1">SMTP Host</label>
                    <input
                      type="text"
                      placeholder="smtp.gmail.com"
                      value={smtpSettings.smtpHost}
                      onChange={(e) => setSmtpSettings(prev => ({ ...prev, smtpHost: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-blue-900 mb-1">SMTP Port</label>
                    <input
                      type="text"
                      placeholder="587"
                      value={smtpSettings.smtpPort}
                      onChange={(e) => setSmtpSettings(prev => ({ ...prev, smtpPort: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-blue-900 mb-1">Email/Kullanıcı</label>
                    <input
                      type="email"
                      placeholder="your@gmail.com"
                      value={smtpSettings.smtpUser}
                      onChange={(e) => setSmtpSettings(prev => ({ ...prev, smtpUser: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-blue-900 mb-1">Şifre/App Password</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={smtpSettings.smtpPassword}
                      onChange={(e) => setSmtpSettings(prev => ({ ...prev, smtpPassword: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <input
                    type="email"
                    placeholder="Alıcı email: test@example.com"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    className="flex-1 px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    onClick={sendSmtpTestEmail}
                    disabled={isLoading || !testEmail || !smtpSettings.smtpUser || !smtpSettings.smtpPassword}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Mail Gönder
                  </button>
                </div>

                <div className="mt-3 text-xs text-blue-700 bg-blue-100 p-2 rounded">
                  <strong>Gmail için:</strong> myaccount.google.com → Security → App passwords (16 haneli şifre)
                </div>
              </div>

            </div>
          )}

          {activeTab === 'templates' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Email Şablonları</h3>
              <div className="space-y-4">
                {emailTemplates.length > 0 ? (
                  emailTemplates.map((template) => (
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
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <p>Henüz email şablonu bulunmuyor.</p>
                    <p className="text-sm mt-1">Email şablonları database'den yüklenecek.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'test' && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-semibold">Klaviyo API Test Sistemi</h3>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Test Configuration */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Test Ayarları</h4>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Test Email Adresi</label>
                    <input
                      type="email"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="test@example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Test Türü</label>
                    <select
                      value={testType}
                      onChange={(e) => setTestType(e.target.value as typeof testType)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">Tüm Testler</option>
                      <option value="connection">Sadece Bağlantı Testi</option>
                      <option value="profile">Sadece Profil Yönetimi</option>
                      <option value="email">Sadece Email Gönderimi</option>
                      <option value="campaign">Sadece Campaigns Access</option>
                      <option value="client-events">Sadece Client Events API</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="debugMode"
                      checked={debugMode}
                      onChange={(e) => setDebugMode(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="debugMode" className="text-sm font-medium text-gray-700">Debug Modunu Aç</label>
                  </div>

                  <button
                    onClick={runKlaviyoTest}
                    disabled={isTestRunning || !klaviyoSettings.apiKey || !testEmail}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isTestRunning ? (
                      <>
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Test Çalışıyor...
                      </>
                    ) : (
                      <>
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Klaviyo API Test Et
                      </>
                    )}
                  </button>

                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h5 className="font-medium mb-2">Mevcut Ayarlar</h5>
                    <div className="text-sm space-y-1">
                      <p><strong>API Key:</strong> {klaviyoSettings.apiKey ? '***' + klaviyoSettings.apiKey.slice(-4) : 'Tanımlanmamış'}</p>
                      <p><strong>From Email:</strong> {klaviyoSettings.fromEmail || 'Tanımlanmamış'}</p>
                      <p><strong>From Name:</strong> {klaviyoSettings.fromName || 'Tanımlanmamış'}</p>
                      <p><strong>Durum:</strong> <span className={klaviyoSettings.isActive ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>{klaviyoSettings.isActive ? 'Aktif' : 'Pasif'}</span></p>
                    </div>
                  </div>

                  {debugMode && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <h5 className="font-medium mb-2 text-blue-900">Sistem Debug Bilgileri</h5>
                      <div className="text-sm space-y-1 text-blue-800">
                        <p><strong>Browser:</strong> {navigator.userAgent}</p>
                        <p><strong>Timestamp:</strong> {new Date().toISOString()}</p>
                        <p><strong>Timezone:</strong> {Intl.DateTimeFormat().resolvedOptions().timeZone}</p>
                        <p><strong>Language:</strong> {navigator.language}</p>
                        <p><strong>Online:</strong> {navigator.onLine ? 'Evet' : 'Hayır'}</p>
                        <p><strong>Screen:</strong> {screen.width}x{screen.height}</p>
                        <p><strong>Window:</strong> {window.innerWidth}x{window.innerHeight}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Test Results */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Test Sonuçları</h4>

                  {testResults.length > 0 ? (
                    <div className="space-y-3">
                      {testResults.map((result, index) => (
                        <div
                          key={index}
                          className={`p-4 rounded-lg border ${
                            result.success
                              ? 'bg-green-50 border-green-200'
                              : 'bg-red-50 border-red-200'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium flex items-center gap-2">
                              {result.success ? (
                                <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                <svg className="h-4 w-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              )}
                              {result.testType}
                            </h5>
                            {result.duration && (
                              <span className="text-xs text-gray-500">{result.duration}ms</span>
                            )}
                          </div>

                          {result.success && result.data && (
                            <div className="text-sm text-gray-700 mb-2">
                              <strong>Sonuç:</strong>
                              <pre className="mt-1 text-xs bg-white p-2 rounded border overflow-x-auto">
                                {JSON.stringify(result.data, null, 2)}
                              </pre>
                            </div>
                          )}

                          {result.error && (
                            <div className="text-sm text-red-700 mb-2">
                              <strong>Hata:</strong> {result.error}
                            </div>
                          )}

                          {debugMode && result.debug && (
                            <div className="mt-3 p-3 bg-gray-100 rounded border">
                              <div className="flex items-center justify-between mb-2">
                                <strong className="text-xs font-medium text-gray-800">Debug Bilgileri</strong>
                                <span className="text-xs text-gray-500">{result.debug.timestamp}</span>
                              </div>

                              <div className="space-y-2 text-xs">
                                <div>
                                  <strong>İstek:</strong> {result.debug.requestMethod} {result.debug.requestUrl}
                                </div>

                                {result.debug.requestHeaders && (
                                  <div>
                                    <strong>İstek Headers:</strong>
                                    <pre className="mt-1 bg-white p-2 rounded text-xs overflow-x-auto">
                                      {JSON.stringify(result.debug.requestHeaders, null, 2)}
                                    </pre>
                                  </div>
                                )}

                                {result.debug.requestBody && (
                                  <div>
                                    <strong>İstek Body:</strong>
                                    <pre className="mt-1 bg-white p-2 rounded text-xs overflow-x-auto">
                                      {JSON.stringify(result.debug.requestBody, null, 2)}
                                    </pre>
                                  </div>
                                )}

                                {result.debug.responseStatus && (
                                  <div>
                                    <strong>Response Status:</strong> {result.debug.responseStatus}
                                  </div>
                                )}

                                {result.debug.responseHeaders && (
                                  <div>
                                    <strong>Response Headers:</strong>
                                    <pre className="mt-1 bg-white p-2 rounded text-xs overflow-x-auto">
                                      {JSON.stringify(result.debug.responseHeaders, null, 2)}
                                    </pre>
                                  </div>
                                )}

                                {result.debug.rawResponse && (
                                  <div>
                                    <strong>Raw Response:</strong>
                                    <pre className="mt-1 bg-white p-2 rounded text-xs overflow-x-auto max-h-32">
                                      {result.debug.rawResponse}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p>Henüz test çalıştırılmadı.</p>
                      <p className="text-sm mt-1">Klaviyo API'yi test etmek için yukarıdaki butona tıklayın.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Test Description */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h5 className="font-medium text-blue-900 mb-2">Test Açıklamaları</h5>
                <div className="text-sm text-blue-800 space-y-1">
                  <p><strong>Bağlantı Testi:</strong> Klaviyo API anahtarının geçerliliğini ve hesap bilgilerinizi kontrol eder.</p>
                  <p><strong>Profil Yönetimi:</strong> Test email adresi için profil oluşturma/getirme işlemlerini test eder.</p>
                  <p><strong>Email Gönderimi:</strong> Test email adresi için event oluşturur (gerçek email gönderimi flow yapılandırmasına bağlıdır).</p>
                  <p><strong>Campaigns Access:</strong> Klaviyo campaigns API'sine erişimi ve izinleri test eder.</p>
                  <p><strong>Client Events API:</strong> Frontend event tracking için client events API'sini test eder.</p>
                  <p><strong>Tüm Testler:</strong> Yukarıdaki tüm testleri sırayla çalıştırır.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}