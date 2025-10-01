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

export default function MailTemplatesPage() {
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
    { key: '{{sirketAdi}}', desc: 'Şirket Adı' },
    { key: '{{referansKodu}}', desc: 'Referans Kodu' },
    { key: '{{tarih}}', desc: 'Tarih' },
    { key: '{{tutar}}', desc: 'Tutar' },
    { key: '{{bakiyeTipi}}', desc: 'Bakiye Tipi (ALACAK/BORÇ)' },
    { key: '{{adres}}', desc: 'Adres' },
    { key: '{{vergiNo}}', desc: 'Vergi No' },
  ]

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Yükleniyor...</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">CARİ ŞABLONLAR</h1>
        <button
          onClick={() => {
            setEditingTemplate(null)
            setFormData({ name: '', subject: '', content: '', isActive: true })
            setShowEditor(true)
          }}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2"
        >
          <span>Yeni Şablon Ekle</span>
        </button>
      </div>

      {!showEditor ? (
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - Templates List */}
          <div className="w-80 bg-white border-r border-gray-300 flex flex-col">
            <div className="bg-blue-500 text-white px-4 py-3 font-medium">
              ÜSTTE ŞABLONLAR
            </div>
            <div className="flex-1 overflow-y-auto">
              {templates.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <p>Henüz şablon oluşturulmamış</p>
                </div>
              ) : (
                <div className="divide-y">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      onClick={() => setSelectedTemplate(template)}
                      className={`p-4 cursor-pointer hover:bg-blue-50 transition-colors ${
                        selectedTemplate?.id === template.id ? 'bg-blue-100 border-l-4 border-blue-600' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">{template.name}</h3>
                          <p className="text-xs text-gray-500 mt-1">
                            <strong>Giriş Metni:</strong>
                          </p>
                          <div
                            className="text-xs text-gray-600 mt-1 line-clamp-2"
                            dangerouslySetInnerHTML={{ __html: template.content.substring(0, 80) + '...' }}
                          />
                        </div>
                        <div className="flex gap-1 ml-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEdit(template)
                            }}
                            className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                            title="Düzenle"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(template.id)
                            }}
                            className="p-1 text-red-600 hover:bg-red-100 rounded"
                            title="Sil"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <div className="bg-gray-200 px-4 py-3 font-medium text-gray-700 flex items-center justify-between border-b">
              <span>ÖNİZLEME ŞABLONLARI</span>
              {selectedTemplate && (
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="text-gray-600 hover:text-gray-800 text-sm"
                >
                  Önizlemeyi Kapat
                </button>
              )}
            </div>
            <div className="flex-1 overflow-auto p-6">
              {selectedTemplate ? (
                <div className="max-w-4xl mx-auto">
                  {/* Preview Card */}
                  <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 text-center">
                      <div className="mb-4">
                        <img src="/logo.png" alt="Logo" className="h-12 mx-auto" onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none'
                        }} />
                      </div>
                      <h2 className="text-2xl font-bold">MUTABAKAT MEKTUBU</h2>
                      <p className="text-sm mt-2">Referans Kodu: {selectedTemplate.subject.includes('{{referansKodu}}') ? 'TMPL' : selectedTemplate.name}</p>
                    </div>

                    {/* Content */}
                    <div className="p-8">
                      <div
                        className="text-gray-800 leading-relaxed space-y-4"
                        dangerouslySetInnerHTML={{ __html: selectedTemplate.content }}
                      />
                    </div>

                    {/* Footer */}
                    <div className="bg-gray-50 p-6 border-t">
                      <div className="text-sm text-gray-600">
                        <p className="font-semibold">{company?.name || 'Şirket Adı'}</p>
                        <p>Vergi No: {company?.tax_number || '0000000000'}</p>
                        <p className="mt-2 text-xs text-gray-500">
                          Bu email otomatik olarak oluşturulmuştur.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Template Info */}
                  <div className="mt-6 bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <h3 className="font-semibold text-blue-900 mb-2">Şablon Bilgileri</h3>
                    <div className="text-sm text-blue-800 space-y-1">
                      <p><strong>Şablon Adı:</strong> {selectedTemplate.name}</p>
                      <p><strong>Email Konusu:</strong> {selectedTemplate.subject}</p>
                      <p><strong>Durum:</strong> {selectedTemplate.is_active ? 'Aktif' : 'Pasif'}</p>
                    </div>
                    <div className="mt-3">
                      <p className="text-sm font-medium text-blue-900 mb-2">Kullanılan Değişkenler:</p>
                      <div className="flex flex-wrap gap-2">
                        {Array.isArray(selectedTemplate.variables) && selectedTemplate.variables.map((variable) => (
                          <span key={variable} className="px-2 py-1 text-xs bg-white text-blue-700 rounded border border-blue-300">
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
                    <svg className="h-24 w-24 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-lg">Önizlemek için sol taraftan bir şablon seçin</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Editor Modal */
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg">
            <div className="p-6 border-b border-gray-200 bg-blue-600 text-white rounded-t-lg">
              <h2 className="text-xl font-semibold">
                {editingTemplate ? 'Şablonu Düzenle' : 'Yeni Şablon Oluştur'}
              </h2>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Şablon Adı *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Örn: Cari Mutabakat Mektubu"
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
                  <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Şablon Aktif</label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Konusu *</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Örn: Mutabakat Mektubu - {{referansKodu}}"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email İçeriği (HTML) *</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={12}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                  placeholder="HTML email içeriği..."
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-3">Kullanılabilir Değişkenler</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {availableVariables.map((variable) => (
                    <button
                      key={variable.key}
                      onClick={() => setFormData({ ...formData, content: formData.content + ' ' + variable.key })}
                      className="text-left px-3 py-2 bg-white border border-blue-200 rounded hover:bg-blue-100 text-sm"
                    >
                      <div className="font-mono text-blue-700">{variable.key}</div>
                      <div className="text-xs text-gray-600">{variable.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3 bg-gray-50 rounded-b-lg">
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isLoading ? 'Kaydediliyor...' : 'ŞABLONU GÜNCELLE'}
              </button>
              <button
                onClick={() => setShowEditor(false)}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
              >
                ŞABLONU SİL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
