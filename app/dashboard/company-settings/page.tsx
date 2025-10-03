'use client'

import { useState, useEffect } from 'react'

export default function CompanySettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [company, setCompany] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: '',
    tax_number: '',
    email: '',
    phone: '',
    address: '',
    contact_person: '',
    website: '',
    description: '',
    reconciliation_code_prefix: '',
    require_tax_verification: true,
    require_otp_verification: false
  })

  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [stampFile, setStampFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [stampPreview, setStampPreview] = useState<string | null>(null)

  // User management states
  const [users, setUsers] = useState<any[]>([])
  const [showUserForm, setShowUserForm] = useState(false)
  const [userFormData, setUserFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    role: 'company_user',
    password: '',
    is_active: true
  })

  useEffect(() => {
    fetchCompanyInfo()
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users/list')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const fetchCompanyInfo = async () => {
    try {
      const response = await fetch('/api/company/info')
      if (response.ok) {
        const data = await response.json()
        setCompany(data)
        setFormData({
          name: data.name || '',
          tax_number: data.tax_number || '',
          email: data.email || '',
          phone: data.phone || '',
          address: data.address || '',
          contact_person: data.contact_person || '',
          website: data.website || '',
          description: data.description || '',
          reconciliation_code_prefix: data.reconciliation_code_prefix || '',
          require_tax_verification: data.require_tax_verification ?? true,
          require_otp_verification: data.require_otp_verification ?? false
        })
        // Set existing logo and stamp previews
        if (data.logo_url) {
          setLogoPreview(data.logo_url)
        }
        if (data.stamp_url) {
          setStampPreview(data.stamp_url)
        }
      }
    } catch (error) {
      console.error('Error fetching company info:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'stamp') => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file size (max 1MB)
    if (file.size > 1024 * 1024) {
      alert('Dosya boyutu en fazla 1MB olabilir.')
      return
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      alert('Lütfen bir resim dosyası seçin.')
      return
    }

    // Upload file
    setSaving(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', type)

      const response = await fetch('/api/company/upload', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        alert(data.message)

        // Update preview
        if (type === 'logo') {
          setLogoFile(file)
          const reader = new FileReader()
          reader.onload = (e) => setLogoPreview(e.target?.result as string)
          reader.readAsDataURL(file)
        } else {
          setStampFile(file)
          const reader = new FileReader()
          reader.onload = (e) => setStampPreview(e.target?.result as string)
          reader.readAsDataURL(file)
        }

        // Refresh company info
        fetchCompanyInfo()
      } else {
        const error = await response.json()
        alert('Hata: ' + (error.error || 'Yükleme başarısız'))
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Dosya yüklenirken bir hata oluştu')
    } finally {
      setSaving(false)
    }
  }

  const handleUserInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setUserFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch('/api/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userFormData)
      })

      if (response.ok) {
        const data = await response.json()
        alert(`Kullanıcı başarıyla oluşturuldu!${data.temporaryPassword ? '\nGeçici şifre: ' + data.temporaryPassword : ''}`)
        setShowUserForm(false)
        setUserFormData({
          first_name: '',
          last_name: '',
          email: '',
          phone: '',
          department: '',
          position: '',
          role: 'company_user',
          password: '',
          is_active: true
        })
        fetchUsers() // Refresh user list
      } else {
        const error = await response.json()
        alert('Hata: ' + (error.error || 'Kullanıcı oluşturulamadı'))
      }
    } catch (error) {
      console.error('Error creating user:', error)
      alert('Bir hata oluştu. Lütfen tekrar deneyin.')
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate security settings - at least one must be enabled
    if (!formData.require_tax_verification && !formData.require_otp_verification) {
      alert('Güvenlik uyarısı: En az bir doğrulama yöntemi aktif olmalıdır!\n\nMüşterilerinizin güvenliği için lütfen Vergi Numarası Doğrulama veya E-posta OTP Doğrulama seçeneklerinden en az birini aktif edin.')
      return
    }

    setSaving(true)

    try {
      const response = await fetch('/api/company/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        alert('Firma bilgileri başarıyla güncellendi!')
        fetchCompanyInfo() // Refresh data
      } else {
        const error = await response.json()
        alert('Hata: ' + (error.error || 'Bilgiler güncellenemedi'))
      }
    } catch (error) {
      console.error('Error updating company:', error)
      alert('Bir hata oluştu. Lütfen tekrar deneyin.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Firma Ayarları</h1>
        <p className="text-gray-600">Şirketinizin bilgilerini güncelleyebilir ve düzenleyebilirsiniz.</p>
      </div>

      {/* Company Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Information */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Temel Bilgiler</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Şirket Adı *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="Şirket Adı A.Ş."
                    />
                  </div>
                  <div>
                    <label htmlFor="tax_number" className="block text-sm font-medium text-gray-700 mb-2">
                      Vergi Numarası *
                    </label>
                    <input
                      type="text"
                      id="tax_number"
                      name="tax_number"
                      value={formData.tax_number}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="1234567890"
                    />
                  </div>
                  <div>
                    <label htmlFor="reconciliation_code_prefix" className="block text-sm font-medium text-gray-700 mb-2">
                      Mutabakat Belge No Öneki
                    </label>
                    <input
                      type="text"
                      id="reconciliation_code_prefix"
                      name="reconciliation_code_prefix"
                      value={formData.reconciliation_code_prefix}
                      onChange={handleInputChange}
                      maxLength={10}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="ATL, IKIZ, ABC vb."
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Mutabakat belgelerinde kullanılacak kod öneki (örn: ATL-123, IKIZ-456)
                    </p>
                  </div>
                  <div>
                    <label htmlFor="contact_person" className="block text-sm font-medium text-gray-700 mb-2">
                      Yetkili Kişi *
                    </label>
                    <input
                      type="text"
                      id="contact_person"
                      name="contact_person"
                      value={formData.contact_person}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="Yetkili kişinin adı soyadı"
                    />
                  </div>
                  <div>
                    <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-2">
                      Web Sitesi
                    </label>
                    <input
                      type="url"
                      id="website"
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="https://www.sirket.com"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="border-t pt-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">İletişim Bilgileri</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      E-posta Adresi *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="info@sirket.com"
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      Telefon
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="0212 xxx xx xx"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                    Adres
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    rows={3}
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
                    placeholder="Şirket adresi..."
                  />
                </div>
              </div>

              {/* Additional Information */}
              <div className="border-t pt-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Ek Bilgiler</h2>
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Şirket Açıklaması
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
                    placeholder="Şirketiniz hakkında kısa bir açıklama..."
                  />
                </div>
              </div>

              {/* Security Settings */}
              <div className="border-t pt-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Güvenlik Ayarları</h2>
                <p className="text-sm text-gray-600 mb-4">Müşterilerinizin mutabakat linklerini görüntülemek için hangi doğrulama yöntemlerini kullanmasını istediğinizi belirleyin.</p>

                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        type="checkbox"
                        id="require_tax_verification"
                        name="require_tax_verification"
                        checked={formData.require_tax_verification}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </div>
                    <div className="ml-3">
                      <label htmlFor="require_tax_verification" className="font-medium text-gray-700 text-sm">
                        Vergi Numarası Doğrulama
                      </label>
                      <p className="text-xs text-gray-500">Müşteriler vergi numarasının son 4 hanesini girerek kimliklerini doğrular</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        type="checkbox"
                        id="require_otp_verification"
                        name="require_otp_verification"
                        checked={formData.require_otp_verification}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </div>
                    <div className="ml-3">
                      <label htmlFor="require_otp_verification" className="font-medium text-gray-700 text-sm">
                        E-posta OTP Doğrulama
                      </label>
                      <p className="text-xs text-gray-500">Müşterilere e-posta ile 6 haneli doğrulama kodu gönderilir</p>
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-4">
                    <div className="flex">
                      <svg className="w-5 h-5 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div className="ml-3">
                        <p className="text-sm text-amber-800">
                          <strong>Zorunlu:</strong> Müşteri güvenliği için en az bir doğrulama yöntemi aktif olmalıdır. Her iki yöntem de kapalıysa kaydetme işlemi engellenecektir.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-6 border-t">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {saving ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Kaydediliyor...
                    </div>
                  ) : (
                    'Firma Bilgilerini Güncelle'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Logo and Stamp Upload Sidebar */}
        <div className="lg:col-span-1">
          <div className="space-y-6">
            {/* Logo Upload */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Firma Logosu</h3>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  {logoPreview ? (
                    <div className="space-y-3">
                      <img
                        src={logoPreview}
                        alt="Logo Preview"
                        className="mx-auto h-24 w-24 object-contain rounded-lg border"
                      />
                      <p className="text-sm text-gray-600">{logoFile?.name}</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <div className="text-sm text-gray-600">
                        <p>Logo yükleyin</p>
                        <p className="text-xs">PNG, JPG (Max 1MB)</p>
                      </div>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'logo')}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
            </div>

            {/* Stamp Upload */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Firma Kaşesi</h3>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  {stampPreview ? (
                    <div className="space-y-3">
                      <img
                        src={stampPreview}
                        alt="Stamp Preview"
                        className="mx-auto h-24 w-24 object-contain rounded-lg border"
                      />
                      <p className="text-sm text-gray-600">{stampFile?.name}</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <div className="text-sm text-gray-600">
                        <p>Kaşe yükleyin</p>
                        <p className="text-xs">PNG, JPG (Max 1MB)</p>
                      </div>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'stamp')}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
            </div>

            {/* Company Stats */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Şirket İstatistikleri</h3>
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600">Toplam Mutabakat</p>
                      <p className="text-2xl font-bold text-gray-900">0</p>
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600">Tamamlanan</p>
                      <p className="text-2xl font-bold text-gray-900">0</p>
                    </div>
                  </div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600">Beklemede</p>
                      <p className="text-2xl font-bold text-gray-900">0</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* User Management Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Kullanıcı Yönetimi</h2>
            <button
              onClick={() => setShowUserForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
            >
              <svg className="w-4 h-4 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Yeni Kullanıcı Ekle
            </button>
          </div>
        </div>

        {/* User Form Modal */}
        {showUserForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Yeni Kullanıcı Ekle</h3>
                  <button
                    onClick={() => setShowUserForm(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <form onSubmit={handleUserSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ad *</label>
                    <input
                      type="text"
                      name="first_name"
                      value={userFormData.first_name}
                      onChange={handleUserInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Soyad *</label>
                    <input
                      type="text"
                      name="last_name"
                      value={userFormData.last_name}
                      onChange={handleUserInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-posta *</label>
                  <input
                    type="email"
                    name="email"
                    value={userFormData.email}
                    onChange={handleUserInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                  <input
                    type="tel"
                    name="phone"
                    value={userFormData.phone}
                    onChange={handleUserInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Departman</label>
                    <input
                      type="text"
                      name="department"
                      value={userFormData.department}
                      onChange={handleUserInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pozisyon</label>
                    <input
                      type="text"
                      name="position"
                      value={userFormData.position}
                      onChange={handleUserInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rol *</label>
                  <select
                    name="role"
                    value={userFormData.role}
                    onChange={handleUserInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="company_user">Firma Kullanıcısı</option>
                    <option value="company_admin">Firma Admini</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Süper Admin rolü sadece sistem yöneticileri tarafından atanabilir</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Şifre</label>
                  <input
                    type="password"
                    name="password"
                    value={userFormData.password}
                    onChange={handleUserInputChange}
                    placeholder="Boş bırakılırsa otomatik oluşturulur"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">Boş bırakılırsa otomatik şifre oluşturulur</p>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => setShowUserForm(false)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Oluşturuluyor...' : 'Kullanıcı Oluştur'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Users List */}
        <div className="p-6">
          {users.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kullanıcı
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rol
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Departman
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Durum
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Son Giriş
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600">
                                {user.first_name.charAt(0)}{user.last_name.charAt(0)}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.full_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.role === 'super_admin' ? 'bg-purple-100 text-purple-800' :
                          user.role === 'company_admin' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {user.role_display}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.department || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {user.is_active ? 'Aktif' : 'Pasif'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.last_login ? new Date(user.last_login).toLocaleDateString('tr-TR') : 'Hiç giriş yapmadı'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Henüz kullanıcı bulunmuyor</h3>
              <p className="mt-1 text-sm text-gray-500">İlk kullanıcıyı eklemek için yukarıdaki butona tıklayın</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}