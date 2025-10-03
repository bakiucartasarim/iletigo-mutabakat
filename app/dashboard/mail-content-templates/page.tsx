'use client'

import { useState, useEffect } from 'react'

interface EmailTemplate {
  id: string
  company_id: number
  name: string
  subject: string
  content: string
  variables: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

interface Company {
  id: number
  name: string
  tax_number: string
}

export default function MailContentTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showEditor, setShowEditor] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null)
  const [company, setCompany] = useState<Company | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    content: '',
    isActive: true
  })

  useEffect(() => {
    fetchCompanyInfo()
  }, [])

  useEffect(() => {
    if (company) {
      loadTemplates()
    }
  }, [company])

  const fetchCompanyInfo = async () => {
    try {
      const response = await fetch('/api/company/info')
      if (response.ok) {
        const data = await response.json()
        setCompany(data)
      } else {
        setCompany({ id: 1, name: 'Test Şirketi', tax_number: '1234567890' })
      }
    } catch (error) {
      console.error('Error fetching company info:', error)
      setCompany({ id: 1, name: 'Test Şirketi', tax_number: '1234567890' })
    }
  }

  const loadTemplates = async () => {
    if (!company) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/mail-templates?company_id=${company.id}`)
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.data || [])
        if (data.data && data.data.length > 0) {
          setSelectedTemplate(data.data[0])
        }
      } else {
        showToast('Şablonlar yüklenemedi', 'error')
      }
    } catch (error) {
      console.error('Error loading templates:', error)
      showToast('Şablonlar yüklenirken hata oluştu', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!company) return

    setIsLoading(true)
    try {
      const url = editingTemplate ? '/api/mail-templates' : '/api/mail-templates'
      const method = editingTemplate ? 'PUT' : 'POST'

      const payload = editingTemplate
        ? {
            id: editingTemplate.id,
            company_id: company.id,
            name: formData.name,
            subject: formData.subject,
            content: formData.content,
            is_active: formData.isActive
          }
        : {
            company_id: company.id,
            name: formData.name,
            subject: formData.subject,
            content: formData.content,
            is_active: formData.isActive
          }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        showToast('Şablon kaydedildi', 'success')
        setShowEditor(false)
        loadTemplates()
      } else {
        const error = await response.json()
        showToast(error.error || 'Şablon kaydedilemedi', 'error')
      }
    } catch (error) {
      console.error('Error saving template:', error)
      showToast('Şablon kaydedilirken hata oluştu', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (template: EmailTemplate) => {
    setEditingTemplate(template)
    setFormData({
      name: template.name,
      subject: template.subject,
      content: template.content,
      isActive: template.is_active
    })
    setShowEditor(true)
  }

  const handleDelete = async (id: string) => {
    if (!company) return

    if (confirm('Bu şablonu silmek istediğinize emin misiniz?')) {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/mail-templates?id=${id}&company_id=${company.id}`, {
          method: 'DELETE'
        })

        if (response.ok) {
          showToast('Şablon silindi', 'success')
          if (selectedTemplate?.id === id) {
            setSelectedTemplate(null)
          }
          loadTemplates()
        } else {
          const error = await response.json()
          showToast(error.error || 'Şablon silinemedi', 'error')
        }
      } catch (error) {
        console.error('Error deleting template:', error)
        showToast('Şablon silinirken hata oluştu', 'error')
      } finally {
        setIsLoading(false)
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

  const availableVariables = [
    { key: '{{sirketAdi}}', desc: 'Karşı Taraf Şirket Adı (Excel)' },
    { key: '{{gonderenSirket}}', desc: 'Sizin Şirket Adınız' },
    { key: '{{mutabakatKodu}}', desc: 'Mutabakat Belge No (örn: ATL-72-145)' },
    { key: '{{referansKodu}}', desc: 'Güvenlik Referans Kodu (Link Token)' },
    { key: '{{donem}}', desc: 'Dönem Adı' },
    { key: '{{tarih}}', desc: 'Günün Tarihi' },
    { key: '{{tutar}}', desc: 'Tutar' },
    { key: '{{bakiyeTipi}}', desc: 'Bakiye Tipi (ALACAK/BORÇ)' },
    { key: '{{linkUrl}}', desc: 'Mutabakat Görüntüleme Link URL (href içinde kullanın)' },
  ]

  const defaultTemplateContent = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #2563eb; border-bottom: 3px solid #2563eb; padding-bottom: 10px;">
    Cari Mutabakat Mektubu
  </h2>

  <p style="margin: 20px 0;">Sayın {{sirketAdi}} Yetkilileri,</p>

  <p style="line-height: 1.6; color: #374151;">
    Şirketimiz nezdindeki cari hesabınız <strong>{{donem}}</strong> tarihi itibarıyla
    <strong style="color: #059669;">{{tutar}} TL {{bakiyeTipi}}</strong> bakiyesi vermektedir.
  </p>

  <div style="background: #f3f4f6; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0;">
    <p style="margin: 0; color: #1f2937;">
      <strong>Mutabakat Kodu:</strong> {{mutabakatKodu}}
    </p>
  </div>

  <p style="line-height: 1.6; color: #374151;">
    Mutabakat detaylarını görüntülemek ve onaylamak için lütfen aşağıdaki linke tıklayınız:
  </p>

  <div style="text-align: center; margin: 30px 0;">
    <a href="{{linkUrl}}"
       style="background: #2563eb; color: white; padding: 12px 30px; text-decoration: none;
              border-radius: 6px; display: inline-block; font-weight: 600;">
      Mutabakat Görüntüle
    </a>
  </div>

  <div style="background: #fef3c7; border: 1px solid #fbbf24; padding: 15px; margin: 20px 0; border-radius: 6px;">
    <p style="margin: 0; color: #92400e; font-size: 14px;">
      ⚠️ <strong>Önemli:</strong> Mutabakat veya itirazınızı 30 gün içinde bildirmediğiniz takdirde
      TTK'nın 94. maddesi uyarınca mutabık sayılacağınızı hatırlatırız.
    </p>
  </div>

  <p style="line-height: 1.6; color: #374151; font-size: 14px;">
    Saygılarımızla,<br>
    <strong>{{gonderenSirket}}</strong>
  </p>
</div>`

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col bg-gray-50">
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Yükleniyor...</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-blue-600 text-white px-4 py-2 flex items-center justify-between">
        <h1 className="text-base font-semibold">MAİL METİN ŞABLONLARI</h1>
        <button
          onClick={() => {
            setEditingTemplate(null)
            setFormData({
              name: 'Cari Mutabakat Mail Şablonu',
              subject: 'Mutabakat Mektubu - {{donem}}',
              content: defaultTemplateContent,
              isActive: true
            })
            setShowEditor(true)
          }}
          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded flex items-center gap-1.5 text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Yeni Şablon Ekle</span>
        </button>
      </div>

      {!showEditor ? (
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - Templates List */}
          <div className="w-64 bg-white border-r border-gray-300 flex flex-col">
            <div className="bg-blue-500 text-white px-3 py-2 font-medium text-sm">
              ŞABLON LİSTESİ
            </div>
            <div className="flex-1 overflow-y-auto">
              {templates.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <svg className="h-12 w-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm">Henüz şablon oluşturulmamış</p>
                  <p className="text-xs mt-1">Yukarıdaki "Yeni Şablon Ekle" butonuna tıklayarak başlayın</p>
                </div>
              ) : (
                <div className="divide-y">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      onClick={() => setSelectedTemplate(template)}
                      className={`p-2 cursor-pointer hover:bg-blue-50 transition-colors ${
                        selectedTemplate?.id === template.id ? 'bg-blue-100 border-l-4 border-blue-600' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-gray-900 truncate">{template.name}</h3>
                          <p className="text-xs text-gray-500 mt-0.5 truncate">
                            <strong>Konu:</strong> {template.subject}
                          </p>
                        </div>
                        <div className="flex gap-1 ml-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEdit(template)
                            }}
                            className="p-0.5 text-blue-600 hover:bg-blue-100 rounded"
                            title="Düzenle"
                          >
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(template.id)
                            }}
                            className="p-0.5 text-red-600 hover:bg-red-100 rounded"
                            title="Sil"
                          >
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div className="mt-2">
                        <span className={`inline-block px-2 py-1 text-xs rounded ${
                          template.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {template.is_active ? 'Aktif' : 'Pasif'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Preview */}
          <div className="flex-1 flex flex-col bg-gray-100">
            <div className="bg-gray-200 px-3 py-2 font-medium text-gray-700 flex items-center justify-between border-b text-sm">
              <span>ÖNİZLEME</span>
              {selectedTemplate && (
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="text-gray-600 hover:text-gray-800 text-xs"
                >
                  Önizlemeyi Kapat
                </button>
              )}
            </div>
            <div className="flex-1 overflow-auto p-3">
              {selectedTemplate ? (
                <div className="max-w-4xl mx-auto">
                  {/* Email Preview Card */}
                  <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                    {/* Email Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-2 border-b">
                      <div className="flex items-center gap-2 text-xs">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="font-semibold">Konu:</span>
                        <span className="text-xs">{selectedTemplate.subject}</span>
                      </div>
                    </div>

                    {/* Email Body */}
                    <div className="p-4 text-sm">
                      <div
                        className="text-gray-800 leading-relaxed space-y-4 prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{
                          __html: selectedTemplate.content
                            .replace(/\{\{linkUrl\}\}/g, 'https://ornek-mutabakat-linki.com/XXXXX')
                            .replace(/\{\{gonderenSirket\}\}/g, company?.name || 'Şirket Adı')
                            .replace(/\{\{vergiNo\}\}/g, company?.tax_number || '0000000000')
                            .replace(/\{\{sirketAdi\}\}/g, 'Örnek Cari Hesap')
                            .replace(/\{\{tarih\}\}/g, new Date().toLocaleDateString('tr-TR'))
                            .replace(/\{\{donem\}\}/g, 'Ocak 2025')
                            .replace(/\{\{tutar\}\}/g, '10.000,00')
                            .replace(/\{\{bakiyeTipi\}\}/g, 'ALACAK')
                            .replace(/\{\{mutabakatKodu\}\}/g, 'ATL-72-145')
                            .replace(/\{\{referansKodu\}\}/g, 'XXXXXXXXXXXXX')
                        }}
                      />
                    </div>

                    {/* Email Footer */}
                    <div className="bg-gray-50 p-3 border-t">
                      <p className="text-xs text-gray-500">
                        Bu email otomatik olarak oluşturulmuştur.
                      </p>
                    </div>
                  </div>

                  {/* Template Info */}
                  <div className="mt-3 bg-blue-50 rounded-lg p-3 border border-blue-200">
                    <h3 className="text-sm font-semibold text-blue-900 mb-2">Şablon Bilgileri</h3>
                    <div className="text-xs text-blue-800 space-y-1">
                      <p><strong>Şablon Adı:</strong> {selectedTemplate.name}</p>
                      <p><strong>Email Konusu:</strong> {selectedTemplate.subject}</p>
                      <p><strong>Durum:</strong> {selectedTemplate.is_active ? 'Aktif' : 'Pasif'}</p>
                    </div>
                    <div className="mt-2">
                      <p className="text-xs font-medium text-blue-900 mb-1">Kullanılan Değişkenler:</p>
                      <div className="flex flex-wrap gap-1">
                        {Array.isArray(selectedTemplate.variables) && selectedTemplate.variables.map((variable) => (
                          <span key={variable} className="px-1.5 py-0.5 text-xs bg-white text-blue-700 rounded border border-blue-300">
                            {`{{${variable}}}`}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <svg className="h-16 w-16 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm">Önizlemek için sol taraftan bir şablon seçin</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Editor Modal */
        <div className="flex-1 overflow-auto p-3">
          <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-lg">
            <div className="p-3 border-b border-gray-200 bg-blue-600 text-white rounded-t-lg">
              <h2 className="text-base font-semibold">
                {editingTemplate ? 'Şablonu Düzenle' : 'Yeni Şablon Oluştur'}
              </h2>
            </div>

            <div className="p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Şablon Adı *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Örn: Cari Mutabakat Mail Şablonu"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="isActive" className="text-xs font-medium text-gray-700">Şablon Aktif</label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Email Konusu *</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Örn: Mutabakat Mektubu - {{referansKodu}}"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Email İçeriği (HTML) *</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={12}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-xs"
                  placeholder="HTML email içeriği..."
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <h4 className="text-xs font-medium text-blue-900 mb-2">Kullanılabilir Değişkenler</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
                  {availableVariables.map((variable) => (
                    <button
                      key={variable.key}
                      onClick={() => setFormData({ ...formData, content: formData.content + ' ' + variable.key })}
                      className="text-left px-2 py-1.5 bg-white border border-blue-200 rounded hover:bg-blue-100"
                    >
                      <div className="font-mono text-blue-700 text-xs">{variable.key}</div>
                      <div className="text-xs text-gray-600 truncate">{variable.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-3 border-t border-gray-200 flex gap-2 bg-gray-50 rounded-b-lg">
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="px-4 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-1.5"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                    Kaydediliyor...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    KAYDET
                  </>
                )}
              </button>
              <button
                onClick={() => setShowEditor(false)}
                className="px-4 py-1.5 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm font-medium"
              >
                İPTAL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
