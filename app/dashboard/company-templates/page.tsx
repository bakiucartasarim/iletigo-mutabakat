'use client'

import { useState, useEffect } from 'react'
import QRCode from 'qrcode'

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
}

export default function CompanyTemplatesPage() {
  const [company, setCompany] = useState<Company | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('')

  const [templateData, setTemplateData] = useState<TemplateData>({
    templateName: 'Cari Mutabakat',
    headerText: '',
    introText: 'Giriş metnindeki cari hesabımız %DÖNEM% tarihi itibarıyle %TUTAR% %BORÇALACAK% bakiyesi vermektedir.',
    note1: 'Hata ve Unutma Müstesnadır.',
    note2: 'Mutabakat veya itirazınız 30 gün içinde bildirmedığiniz takdirde TTK\'nın 94. maddesi uyarınca mutabık sayılacağınızı hatırlatırız.'
  })

  useEffect(() => {
    fetchCompanyInfo()
    generateQRCode()
  }, [])

  const fetchCompanyInfo = async () => {
    try {
      const response = await fetch('/api/company/info')
      if (response.ok) {
        const data = await response.json()
        setCompany(data)
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

  const generateQRCode = async () => {
    try {
      const qrData = 'https://www.kolaymutabakat.com'
      const dataUrl = await QRCode.toDataURL(qrData, {
        width: 120,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      })
      setQrCodeDataUrl(dataUrl)
    } catch (error) {
      console.error('QR code generation error:', error)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // TODO: Save to database
      await new Promise(resolve => setTimeout(resolve, 1000))
      showToast('Şablon başarıyla güncellendi', 'success')
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
      <div className="w-1/3 bg-white border-r border-gray-300 flex flex-col">
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-3 font-semibold">
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
              Değişkenler: %DÖNEM%, %TUTAR%, %BORÇALACAK%
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
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex gap-3">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Kaydediliyor...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                ŞABLONU GÜNCELLE
              </>
            )}
          </button>
          <button
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-md font-medium transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            ŞABLONU SİL
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

                {/* QR Code */}
                <div className="ml-4">
                  {qrCodeDataUrl ? (
                    <img src={qrCodeDataUrl} alt="QR Code" className="w-24 h-24" />
                  ) : (
                    <div className="w-24 h-24 bg-gray-200"></div>
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
                  <strong>Sayın,</strong> {company?.name || 'kolaymutabakat.com'}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  <strong>TARİH:</strong> 24 Temmuz 2020
                </p>
                <p className="text-sm text-gray-600">
                  Şirketimiz nezdindeki cari hesabınız 24 Temmuz 2020 tarihi itibarıyle 10.000,00 ALACAK bakiyesi vermektedir.
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

              {/* Company Details */}
              <div className="mb-6 pb-4 border-b border-gray-300">
                <p className="text-sm font-semibold text-gray-900">{company?.name || 'Yeni Mutabakat Şirketi A.Ş.'}</p>
                <p className="text-sm text-gray-700">
                  <strong>Ticaret Sicil Numarası:</strong> {company?.tax_number || '808070'}
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
                  <p>1. {templateData.note1}</p>
                  <p>2. {templateData.note2}</p>
                  {/* Additional pre-defined notes */}
                  <p>3. 1. Mutabakat ile ilgili sorunlarınız için nolu telefondan Sayın ile görüşebilirsiniz.</p>
                  <p>4. 2. Mutabık olmanızız durumunda cari hesap ekstrenizi www.kolaymutabakat.com sitesine yüklemenizi yada asım.koc@dorufinansol.com adresine e-posta olarak göndermenizi rica ederiz.</p>
                </div>
              </div>

              {/* Footer DORU Section */}
              <div className="mt-6 flex justify-end">
                <div className="border-2 border-gray-800 p-3 text-center">
                  <p className="text-xs font-bold text-gray-900">DORU</p>
                  <p className="text-[10px] text-gray-600 leading-tight">
                    cari hesabınızın mükellef<br />
                    olacağı için asım.koc@dorufinansol.com<br />
                    ile iletişime geçiniz<br />
                    Adres: Vişne SK. P+068 Nişantaşı
                  </p>
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
