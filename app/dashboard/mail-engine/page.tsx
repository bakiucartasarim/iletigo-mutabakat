'use client'

import { useState, useEffect } from 'react'

interface MailStats {
  totalSent: number
  totalFailed: number
  totalPending: number
  lastSentDate: string
}

export default function MailEnginePage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean | null>(null)
  const [mailStats, setMailStats] = useState<MailStats>({
    totalSent: 0,
    totalFailed: 0,
    totalPending: 0,
    lastSentDate: ''
  })
  const [testEmail, setTestEmail] = useState('bakiucartasarim@gmail.com')
  const [smtpSettings, setSmtpSettings] = useState({
    smtpHost: 'smtp.gmail.com',
    smtpPort: '587',
    smtpUser: '',
    smtpPassword: ''
  })
  const [brevoSettings, setBrevoSettings] = useState({
    api_key: '',
    from_email: '',
    from_name: '',
    is_active: false
  })
  const [bulkEmails, setBulkEmails] = useState('')

  useEffect(() => {
    checkSuperAdminAccess()
    loadBrevoSettings()
    loadMailStats()
  }, [])

  const loadMailStats = async () => {
    try {
      const statsResponse = await fetch('/api/mail-engine/stats')
      if (statsResponse.ok) {
        const stats = await statsResponse.json()
        setMailStats(stats.data)
      }
    } catch (error) {
      console.error('Mail stats load error:', error)
    }
  }

  const loadBrevoSettings = async () => {
    try {
      const response = await fetch('/api/mail-engine/brevo-settings')
      if (response.ok) {
        const data = await response.json()
        setBrevoSettings(data)
      }
    } catch (error) {
      console.error('Error loading Brevo settings:', error)
    }
  }

  const saveBrevoSettings = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/mail-engine/brevo-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(brevoSettings)
      })

      if (response.ok) {
        showToast('Brevo ayarları kaydedildi', 'success')
      } else {
        showToast('Ayarlar kaydedilemedi', 'error')
      }
    } catch (error) {
      console.error('Brevo settings save error:', error)
      showToast('Kaydetme hatası', 'error')
    } finally {
      setIsLoading(false)
    }
  }

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
      setIsSuperAdmin(true)
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

    if (!brevoSettings.api_key) {
      showToast('Lütfen Brevo API anahtarını girin', 'error')
      return
    }

    try {
      setIsLoading(true)
      const response = await fetch('/api/mail-engine/brevo/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: brevoSettings.api_key,
          fromEmail: brevoSettings.from_email || 'socialhub@atalga.com',
          fromName: brevoSettings.from_name || 'iletiGo Mutabakat',
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

    if (!brevoSettings.api_key) {
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
          apiKey: brevoSettings.api_key,
          fromEmail: brevoSettings.from_email || 'socialhub@atalga.com',
          fromName: brevoSettings.from_name || 'iletiGo Mutabakat',
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
          brevoSettings.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {brevoSettings.is_active ? 'Aktif' : 'Pasif'}
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

      {/* Settings */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
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
                <input
                  type="password"
                  placeholder="xkeysib-..."
                  value={brevoSettings.api_key}
                  onChange={(e) => setBrevoSettings({...brevoSettings, api_key: e.target.value})}
                  className="w-full px-3 py-2 text-sm border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-green-900 mb-1">From Email</label>
                <input
                  type="email"
                  placeholder="noreply@yourdomain.com"
                  value={brevoSettings.from_email}
                  onChange={(e) => setBrevoSettings({...brevoSettings, from_email: e.target.value})}
                  className="w-full px-3 py-2 text-sm border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-green-900 mb-1">From Name</label>
                <input
                  type="text"
                  placeholder="iletiGo Mutabakat"
                  value={brevoSettings.from_name}
                  onChange={(e) => setBrevoSettings({...brevoSettings, from_name: e.target.value})}
                  className="w-full px-3 py-2 text-sm border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <button
                onClick={saveBrevoSettings}
                disabled={isLoading}
                className="w-full px-3 py-2 text-sm bg-green-700 text-white rounded-lg hover:bg-green-800 disabled:opacity-50"
              >
                {isLoading ? 'Kaydediliyor...' : 'Brevo Ayarlarını Kaydet'}
              </button>
              <p className="text-xs text-green-600 mt-1">
                ✅ Ayarlar database'e güvenli şekilde saklanır
              </p>
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
                disabled={isLoading || !testEmail || !brevoSettings.api_key}
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
              disabled={isLoading || !bulkEmails || !brevoSettings.api_key}
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
      </div>
    </div>
  )
}