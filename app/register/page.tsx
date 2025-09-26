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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          {/* Logo */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
                <div className="absolute top-2 left-2 w-1.5 h-1.5 bg-white rounded-full opacity-80"></div>
                <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-white rounded-full opacity-80"></div>
                <div className="absolute bottom-2 left-2 w-1.5 h-1.5 bg-white rounded-full opacity-80"></div>
                <div className="absolute bottom-2 right-2 w-1.5 h-1.5 bg-white rounded-full opacity-80"></div>
                <svg className="w-8 h-8 text-white z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>

          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            Şirket Kaydı
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Şirketinizi sisteme kaydedin ve toplanı yönetiminizi başlatın
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">{success}</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {/* Şirket Bilgileri */}
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                <svg className="w-5 h-5 text-indigo-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Şirket Bilgileri
              </h3>

              <div className="space-y-4">
                {/* Şirket Adı */}
                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
                    Şirket Adı *
                  </label>
                  <input
                    id="companyName"
                    name="companyName"
                    type="text"
                    required
                    value={formData.companyName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm"
                    placeholder="Örn: Acme Teknoloji A.Ş."
                  />
                </div>

                {/* Şirket Açıklaması */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Şirket Açıklaması
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm"
                    placeholder="Şirketinizin kısa açıklaması..."
                  />
                </div>

                {/* Website */}
                <div>
                  <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
                    Website
                  </label>
                  <input
                    id="website"
                    name="website"
                    type="url"
                    value={formData.website}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm"
                    placeholder="https://www.sirketiniz.com"
                  />
                </div>
              </div>
            </div>

            {/* Şirket Yöneticisi Bilgileri */}
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                <svg className="w-5 h-5 text-indigo-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Şirket Yöneticisi Bilgileri
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Yönetici Adı Soyadı */}
                <div>
                  <label htmlFor="contactName" className="block text-sm font-medium text-gray-700 mb-1">
                    Yönetici Adı Soyadı *
                  </label>
                  <input
                    id="contactName"
                    name="contactName"
                    type="text"
                    required
                    value={formData.contactName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm"
                    placeholder="Örn: Ahmet Yılmaz"
                  />
                </div>

                {/* Telefon */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Telefon
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm"
                    placeholder="0532 123 45 67"
                  />
                </div>
              </div>

              {/* E-posta Adresi */}
              <div className="mt-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  E-posta Adresi *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm"
                  placeholder="ahmet@sirketiniz.com"
                />
              </div>
            </div>

            {/* Şifre Bilgileri */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                <svg className="w-5 h-5 text-indigo-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Giriş Bilgileri
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Şifre */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Şifre *
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm"
                    placeholder="En az 6 karakter"
                  />
                </div>

                {/* Şifre Tekrar */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Şifre Tekrar *
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm"
                    placeholder="Şifrenizi tekrar girin"
                  />
                </div>
              </div>
            </div>

            {/* Kullanıcı Sözleşmesi */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Kullanıcı Sözleşmesi
              </h3>

              {/* Sözleşme Metni */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4 max-h-60 overflow-y-auto text-xs text-gray-700">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">1. Taraflar</h4>
                    <p>
                      İşbu Kullanıcı Sözleşmesi ("Sözleşme"), İletigo Teknoloji Ltd. Şti. (bundan sonra kısaca "İletigo" olarak anılacaktır) ile iletigo.com web sitesini ("Site") ziyaret eden veya kullanan tüm gerçek ve tüzel kişiler ("Kullanıcı") arasında akdedilmiştir.
                    </p>
                    <p className="mt-2">
                      Kullanıcı, Site'ye giriş yaparak ve/veya kullanarak bu sözleşmenin tamamını okuduğunu, anladığını ve burada belirtilen tüm şartları, kuralları ve sorumlulukları kayıtsız şartsız kabul ettiğini beyan ve taahhüt eder.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">2. Sözleşmenin Konusu</h4>
                    <p>
                      İşbu Sözleşme'nin konusu, İletigo tarafından sunulan hizmetlerin kullanımına ilişkin olarak Taraflar'ın karşılıklı hak ve yükümlülüklerinin belirlenmesidir.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">3. Kullanım Koşulları</h4>
                    <p className="mb-2">
                      • Kullanıcı, Site'yi yalnızca hukuka uygun amaçlarla kullanacağını ve yasalara aykırı herhangi bir faaliyette bulunmayacağını kabul eder.
                    </p>
                    <p className="mb-2">
                      • Site'nin işleyişini engelleyecek veya aksatacak herhangi bir yazılım, araç veya mekanizma kullanılamaz.
                    </p>
                    <p className="mb-2">
                      • Kullanıcı, diğer kullanıcıların bilgilerine ve verilerine izinsiz olarak ulaşmayacağını ve bunları kullanmayacağını taahhüt eder.
                    </p>
                    <p>
                      • Site içeriğinin İletigo'nun izni olmaksızın ticari amaçlarla kopyalanması, çoğaltılması, dağıtılması veya işlenmesi yasaktır.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">4. Tarafların Hak ve Sorumlulukları</h4>
                    <p className="mb-2 font-medium">4.1. İletigo'nun Hak ve Sorumlulukları</p>
                    <p className="mb-2">
                      İletigo, Site'nin kesintisiz ve hatasız bir şekilde çalışması için azami gayreti gösterecektir. Ancak teknik arızalar, siber saldırılar veya mücbir sebeplerden kaynaklanabilecek kesintilerden sorumlu tutulamaz.
                    </p>
                    <p className="mb-2 font-medium">4.2. Kullanıcı'nın Hak ve Sorumlulukları</p>
                    <p>
                      Kullanıcı, Site'yi kullanırken verdiği tüm bilgilerin doğru, güncel ve eksiksiz olduğunu kabul ve beyan eder. Bu bilgilerin yanlış veya eksik olmasından doğacak tüm zararlardan Kullanıcı sorumludur.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">5. Fikri Mülkiyet Hakları</h4>
                    <p>
                      iletigo.com web sitesinde yer alan her türlü tasarım, metin, görsel, logo, ikon, yazılım, kod ve diğer tüm unsurların mülkiyeti ve telif hakları İletigo'ya aittir.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">6. Sorumluluğun Sınırlandırılması</h4>
                    <p>
                      İletigo, Site'nin kullanımından veya kullanılamamasından kaynaklanan doğrudan veya dolaylı hiçbir zarardan (veri kaybı, kar kaybı vb.) sorumlu değildir.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">7. Uygulanacak Hukuk ve Yetkili Mahkeme</h4>
                    <p>
                      İşbu Sözleşme'nin uygulanmasından ve yorumlanmasından doğacak her türlü uyuşmazlığın çözümünde Türk Hukuku uygulanacaktır. Uyuşmazlıkların çözümünde İstanbul (Çağlayan) Mahkemeleri ve İcra Daireleri yetkilidir.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">8. Yürürlük</h4>
                    <p>
                      İşbu Sözleşme, Kullanıcı'nın iletigo.com web sitesini ziyaret ettiği ve kullanmaya başladığı andan itibaren yürürlüğe girer.
                    </p>
                  </div>
                </div>
              </div>

              {/* Checkbox'lar */}
              <div className="space-y-3">
                {/* Kullanıcı Sözleşmesi */}
                <div className="flex items-start">
                  <input
                    id="acceptTerms"
                    name="acceptTerms"
                    type="checkbox"
                    checked={formData.acceptTerms}
                    onChange={handleInputChange}
                    className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="acceptTerms" className="ml-3 text-sm text-gray-700">
                    İletigo kullanıcı sözleşmesini okudum ve kabul ediyorum.
                  </label>
                </div>

                {/* Gizlilik Politikası */}
                <div className="flex items-start">
                  <input
                    id="acceptPrivacy"
                    name="acceptPrivacy"
                    type="checkbox"
                    checked={formData.acceptPrivacy}
                    onChange={handleInputChange}
                    className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="acceptPrivacy" className="ml-3 text-sm text-gray-700">
                    <span
                      className="text-blue-600 underline cursor-pointer hover:text-blue-800"
                      onClick={() => setShowPrivacyModal(true)}
                    >
                      Gizlilik Politikası
                    </span> kabul ediyorum;
                    kullanım deneyimimi geliştirebilmek için verilerin işlenmesine
                    ve bu kapsamda yurtiçindeki veya yurtdışındaki kuruluşlara aktarılmak üzere tarafımca onaylanmış veri veriyorum.
                  </label>
                </div>

                {/* Pazarlama İzni */}
                <div className="flex items-start">
                  <input
                    id="acceptMarketing"
                    name="acceptMarketing"
                    type="checkbox"
                    checked={formData.acceptMarketing}
                    onChange={handleInputChange}
                    className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="acceptMarketing" className="ml-3 text-sm text-gray-700">
                    Güncel hizmetler ile ilgili kampanyalar, indirimler ve
                    haberler hakkında telefon, e-posta veya SMS almak istiyorum.
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Hesap Oluşturuluyor...
                </div>
              ) : (
                'Şirketi Kaydet ve Bağlan'
              )}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Şirketiniz zaten kayıtlı mı?{' '}
              <Link href="/" className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors duration-200">
                Giriş Yap
              </Link>
            </p>
          </div>
        </form>
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
                <p className="mb-3">
                  Sunduğumuz kurumsal mutabakat hizmetinin doğası gereği, hem hizmetlerimizi kullanan Müşteri Firma yetkililerinin hem de mutabakat süreçlerinde yer alan üçüncü taraf firma yetkililerinin verilerini işleyebiliriz.
                </p>

                <div className="ml-4">
                  <h4 className="font-medium mb-2">Kullanıcı ve Müşteri Firma Verileri:</h4>
                  <ul className="list-disc ml-6 space-y-1">
                    <li><strong>Kimlik Bilgileri:</strong> Ad, soyadı, T.C. kimlik numarası (gerekli durumlarda)</li>
                    <li><strong>İletişim Bilgileri:</strong> E-posta adresi, telefon numarası, unvan, firma adı</li>
                    <li><strong>Hesap Bilgileri:</strong> Kullanıcı adı, şifrelenmiş parola, IP adresi, giriş kayıtları</li>
                    <li><strong>Finansal Veriler:</strong> Mutabakat süreçlerinin bir parçası olarak yüklenen cari hesap ekstreleri</li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-lg text-gray-900 mb-2">3. Kişisel Verileri Hangi Amaçlarla İşliyoruz?</h3>
                <ul className="list-disc ml-6 space-y-1">
                  <li>Hizmetlerin sunulması ve mutabakat süreçlerinin yürütülmesi</li>
                  <li>İletişim ve bilgilendirme</li>
                  <li>Sistem güvenliğinin sağlanması</li>
                  <li>Yasal yükümlülüklerin yerine getirilmesi</li>
                  <li>Hizmet iyileştirme ve analiz</li>
                  <li>Pazarlama faaliyetleri (açık rıza halinde)</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-lg text-gray-900 mb-2">4. Kişisel Verilerin İşlenmesinin Hukuki Sebepleri</h3>
                <p>
                  Kişisel verileriniz, 6698 sayılı KVKK'nın 5. ve 6. maddelerinde belirtilen hukuki sebeplere dayanılarak işlenmektedir:
                </p>
                <ul className="list-disc ml-6 space-y-1 mt-2">
                  <li>Sözleşmenin kurulması veya ifası</li>
                  <li>Hukuki yükümlülüğün yerine getirilmesi</li>
                  <li>Meşru menfaatler</li>
                  <li>Kanunlarda açıkça öngörülmesi</li>
                  <li>Açık rızanızın bulunması</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-lg text-gray-900 mb-2">5. Veri Sahibinin Hakları</h3>
                <p className="mb-2">
                  KVKK'nın 11. maddesi uyarınca aşağıdaki haklara sahipsiniz:
                </p>
                <ul className="list-disc ml-6 space-y-1">
                  <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
                  <li>İşlenme amacını öğrenme</li>
                  <li>Verilerin aktarıldığı üçüncü kişileri bilme</li>
                  <li>Eksik veya yanlış işlenmişse düzeltilmesini isteme</li>
                  <li>Silinmesini veya yok edilmesini isteme</li>
                  <li>Otomatik sistemlerle analiz edilmesine itiraz etme</li>
                  <li>Zarara uğramanız halinde tazminat talep etme</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-lg text-gray-900 mb-2">6. Veri Güvenliği</h3>
                <p>
                  İletigo, kişisel verilerinizin güvenliğini sağlamak amacıyla şifreleme, erişim kontrolleri, güvenlik duvarları ve veri yedekleme gibi gerekli tüm teknik ve idari tedbirleri almaktadır.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-lg text-gray-900 mb-2">7. İletişim</h3>
                <p>
                  Bu haklarınızı kullanmak için <a href="mailto:info@iletigo.com" className="text-blue-600 underline">info@iletigo.com</a> e-posta adresinden bizimle iletişime geçebilirsiniz.
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="w-full bg-indigo-600 text-white py-3 px-4 rounded-xl hover:bg-indigo-700 transition-colors font-medium"
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