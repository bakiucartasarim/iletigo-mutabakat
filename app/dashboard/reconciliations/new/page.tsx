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
  const [excelData, setExcelData] = useState<any[]>([]) // Excel data storage
  const [isReminderDropdownOpen, setIsReminderDropdownOpen] = useState(false)
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
    reconciliation_period: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    related_type: 'cari_hesap_bakiye',
    reminder_days: [],
    sender_branch: 'merkez',
    language: 'tr',
    template: 'cari_mutabakat_tr',
    // Özel ayarlar
    auto_request_statement: false,
    email_notification: false,
    auto_document_request: false
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

  const handleNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Mock Excel data - Bu gerçek uygulamada Excel parsing kütüphanesi ile yapılacak
      const mockData = [
        {
          siraNo: 2,
          cariHesapKodu: "KM_01",
          cariHesapAdi: "KM_01 Test Cari",
          sube: "Müşteri",
          tutar: 1000,
          birim: "TRL",
          borcAlacak: "ALACAK",
          vergiDairesi: "Kadıköy",
          vergiNo: "7999919985",
          faksNumarasi: "2123120000",
          ilgiliKisiEposta: "test@kolaymuhasebat.com",
          notlar: "Sil"
        },
        {
          siraNo: 3,
          cariHesapKodu: "KM_01",
          cariHesapAdi: "KM_01 Test Cari",
          sube: "Müşteri",
          tutar: 7845,
          birim: "USD",
          borcAlacak: "BORÇ",
          vergiDairesi: "Kadıköy",
          vergiNo: "7999919985",
          faksNumarasi: "2123120000",
          ilgiliKisiEposta: "soru.koc@kolaymuhasebat.com",
          notlar: "Sil"
        },
        {
          siraNo: 4,
          cariHesapKodu: "KM_07",
          cariHesapAdi: "KM_07 Test Cari",
          sube: "Müşteri",
          tutar: 7300,
          birim: "TRY",
          borcAlacak: "BORÇ",
          vergiDairesi: "",
          vergiNo: "5123440001",
          faksNumarasi: "",
          ilgiliKisiEposta: "muhasebat@kolay0test.com",
          notlar: "Sil"
        },
        {
          siraNo: 5,
          cariHesapKodu: "KM_05",
          cariHesapAdi: "KM_05 Test Cari",
          sube: "Müşteri",
          tutar: 8000,
          birim: "EUR",
          borcAlacak: "BORÇ",
          vergiDairesi: "Kadıköy",
          vergiNo: "8100002233",
          faksNumarasi: "",
          ilgiliKisiEposta: "muhasebat@km05test.com",
          notlar: "Sil"
        }
      ]
      setExcelData(mockData)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (currentStep === 1 || currentStep === 2) {
      // İlk iki adımda sadece bir sonraki adıma geç
      handleNextStep()
      return
    }

    if (currentStep === 3) {
      // Son adımda direkt olarak mutabakat listesine yönlendir
      setSuccessMessage('✅ Mutabakat dönemi başarıyla oluşturuldu!')
      setTimeout(() => {
        router.push('/dashboard/reconciliations')
      }, 1500)
    }
  }

  const steps = [
    { number: 1, title: 'Mutabakat Ayarları', active: currentStep >= 1 },
    { number: 2, title: 'Mutabakat Dosyası', active: currentStep >= 2 },
    { number: 3, title: 'Sonuç', active: currentStep >= 3 }
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


      <main className="container mx-auto px-4 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="grid grid-cols-3 gap-4 items-start">
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
          {/* Step 1: Mutabakat Ayarları */}
          {currentStep === 1 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Mutabakat Türü */}
                <div className="border border-blue-100 rounded-lg p-6" style={{ backgroundColor: '#f0f8ff' }}>
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
                          type="date"
                          value={formData.reconciliation_period}
                          onChange={handleInputChange}
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
                          type="date"
                          value={formData.end_date}
                          onChange={handleInputChange}
                        />
                        <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 pointer-events-none">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Genel Ayarlar */}
                <div className="border border-blue-100 rounded-lg p-6" style={{ backgroundColor: '#f0f8ff' }}>
                  <h3 className="text-lg font-semibold mb-4 text-gray-900">Genel Ayarlar</h3>
                  <div className="space-y-4">
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        E-posta ile Hatırlatma Günleri
                      </label>
                      <div className="relative">
                        <button
                          type="button"
                          className="w-full rounded-md border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent px-3 py-2 text-left flex items-center justify-between"
                          onClick={() => setIsReminderDropdownOpen(!isReminderDropdownOpen)}
                        >
                          <span className="text-gray-700">
                            {formData.reminder_days.length === 0
                              ? 'Gün seçiniz'
                              : `${formData.reminder_days.length} gün seçili`}
                          </span>
                          <svg className={`w-5 h-5 text-gray-400 transform transition-transform ${isReminderDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        {isReminderDropdownOpen && (
                          <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg">
                            <div className="py-1">
                              {[
                                { value: 'pazartesi', label: 'Pazartesi' },
                                { value: 'sali', label: 'Salı' },
                                { value: 'carsamba', label: 'Çarşamba' },
                                { value: 'persembe', label: 'Perşembe' },
                                { value: 'cuma', label: 'Cuma' },
                                { value: 'cumartesi', label: 'Cumartesi' },
                                { value: 'pazar', label: 'Pazar' }
                              ].map((day) => (
                                <label key={day.value} className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={formData.reminder_days.includes(day.value)}
                                    onChange={(e) => {
                                      const { checked } = e.target
                                      const updatedDays = checked
                                        ? [...formData.reminder_days, day.value]
                                        : formData.reminder_days.filter(d => d !== day.value)
                                      setFormData(prev => ({ ...prev, reminder_days: updatedDays }))
                                    }}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                  />
                                  <span className="ml-2 text-sm text-gray-900">{day.label}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
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

              {/* Özel Ayarlar */}
              <div className="border border-blue-100 rounded-lg p-6" style={{ backgroundColor: '#f0f8ff' }}>
                <h3 className="text-lg font-semibold mb-4 text-gray-900">Özel Ayarlar</h3>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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
                      Mutabık Olmayanlardan Ekstre Talep Et.
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
                      İmzalı Dokümanı Otomatik Doküman Talep Et.
                    </label>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Step 2: Mutabakat Dosyası */}
          {currentStep === 2 && (
            <>
              {/* File Upload Section - Smaller */}
              <div className="bg-green-50 border-2 border-dashed border-green-300 rounded-lg p-6 max-w-2xl mx-auto">
                <div className="text-center">
                  <svg className="mx-auto h-8 w-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 48 48">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" />
                  </svg>
                  <div className="mt-3">
                    <label htmlFor="excel-file" className="cursor-pointer">
                      <span className="mt-2 block text-sm font-medium text-gray-900">
                        Excel dosyasını buraya sürükleyin veya seçin
                      </span>
                      <input
                        id="excel-file"
                        name="excel-file"
                        type="file"
                        className="sr-only"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleFileUpload}
                      />
                      <span className="mt-1 block text-xs text-gray-500">
                        .xlsx, .xls veya .csv formatında dosya yükleyin
                      </span>
                    </label>
                  </div>
                  <div className="mt-4 flex justify-center space-x-3">
                    <button
                      type="button"
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors text-sm"
                      onClick={() => document.getElementById('excel-file')?.click()}
                    >
                      Dosya Seç
                    </button>
                    <button
                      type="button"
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors text-sm"
                    >
                      Yeni Mutabakat Kaydı
                    </button>
                  </div>
                </div>
              </div>

              {/* Data Table */}
              {excelData.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Mutabakat Dosyası</h3>
                    <div className="mt-2 flex space-x-4">
                      <button className="text-blue-600 hover:text-blue-800 font-medium">Dosya Seç</button>
                      <button className="text-green-600 hover:text-green-800 font-medium">Yeni Mutabakat Kaydı</button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hata</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sıra No</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cari Hesap Kodu</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cari Hesap Adı</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Şube</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cari Hesap Türü</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tutar</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Birim</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Borç/Alacak</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vergi Dairesi</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vergi No</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Faks Numarası</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İlgili Kişi e-posta adresi</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notlar</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {excelData.map((row, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.siraNo}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.siraNo}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.cariHesapKodu}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.cariHesapAdi}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.sube}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">📋</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.tutar}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.birim}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.borcAlacak}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.vergiDairesi}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.vergiNo}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.faksNumarasi}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">{row.ilgiliKisiEposta}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">{row.notlar}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                      DOSYAYI İNDİR
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Step 3: Sonuç */}
          {currentStep === 3 && (
            <>
              {/* Results Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {/* Mutabakat Dönemi */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-blue-100 rounded-full">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-blue-800">Mutabakat Dönemi</h3>
                      <p className="text-lg font-bold text-blue-900">{formData.reconciliation_period || new Date().toLocaleDateString('tr-TR')}</p>
                    </div>
                  </div>
                </div>

                {/* Gönderen */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-green-100 rounded-full">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-green-800">Gönderen</h3>
                      <p className="text-lg font-bold text-green-900">
                        {formData.sender_branch === 'merkez' ? 'Merkez' :
                         formData.sender_branch === 'ankara' ? 'Ankara Şubesi' :
                         formData.sender_branch === 'istanbul' ? 'İstanbul Şubesi' :
                         formData.sender_branch === 'izmir' ? 'İzmir Şubesi' :
                         'Merkez'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* E-posta Adresi */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-yellow-100 rounded-full">
                      <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-yellow-800">E-posta Adresi</h3>
                      <p className="text-2xl font-bold text-yellow-900">{excelData.filter(row => row.ilgiliKisiEposta).length}</p>
                    </div>
                  </div>
                </div>

                {/* Tutar Toplamı TL */}
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-indigo-100 rounded-full">
                      <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-indigo-800">Tutar Toplamı (TL)</h3>
                      <p className="text-2xl font-bold text-indigo-900">
                        {excelData
                          .filter(row => row.birim === 'TRL' || row.birim === 'TRY')
                          .reduce((sum, row) => sum + parseFloat(row.tutar || 0), 0)
                          .toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tutar Toplamı USD */}
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-purple-100 rounded-full">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-purple-800">Tutar Toplamı (USD)</h3>
                      <p className="text-2xl font-bold text-purple-900">
                        ${excelData
                          .filter(row => row.birim === 'USD')
                          .reduce((sum, row) => sum + parseFloat(row.tutar || 0), 0)
                          .toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">İşlemler</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Excel İndir</span>
                  </button>

                  <button className="px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors flex items-center justify-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span>Ön İzleme</span>
                  </button>
                </div>
              </div>

              {/* Summary Information */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Mutabakat Özeti</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Genel Bilgiler</h4>
                    <ul className="space-y-1 text-sm text-gray-600">
                      <li>• Mutabakat Türü: {formData.type === 'cari_mutabakat' ? 'Cari Mutabakat' : formData.type}</li>
                      <li>• Dil: {formData.language === 'tr' ? 'Türkçe' : formData.language}</li>
                      <li>• Şablon: {formData.template}</li>
                      <li>• Gönderen Şube: {formData.sender_branch}</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">İstatistikler</h4>
                    <ul className="space-y-1 text-sm text-gray-600">
                      <li>• Borç Kayıtları: {excelData.filter(row => row.borcAlacak === 'BORÇ').length}</li>
                      <li>• Alacak Kayıtları: {excelData.filter(row => row.borcAlacak === 'ALACAK').length}</li>
                      <li>• Farklı Para Birimleri: {[...new Set(excelData.map(row => row.birim))].join(', ')}</li>
                      <li>• Oluşturulma Tarihi: {new Date().toLocaleDateString('tr-TR')}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-8">
            {/* Back Button */}
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handlePrevStep}
                className="px-6 py-3 bg-gray-500 text-white font-bold rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 flex items-center transition-colors"
              >
                <svg className="mr-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Geri
              </button>
            )}

            {/* Next/Submit Button */}
            <div className={currentStep === 1 ? "ml-auto" : ""}>
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
                    {currentStep === 3 ? 'Mutabakat Dönemi Oluştur' : 'Devam'}
                    <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>
            </div>
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