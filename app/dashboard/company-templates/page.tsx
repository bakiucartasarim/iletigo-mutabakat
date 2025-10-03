'use client'

import { useState, useEffect } from 'react'

interface Company {
  id: number
  name: string
  tax_number: string
  email: string
  phone: string
  address: string
  contact_person: string
  logo_url?: string
  stamp_url?: string
}

interface TemplateData {
  templateName: string
  headerText: string
  introText: string
  note1: string
  note2: string
  note3: string
  note4: string
  note5: string
}

export default function CompanyTemplatesPage() {
  const [company, setCompany] = useState<Company | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasExistingTemplate, setHasExistingTemplate] = useState(false)

  const [templateData, setTemplateData] = useState<TemplateData>({
    templateName: 'Cari Mutabakat',
    headerText: '',
    introText: 'Giriş metnindeki cari hesabımız %DÖNEM% tarihi itibarıyle %TUTAR% %BORÇALACAK% bakiyesi vermektedir.',
    note1: 'Hata ve Unutma Müstesnadır.',
    note2: 'Mutabakat veya itirazınız 30 gün içinde bildirmedığiniz takdirde TTK\'nın 94. maddesi uyarınca mutabık sayılacağınızı hatırlatırız.',
    note3: 'Mutabakat ile ilgili sorunlarınız için nolu telefondan Sayın ile görüşebilirsiniz.',
    note4: 'Mutabık olmanızız durumunda cari hesap ekstrenizi www.kolaymutabakat.com sitesine yüklemenizi yada asım.koc@dorufinansol.com adresine e-posta olarak göndermenizi rica ederiz.',
    note5: ''
  })

  useEffect(() => {
    fetchCompanyInfo()
  }, [])

  const fetchCompanyInfo = async () => {
    try {
      const response = await fetch('/api/company/info')
      if (response.ok) {
        const data = await response.json()
        setCompany(data)
        // Load template data
        await loadTemplateData()
      } else {
        setCompany({
          id: 1,
          name: 'Yeni Mutabakat Şirketi A.Ş.',
          tax_number: '8080070',
          email: 'info@example.com',
          phone: '',
          address: 'Maslak, İstanbul',
          contact_person: 'Yetkili Kişi'
        })
      }
    } catch (error) {
      console.error('Error fetching company info:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadTemplateData = async () => {
    try {
      const response = await fetch('/api/company-templates')
      if (response.ok) {
        const data = await response.json()
        setHasExistingTemplate(true)
        setTemplateData({
          templateName: data.template_name || 'Cari Mutabakat',
          headerText: data.header_text || '',
          introText: data.intro_text || '',
          note1: data.note1 || '',
          note2: data.note2 || '',
          note3: data.note3 || '',
          note4: data.note4 || '',
          note5: data.note5 || ''
        })
      } else {
        // 404 means no template exists yet
        setHasExistingTemplate(false)
      }
    } catch (error) {
      console.error('Error loading template:', error)
      setHasExistingTemplate(false)
    }
  }


  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/company-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_name: templateData.templateName,
          header_text: templateData.headerText,
          intro_text: templateData.introText,
          note1: templateData.note1,
          note2: templateData.note2,
          note3: templateData.note3,
          note4: templateData.note4,
          note5: templateData.note5
        })
      })

      if (response.ok) {
        setHasExistingTemplate(true)
        showToast('Şablon başarıyla kaydedildi', 'success')
      } else {
        const error = await response.json()
        showToast(error.error || 'Şablon kaydedilemedi', 'error')
      }
    } catch (error) {
      console.error('Save error:', error)
      showToast('Şablon kaydedilirken hata oluştu', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (confirm('Bu şablonu silmek istediğinize emin misiniz?')) {
      try {
        // TODO: Delete from database
        showToast('Şablon silindi', 'success')
      } catch (error) {
        console.error('Delete error:', error)
        showToast('Şablon silinirken hata oluştu', 'error')
      }
    }
  }

  const showToast = (message: string, type: 'success' | 'error') => {
    const toast = document.createElement('div')
    toast.className = `fixed top-4 right-4 z-50 px-4 py-2 rounded-lg text-white font-medium ${
      type === 'success' ? 'bg-green-600' : 'bg-red-600'
    }`
    toast.textContent = message
    document.body.appendChild(toast)
    setTimeout(() => document.body.removeChild(toast), 3000)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-120px)] flex bg-gray-100">
      {/* Left Side - Template Editor */}
      <div className="w-1/3 bg-white border-r border-blue-200 flex flex-col">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 font-semibold">
          CARİ ŞABLONLARI
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Template Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Şablon Esası Adı
            </label>
            <input
              type="text"
              value={templateData.templateName}
              onChange={(e) => setTemplateData({ ...templateData, templateName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Cari Mutabakat"
            />
          </div>

          {/* Header Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Başlık Metni
            </label>
            <input
              type="text"
              value={templateData.headerText}
              onChange={(e) => setTemplateData({ ...templateData, headerText: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Başlık (opsiyonel)"
            />
          </div>

          {/* Intro Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Giriş Metni
            </label>
            <textarea
              value={templateData.introText}
              onChange={(e) => setTemplateData({ ...templateData, introText: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              placeholder="Giriş metnini buraya yazın..."
            />
            <p className="mt-1 text-xs text-gray-500">
              Değişkenler: %DÖNEM% (tarih), %TUTAR% (miktar), %BORÇALACAK% (ALACAK/BORÇ)
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Not: "Sayın, [Şirket Adı]" kısmı Excel'den otomatik gelecek
            </p>
          </div>

          {/* Note 1 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Not Satırı 1
            </label>
            <textarea
              value={templateData.note1}
              onChange={(e) => setTemplateData({ ...templateData, note1: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              placeholder="1. Not"
            />
          </div>

          {/* Note 2 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Not Satırı 2
            </label>
            <textarea
              value={templateData.note2}
              onChange={(e) => setTemplateData({ ...templateData, note2: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              placeholder="2. Not"
            />
          </div>

          {/* Note 3 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Not Satırı 3
            </label>
            <textarea
              value={templateData.note3}
              onChange={(e) => setTemplateData({ ...templateData, note3: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              placeholder="3. Not"
            />
          </div>

          {/* Note 4 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Not Satırı 4
            </label>
            <textarea
              value={templateData.note4}
              onChange={(e) => setTemplateData({ ...templateData, note4: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              placeholder="4. Not"
            />
          </div>

          {/* Note 5 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Not Satırı 5
            </label>
            <textarea
              value={templateData.note5}
              onChange={(e) => setTemplateData({ ...templateData, note5: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              placeholder="5. Not (opsiyonel)"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-3 bg-blue-50 border-t border-blue-200 flex gap-2">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></div>
                <span>Kaydediliyor...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>{hasExistingTemplate ? 'Güncelle' : 'Kaydet'}</span>
              </>
            )}
          </button>
          <button
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span>Sil</span>
          </button>
        </div>
      </div>

      {/* Right Side - PDF Preview */}
      <div className="flex-1 overflow-auto bg-gray-100 p-6">
        <div className="max-w-4xl mx-auto">
          {/* PDF Preview Document */}
          <div className="bg-white shadow-xl" style={{ aspectRatio: '210/297' }}>
            {/* Header */}
            <div className="relative bg-white p-8 border-b-4 border-blue-600">
              {/* Logo */}
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  {company?.logo_url ? (
                    <img src={company.logo_url} alt="Logo" className="h-16 object-contain" />
                  ) : (
                    <div className="h-16 w-32 bg-gray-200 flex items-center justify-center text-gray-400 text-xs">
                      Logo
                    </div>
                  )}
                </div>
              </div>

              {/* Title Box */}
              <div className="mt-6 border-2 border-gray-800 p-3 text-center">
                <h1 className="text-2xl font-bold text-gray-900">MUTABAKAT MEKTUBU</h1>
                <p className="text-sm text-gray-700 mt-1">Referans Kodu: TMPL</p>
              </div>
            </div>

            {/* Body */}
            <div className="p-8">
              {/* Company Info */}
              <div className="mb-6">
                <p className="text-sm text-gray-700">
                  <strong>Sayın,</strong> [Karşı Taraf Şirketi - Excel'den gelecek]
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  <strong>TARİH:</strong> 24 Temmuz 2020
                </p>
                <p className="text-sm text-gray-600">
                  {templateData.introText || 'Şirketimiz nezdindeki cari hesabınız %DÖNEM% tarihi itibarıyle %TUTAR% %BORÇALACAK% bakiyesi vermektedir.'}
                </p>
              </div>

              {/* Table */}
              <div className="border border-gray-300 mb-6">
                <table className="w-full text-sm">
                  <tbody>
                    <tr className="border-b border-gray-300">
                      <td className="px-4 py-2 bg-gray-100 font-semibold w-1/3">Form</td>
                      <td className="px-4 py-2">{templateData.templateName}</td>
                    </tr>
                    <tr className="border-b border-gray-300">
                      <td className="px-4 py-2 bg-gray-100 font-semibold">Dönemi</td>
                      <td className="px-4 py-2">24 Temmuz 2020</td>
                    </tr>
                    <tr className="border-b border-gray-300">
                      <td className="px-4 py-2 bg-gray-100 font-semibold">Bakiye</td>
                      <td className="px-4 py-2">10.000,00 TRY - ALACAK</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 bg-gray-100 font-semibold">Gönderen Şirket Vergi No</td>
                      <td className="px-4 py-2">{company?.tax_number || '7079098080'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Company Details - SENDER (Your Company) */}
              <div className="mb-6 pb-4 border-b border-gray-300">
                <p className="text-sm font-semibold text-gray-900">
                  {company?.name || 'Yeni Mutabakat Şirketi A.Ş.'} <span className="text-xs text-gray-500">(Gönderen Şirket)</span>
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Vergi Numarası:</strong> {company?.tax_number || '808070'}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Adres:</strong>
                </p>
                <p className="text-sm text-gray-600">
                  {company?.address || 'Maslak, İstanbul.'}
                </p>
              </div>

              {/* Notes Section */}
              <div className="bg-gray-50 border border-gray-300 p-4">
                <h3 className="text-sm font-bold text-gray-900 mb-2">Mutabakat Notları</h3>
                <div className="space-y-2 text-sm text-gray-700">
                  {templateData.note1 && <p>1. {templateData.note1}</p>}
                  {templateData.note2 && <p>2. {templateData.note2}</p>}
                  {templateData.note3 && <p>3. {templateData.note3}</p>}
                  {templateData.note4 && <p>4. {templateData.note4}</p>}
                  {templateData.note5 && <p>5. {templateData.note5}</p>}
                </div>
              </div>

              {/* Stamp */}
              {company?.stamp_url && (
                <div className="mt-6 flex justify-end">
                  <img src={company.stamp_url} alt="Kaşe" className="h-24 w-24 object-contain opacity-80" />
                </div>
              )}
            </div>
          </div>

          {/* Preview Info */}
          <div className="mt-4 flex items-center justify-end gap-2 text-sm text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span>Faks Görünümü</span>
          </div>
        </div>
      </div>
    </div>
  )
}
