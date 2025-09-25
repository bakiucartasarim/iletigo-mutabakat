'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Company {
  id: number
  code: string
  name: string
  contact_person?: string
  email?: string
  phone?: string
  mobile_phone?: string
}

export default function NewReconciliationPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [companyLoading, setCompanyLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [currentStep, setCurrentStep] = useState(1) // Progress step indicator
  const [formData, setFormData] = useState({
    company_code: '',
    company_name: '',
    contact_person: '',
    email: '',
    phone: '',
    mobile_phone: '',
    type: 'cari_mutabakat', // Cari Mutabakat varsayılan
    debt_credit: 'borc',
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    amount: '',
    description: '',
    due_date: '',
    reconciliation_date: new Date().toISOString().split('T')[0],
    // Yeni alanlar HTML'e uygun olarak
    reconciliation_period: '',
    end_date: '',
    related_type: 'cari_hesap_bakiye',
    reminder_days: 'pazartesi_sali_cuma',
    sender_branch: 'merkez',
    language: 'tr',
    template: 'cari_mutabakat_tr',
    // Özel ayarlar
    auto_request_statement: false,
    email_notification: false,
    auto_document_request: false,
    alternative_email_finder: false,
    tolerance_level: false,
    update_verified_emails: false
  })

  const [currentTime, setCurrentTime] = useState('')

  useEffect(() => {
    // Güncel saati göster
    const updateTime = () => {
      const now = new Date()
      const timeString = now.toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit'
      })
      setCurrentTime(timeString)
    }
    updateTime()
    const timeInterval = setInterval(updateTime, 60000)
    return () => clearInterval(timeInterval)
  }, [])

  useEffect(() => {
    if (formData.reconciliation_date) {
      const date = new Date(formData.reconciliation_date)
      setFormData(prev => ({
        ...prev,
        year: date.getFullYear(),
        month: date.getMonth() + 1
      }))
    }
  }, [formData.reconciliation_date])

  const handleCompanyCodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const code = e.target.value.toUpperCase()
    setFormData(prev => ({
      ...prev,
      company_code: code
    }))

    if (code.length >= 3) {
      setCompanyLoading(true)
      try {
        const response = await fetch(`/api/companies/search?code=${code}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          if (data.company) {
            setFormData(prev => ({
              ...prev,
              company_name: data.company.name,
              contact_person: data.company.contact_person || '',
              email: data.company.email || '',
              phone: data.company.phone || '',
              mobile_phone: data.company.mobile_phone || ''
            }))
          } else {
            setFormData(prev => ({
              ...prev,
              company_name: '',
              contact_person: '',
              email: '',
              phone: '',
              mobile_phone: ''
            }))
          }
        }
      } catch (error) {
        console.error('Error searching company:', error)
      } finally {
        setCompanyLoading(false)
      }
    } else {
      setFormData(prev => ({
        ...prev,
        company_name: '',
        contact_person: '',
        email: '',
        phone: '',
        mobile_phone: ''
      }))
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSuccessMessage('')

    try {
      const response = await fetch('/api/reconciliations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      })

      const responseData = await response.json()

      if (response.ok) {
        setSuccessMessage(`✅ ${responseData.message} - Referans: ${responseData.data.reference_number}`)
        setTimeout(() => {
          router.push('/dashboard/reconciliations')
        }, 3000)
      } else {
        console.error('Mutabakat oluşturulurken hata oluştu:', responseData.error)
        alert(`Hata: ${responseData.error}`)
      }
    } catch (error) {
      console.error('Error creating reconciliation:', error)
      alert('Bir hata oluştu. Lütfen tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  const steps = [
    { number: 1, title: 'Mutabakat Ayarları', active: currentStep === 1 },
    { number: 2, title: 'Mutabakat Dosyası', active: currentStep === 2 },
    { number: 3, title: 'Ekstre Dosyası', active: currentStep === 3 },
    { number: 4, title: 'Sonuç', active: currentStep === 4 }
  ]

  return (
    <div className="bg-white min-h-screen">
      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">{successMessage}</p>
              <p className="text-xs text-green-600 mt-1">Mutabakatlar sayfasına yönlendiriliyorsunuz...</p>
            </div>
          </div>
        </div>
      )}

      {/* Header with Blue Background */}
      <div className="bg-blue-600 border-b">
        <div className="container mx-auto px-4 py-2">
          <h2 className="text-white text-lg font-semibold">Yeni Cari Mutabakat</h2>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="grid grid-cols-4 gap-4 items-start">
            {steps.map((step, index) => (
              <div key={step.number} className={`step ${step.active ? 'step-active' : 'step-inactive'}`}>
                <div className="flex flex-col items-center w-full">
                  <div className="flex items-center w-full">
                    <div className={`step-number ${step.active ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                      {step.number}
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`step-line ${step.active ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                    )}
                  </div>
                  <p className={`text-sm mt-2 text-center ${step.active ? 'text-blue-600 font-semibold' : 'text-gray-500'}`}>
                    {step.title}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Mutabakat Türü */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Mutabakat Türü</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    checked={formData.type === 'cari_mutabakat'}
                    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    id="cari-mutabakat"
                    name="type"
                    type="radio"
                    value="cari_mutabakat"
                    onChange={handleInputChange}
                  />
                  <label className="ml-3 block text-sm font-medium text-gray-900" htmlFor="cari-mutabakat">
                    Cari Mutabakat
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    checked={formData.type === 'ba_mutabakat'}
                    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    id="ba-mutabakat"
                    name="type"
                    type="radio"
                    value="ba_mutabakat"
                    onChange={handleInputChange}
                  />
                  <label className="ml-3 block text-sm font-medium text-gray-900" htmlFor="ba-mutabakat">
                    BA Mutabakatı
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    checked={formData.type === 'bs_mutabakat'}
                    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    id="bs-mutabakat"
                    name="type"
                    type="radio"
                    value="bs_mutabakat"
                    onChange={handleInputChange}
                  />
                  <label className="ml-3 block text-sm font-medium text-gray-900" htmlFor="bs-mutabakat">
                    BS Mutabakatı
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    checked={formData.type === 'bakiyesiz_mutabakat'}
                    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    id="bakiyesiz-mutabakat"
                    name="type"
                    type="radio"
                    value="bakiyesiz_mutabakat"
                    onChange={handleInputChange}
                  />
                  <label className="ml-3 block text-sm font-medium text-gray-900" htmlFor="bakiyesiz-mutabakat">
                    Bakiyesiz Mutabakat
                  </label>
                </div>
              </div>

              {/* Tarih Alanları */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1" htmlFor="reconciliation_period">
                    Mutabakat Dönemi
                  </label>
                  <div className="relative">
                    <input
                      className="w-full rounded-md border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10 px-3 py-2"
                      id="reconciliation_period"
                      name="reconciliation_period"
                      type="text"
                      value={formData.reconciliation_period}
                      onChange={handleInputChange}
                      placeholder="30 Haziran 2025"
                    />
                    <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 pointer-events-none">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1" htmlFor="end_date">
                    Bitiş Tarihi
                  </label>
                  <div className="relative">
                    <input
                      className="w-full rounded-md border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10 px-3 py-2"
                      id="end_date"
                      name="end_date"
                      type="text"
                      value={formData.end_date}
                      onChange={handleInputChange}
                      placeholder="15.10.2025"
                    />
                    <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 pointer-events-none">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-600 mb-1" htmlFor="related_type">
                  İlgili Tür <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full rounded-md border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent px-3 py-2"
                  id="related_type"
                  name="related_type"
                  value={formData.related_type}
                  onChange={handleInputChange}
                  required
                >
                  <option value="cari_hesap_bakiye">Cari Hesap Bakiye Mutabakatı</option>
                  <option value="tedarikci">Tedarikçi Mutabakatı</option>
                  <option value="musteri">Müşteri Mutabakatı</option>
                  <option value="banka">Banka Mutabakatı</option>
                </select>
              </div>
            </div>

            {/* Genel Ayarlar */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Genel Ayarlar</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1" htmlFor="reminder_days">
                    E-posta ile Hatırlatma Günleri
                  </label>
                  <select
                    className="w-full rounded-md border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent px-3 py-2"
                    id="reminder_days"
                    name="reminder_days"
                    value={formData.reminder_days}
                    onChange={handleInputChange}
                  >
                    <option value="pazartesi_sali_cuma">Pazartesi, Salı, Cuma</option>
                    <option value="pazartesi">Sadece Pazartesi</option>
                    <option value="cuma">Sadece Cuma</option>
                    <option value="her_gun">Her Gün</option>
                    <option value="hafta_ici">Hafta Sonları Hariç</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1" htmlFor="sender_branch">
                      Gönderen Şube <span className="text-red-500">*</span>
                    </label>
                    <select
                      className="w-full rounded-md border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent px-3 py-2"
                      id="sender_branch"
                      name="sender_branch"
                      value={formData.sender_branch}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="merkez">Merkez (kredi: 1496)</option>
                      <option value="ankara">Ankara Şubesi (kredi: 1520)</option>
                      <option value="istanbul">İstanbul Şubesi (kredi: 1580)</option>
                      <option value="izmir">İzmir Şubesi (kredi: 1630)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1" htmlFor="language">
                      Dil Seçimi <span className="text-red-500">*</span>
                    </label>
                    <select
                      className="w-full rounded-md border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent px-3 py-2"
                      id="language"
                      name="language"
                      value={formData.language}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="tr">Türkçe</option>
                      <option value="en">English</option>
                      <option value="de">Deutsch</option>
                      <option value="ar">العربية</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1" htmlFor="template">
                      Mutabakat Şablonu <span className="text-red-500">*</span>
                    </label>
                    <select
                      className="w-full rounded-md border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent px-3 py-2"
                      id="template"
                      name="template"
                      value={formData.template}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="cari_mutabakat_tr">Cari Mutabakat (TR)</option>
                      <option value="detayli_mutabakat_tr">Detaylı Mutabakat (TR)</option>
                      <option value="ozet_mutabakat_tr">Özet Mutabakat (TR)</option>
                      <option value="international_en">International Template (EN)</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <button
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    type="button"
                  >
                    Ön İzleme
                  </button>
                  <button
                    className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                    type="button"
                  >
                    Şablon Editörü
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Şirket Bilgileri */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 flex items-center">
              <span className="mr-3">🏢</span>
              Şirket Bilgileri
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Şirket Kodu *
                  <span className="text-blue-600 text-xs ml-1">
                    {companyLoading ? '(Aranıyor...)' : '(3+ karakter girin, otomatik arama)'}
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="company_code"
                    value={formData.company_code}
                    onChange={handleCompanyCodeChange}
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white uppercase tracking-wider font-mono"
                    placeholder="ABC123, XYZ-001, vb."
                    maxLength={20}
                  />
                  {companyLoading && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Şirket Adı *</label>
                <input
                  type="text"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                  placeholder="Şirket adını giriniz"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Yetkili Kişi</label>
                <input
                  type="text"
                  name="contact_person"
                  value={formData.contact_person}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                  placeholder="Yetkili kişi adı"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">E-posta Adresi *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                  placeholder="email@ornek.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Şirket Telefonu *</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                  placeholder="0(212) 123 45 67"
                />
              </div>

              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tutar (₺) *
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  required
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* Özel Ayarlar */}
          <div className="bg-gray-100 border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Özel Ayarlar</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <div className="flex items-start">
                  <input
                    className="h-4 w-4 mt-1 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    id="auto_request_statement"
                    name="auto_request_statement"
                    type="checkbox"
                    checked={formData.auto_request_statement}
                    onChange={handleCheckboxChange}
                  />
                  <label className="ml-3 block text-sm text-gray-900" htmlFor="auto_request_statement">
                    Mutabık Olmayanlardan Otomatik Ekstre Talep Et.
                  </label>
                </div>
                <div className="flex items-start">
                  <input
                    className="h-4 w-4 mt-1 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    id="email_notification"
                    name="email_notification"
                    type="checkbox"
                    checked={formData.email_notification}
                    onChange={handleCheckboxChange}
                  />
                  <label className="ml-3 block text-sm text-gray-900" htmlFor="email_notification">
                    Mutabık Olmayanları Bana E-Posta ile Bildir.
                  </label>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start">
                  <input
                    className="h-4 w-4 mt-1 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    id="auto_document_request"
                    name="auto_document_request"
                    type="checkbox"
                    checked={formData.auto_document_request}
                    onChange={handleCheckboxChange}
                  />
                  <label className="ml-3 block text-sm text-gray-900" htmlFor="auto_document_request">
                    İmzalı Doküman Eksik Yanıtlar İçin Otomatik Doküman Talep Et.
                  </label>
                </div>
                <div className="flex items-start">
                  <input
                    className="h-4 w-4 mt-1 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    id="alternative_email_finder"
                    name="alternative_email_finder"
                    type="checkbox"
                    checked={formData.alternative_email_finder}
                    onChange={handleCheckboxChange}
                  />
                  <label className="ml-3 block text-sm text-gray-900" htmlFor="alternative_email_finder">
                    Alternatif E-posta Bulucu
                  </label>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start">
                  <input
                    className="h-4 w-4 mt-1 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    id="tolerance_level"
                    name="tolerance_level"
                    type="checkbox"
                    checked={formData.tolerance_level}
                    onChange={handleCheckboxChange}
                  />
                  <label className="ml-3 block text-sm text-gray-900" htmlFor="tolerance_level">
                    Mutabakat Farkları İçin Tolerans Seviyesi Belirle.
                  </label>
                </div>
                <div className="flex items-start">
                  <input
                    className="h-4 w-4 mt-1 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    id="update_verified_emails"
                    name="update_verified_emails"
                    type="checkbox"
                    checked={formData.update_verified_emails}
                    onChange={handleCheckboxChange}
                  />
                  <label className="ml-3 block text-sm text-gray-900" htmlFor="update_verified_emails">
                    E-posta adreslerini doğrulanmış e-posta adresi ile güncelle
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end mt-8">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-green-500 text-white font-bold rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 flex items-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Oluşturuluyor...
                </div>
              ) : (
                <>
                  Devam
                  <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>
          </div>

          {/* Footer Time */}
          <div className="text-right text-gray-500 mt-4 text-sm">
            {currentTime}
          </div>
        </form>
      </main>

      <style jsx>{`
        .step-number {
          width: 2rem;
          height: 2rem;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
        }
        .step-line {
          flex-grow: 1;
          height: 2px;
        }
      `}</style>
    </div>
  )
}