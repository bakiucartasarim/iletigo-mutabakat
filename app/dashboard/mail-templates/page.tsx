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
  const [isLoading, setIsLoading] = useState(true) // Start with true
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
        // Fallback to mock company for testing
        setCompany({ id: 1, name: 'Test Şirketi', tax_number: '1234567890' })
      }
    } catch (error) {
      console.error('Error fetching company info:', error)
      // Fallback to mock company
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
    <div className="p-6 max-w-7xl mx-auto">
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Yükleniyor...</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
            Cari Şablon
          </h1>
          <p className="text-gray-600 mt-2">
            {company ? `${company.name} için email şablonları` : 'Email şablonlarını yönetin'}
          </p>
        </div>
        <button
          onClick={() => {
            setEditingTemplate(null)
            setFormData({ name: '', subject: '', content: '', isActive: true })
            setShowEditor(true)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Yeni Şablon
        </button>
      </div>

      {/* Templates List */}
      {!showEditor && (
        <div className="grid grid-cols-1 gap-6">
          {templates.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <svg className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz şablon oluşturulmamış</h3>
              <p className="text-gray-600 mb-4">İlk email şablonunuzu oluşturmak için "Yeni Şablon" butonuna tıklayın</p>
            </div>
          ) : (
            templates.map((template) => (
              <div key={template.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        template.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {template.is_active ? 'Aktif' : 'Pasif'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      <strong>Konu:</strong> {template.subject}
                    </p>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4 max-h-48 overflow-y-auto">
                      <div className="text-sm text-gray-800 whitespace-pre-wrap break-words" dangerouslySetInnerHTML={{ __html: template.content }} />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(template.variables) && template.variables.map((variable) => (
                        <span key={variable} className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded border border-blue-200">
                          {`{{${variable}}}`}
                        </span>
                      ))}
                    </div>
                  </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleEdit(template)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))
          )}
        </div>
      )}

      {/* Template Editor */}
      {showEditor && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold">
              {editingTemplate ? 'Şablonu Düzenle' : 'Yeni Şablon Oluştur'}
            </h2>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Şablon Adı</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Konusu</label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Örn: Mutabakat Mektubu - {{referansKodu}}"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email İçeriği (HTML)</label>
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

          <div className="p-6 border-t border-gray-200 flex gap-3">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Kaydet
            </button>
            <button
              onClick={() => setShowEditor(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              İptal
            </button>
          </div>
        </div>
      )}
    </div>
  )
}