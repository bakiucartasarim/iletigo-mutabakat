'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    companyName: '',
    description: '',
    website: '',
    contactName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
    acceptPrivacy: false,
    acceptMarketing: false
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPrivacyModal, setShowPrivacyModal] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Şifreler eşleşmiyor')
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır')
      setLoading(false)
      return
    }

    if (!formData.acceptTerms) {
      setError('Kullanıcı sözleşmesini kabul etmelisiniz')
      setLoading(false)
      return
    }

    if (!formData.acceptPrivacy) {
      setError('Gizlilik politikasını kabul etmelisiniz')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.contactName.split(' ')[0] || formData.contactName,
          lastName: formData.contactName.split(' ').slice(1).join(' ') || 'Şirket',
          role: 'admin',
          companyName: formData.companyName,
          description: formData.description,
          website: formData.website,
          phone: formData.phone
        })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Hesap başarıyla oluşturuldu! Giriş sayfasına yönlendiriliyorsunuz...')
        setTimeout(() => {
          router.push('/')
        }, 2000)
      } else {
        setError(data.error || 'Bir hata oluştu')
      }
    } catch (error) {
      console.error('Registration error:', error)
      setError('Sunucu hatası. Lütfen tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-gray-50 min-h-screen flex items-center justify-center p-6">
      <div className="relative flex flex-col md:flex-row m-6 space-y-8 md:space-y-0 md:space-x-8 bg-white shadow-2xl rounded-2xl overflow-hidden max-w-6xl w-full">

        {/* Sol Taraf - Form */}
        <div className="w-full md:w-[60%] p-8 md:p-12">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-blue-600 p-3 rounded-full mb-4">
              <svg className="h-8 w-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 2l7.997 3.884A2 2 0 0119 7.616V16a2 2 0 01-2 2H3a2 2 0 01-2-2V7.616a2 2 0 011.003-1.732zM10 4.269L3.616 7.616 10 11l6.384-3.384L10 4.269zM3 8.384l7 3.667 7-3.667V16H3V8.384z" />
              </svg>
            </div>
            <h1 className="font-bold text-3xl text-gray-900">Şirket Kaydı</h1>
            <p className="text-gray-500 mt-2 text-center">Şirketinizi sisteme kaydedin ve cari mutabakatlarınızı kolayca yönetin</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-sm font-medium text-green-800">{success}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Tek sütun kompakt form */}
            <div className="space-y-3">
              <div>
                <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">Şirket Adı *</label>
                <input
                  id="companyName"
                  name="companyName"
                  type="text"
                  required
                  value={formData.companyName}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Örn: Acme Teknoloji A.Ş."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="contactName" className="block text-sm font-medium text-gray-700">Yönetici Adı Soyadı *</label>
                  <input
                    id="contactName"
                    name="contactName"
                    type="text"
                    required
                    value={formData.contactName}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Örn: Ahmet Yılmaz"
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Telefon</label>
                  <div className="relative mt-1">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">+90</span>
                    </div>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="block w-full pl-12 pr-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="532 123 45 67"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">E-posta Adresi *</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="ahmet@sirketiniz.com"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">Şifre *</label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="En az 6 karakter"
                  />
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Şifre Tekrar *</label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Şifrenizi tekrar girin"
                  />
                </div>
              </div>
            </div>

            {/* Sözleşmeler - Daha kompakt */}
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-start">
                  <input
                    id="acceptTerms"
                    name="acceptTerms"
                    type="checkbox"
                    checked={formData.acceptTerms}
                    onChange={handleInputChange}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="acceptTerms" className="ml-3 text-sm text-gray-700">
                    Kullanıcı sözleşmesini okudum ve kabul ediyorum.
                  </label>
                </div>

                <div className="flex items-start">
                  <input
                    id="acceptPrivacy"
                    name="acceptPrivacy"
                    type="checkbox"
                    checked={formData.acceptPrivacy}
                    onChange={handleInputChange}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="acceptPrivacy" className="ml-3 text-sm text-gray-700">
                    <span
                      className="text-blue-600 hover:underline cursor-pointer"
                      onClick={() => setShowPrivacyModal(true)}
                    >
                      Gizlilik Politikası
                    </span> kabul ediyorum.
                  </label>
                </div>

                <div className="flex items-start">
                  <input
                    id="acceptMarketing"
                    name="acceptMarketing"
                    type="checkbox"
                    checked={formData.acceptMarketing}
                    onChange={handleInputChange}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="acceptMarketing" className="ml-3 text-sm text-gray-700">
                    Güncel hizmetler ile ilgili bildirimler almak istiyorum.
                  </label>
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 ease-in-out"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Şirket Kaydediliyor...
                  </div>
                ) : (
                  'Şirketi Kaydet ve Bağlan'
                )}
              </button>
            </div>

            <div className="text-center text-sm text-gray-600">
              Şirketiniz zaten kayıtlı mı?{' '}
              <Link href="/" className="font-medium text-blue-600 hover:underline">
                Giriş Yap
              </Link>
            </div>
          </form>
        </div>

        {/* Sağ Taraf - Görsel */}
        <div className="relative md:w-[40%] hidden md:block">
          <img
            alt="Cari mutabakat süreçlerini gösteren iş adamları"
            className="w-full h-full object-cover"
            src="https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
          />
          <div className="absolute inset-0 bg-blue-900 bg-opacity-60 flex items-center justify-center p-8">
            <div className="text-center text-white">
              <h2 className="text-4xl font-bold mb-4">Cari Mutabakatta Devrim</h2>
              <p className="text-lg">İletigo ile cari mutabakat süreçlerinizi dijitalleştirin. Hızlı, güvenli ve verimli bir şekilde mutabakatlarınızı tamamlayın. Hemen kaydolun ve farkı yaşayın.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Gizlilik Politikası Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">
                  Gizlilik ve Kişisel Verilerin Korunması Politikası
                </h2>
                <button
                  onClick={() => setShowPrivacyModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-2">Son Güncelleme Tarihi: 27.09.2025</p>
            </div>

            <div className="p-6 overflow-y-auto max-h-[70vh] text-sm text-gray-700 space-y-4">
              <p>
                İletigo Teknoloji Ltd. Şti. ("İletigo" veya "Şirket") olarak, kullanıcılarımızın ve hizmet verdiğimiz kurumsal müşterilerimizin ("Müşteri Firma") verilerinin gizliliğine ve güvenliğine büyük önem veriyoruz. İşbu Gizlilik ve Kişisel Verilerin Korunması Politikası ("Politika"), İletigo'nun iletigo.com web sitesi ("Site") ve sunduğu mutabakat hizmetleri ("Hizmetler") aracılığıyla topladığı kişisel verilerin nasıl işlendiğini, kimlerle paylaşıldığını ve veri sahiplerinin haklarının neler olduğunu açıklamak amacıyla hazırlanmıştır.
              </p>

              <div>
                <h3 className="font-semibold text-lg text-gray-900 mb-2">1. Veri Sorumlusu</h3>
                <p>
                  İşbu Politika kapsamında kişisel verilerinizin veri sorumlusu, İletigo Teknoloji Ltd. Şti.'dir.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-lg text-gray-900 mb-2">2. Hangi Kişisel Verileri Topluyoruz?</h3>
                <p className="mb-2">Sunduğumuz kurumsal mutabakat hizmetinin doğası gereği aşağıdaki verileri işleyebiliriz:</p>
                <ul className="list-disc ml-6 space-y-1">
                  <li><strong>Kimlik Bilgileri:</strong> Ad, soyadı, T.C. kimlik numarası (gerekli durumlarda)</li>
                  <li><strong>İletişim Bilgileri:</strong> Kurumsal e-posta adresi, cep telefonu numarası, iş telefonu, unvan</li>
                  <li><strong>Kullanıcı Hesap Bilgileri:</strong> Kullanıcı adı, şifrelenmiş parola, IP adresi, log kayıtları</li>
                  <li><strong>Finansal Veriler:</strong> Mutabakat süreçlerinde kullanılan cari hesap ekstreleri, fatura bilgileri</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-lg text-gray-900 mb-2">3. Kişisel Verileri Hangi Amaçlarla İşliyoruz?</h3>
                <ul className="list-disc ml-6 space-y-1">
                  <li>Hizmetlerin sunulması ve kullanıcı hesabı oluşturma</li>
                  <li>Mutabakat süreçlerini yürütme ve taraflar arasında iletişimi sağlama</li>
                  <li>Sistem güvenliğini sağlama ve sahtekarlığı önleme</li>
                  <li>Yasal yükümlülükleri yerine getirme</li>
                  <li>Hizmet iyileştirme ve kullanıcı deneyimini geliştirme</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-lg text-gray-900 mb-2">4. Veri Sahibinin Hakları (KVKK Madde 11)</h3>
                <p className="mb-2">
                  KVKK'nın 11. maddesi uyarınca aşağıdaki haklara sahipsiniz:
                </p>
                <ul className="list-disc ml-6 space-y-1">
                  <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
                  <li>İşlenmişse buna ilişkin bilgi talep etme</li>
                  <li>İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme</li>
                  <li>Verilerin aktarıldığı üçüncü kişileri bilme</li>
                  <li>Eksik veya yanlış işlenmişse düzeltilmesini isteme</li>
                  <li>KVKK'da öngörülen şartlar çerçevesinde silinmesini veya yok edilmesini isteme</li>
                  <li>Verilerin kanuna aykırı olarak işlenmesi sebebiyle zarara uğramanız hâlinde zararın giderilmesini talep etme</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-lg text-gray-900 mb-2">5. Veri Güvenliği</h3>
                <p>
                  İletigo, kişisel verilerinizin hukuka aykırı olarak işlenmesini önlemek ve muhafazasını sağlamak amacıyla şifreleme, erişim yetki kontrolleri, güvenlik duvarları, veri yedekleme gibi gerekli tüm teknik ve idari tedbirleri almaktadır.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-lg text-gray-900 mb-2">6. İletişim</h3>
                <p>
                  Bu haklarınızı kullanmak için <a href="mailto:info@iletigo.com" className="text-blue-600 underline">info@iletigo.com</a> e-posta adresinden bizimle iletişime geçebilirsiniz.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-lg text-gray-900 mb-2">7. Politika'da Yapılacak Değişiklikler</h3>
                <p>
                  İletigo, işbu Gizlilik Politikası'nda mevzuattaki değişiklikler veya hizmetlerindeki yenilikler doğrultusunda değişiklik yapma hakkını saklı tutar. Politikanın güncel versiyonu her zaman Site'de yayınlanacaktır.
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}