'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    companyName: '',
    taxNumber: '',
    contactPerson: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    address: '',
    acceptTerms: false,
    acceptPrivacy: false,
    acceptMarketing: false
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPrivacyModal, setShowPrivacyModal] = useState(false)
  const [showTermsModal, setShowTermsModal] = useState(false)

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
          companyName: formData.companyName,
          taxNumber: formData.taxNumber,
          contactPerson: formData.contactPerson,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          address: formData.address
        })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Şirket ve kullanıcı hesabı başarıyla oluşturuldu! Giriş sayfasına yönlendiriliyorsunuz...')
        setTimeout(() => {
          router.push('/login')
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
      <div className="relative flex flex-col md:flex-row m-6 space-y-8 md:space-y-0 md:space-x-8 bg-white shadow-2xl rounded-2xl overflow-hidden max-w-6xl w-full min-h-[700px]">

        {/* Sol Taraf - Form */}
        <div className="w-full md:w-[60%] p-8 md:p-12 overflow-y-auto">
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
            {/* Şirket bilgileri formu */}
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

              <div>
                <label htmlFor="taxNumber" className="block text-sm font-medium text-gray-700">Vergi Numarası</label>
                <input
                  id="taxNumber"
                  name="taxNumber"
                  type="text"
                  value={formData.taxNumber}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="12345678901"
                />
              </div>

              <div>
                <label htmlFor="contactPerson" className="block text-sm font-medium text-gray-700">Yetkili Kişi *</label>
                <input
                  id="contactPerson"
                  name="contactPerson"
                  type="text"
                  required
                  value={formData.contactPerson}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Örn: Ahmet Yılmaz"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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

              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">Adres</label>
                <input
                  id="address"
                  name="address"
                  type="text"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Şirket adresi"
                />
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
                    <span
                      className="text-blue-600 hover:underline cursor-pointer"
                      onClick={() => setShowTermsModal(true)}
                    >
                      Kullanıcı sözleşmesini
                    </span> okudum ve kabul ediyorum.
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

        {/* Sağ Taraf - Tek Görsel */}
        <div className="relative md:w-[40%] hidden md:flex items-stretch">
          <div className="relative w-full">
            <img
              alt="Şirket kaydı ve cari mutabakat platformu"
              className="w-full h-full object-cover rounded-r-2xl"
              src="/images/6.png"
            />
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

              <p>
                Bu Politika, 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca veri sorumlusu sıfatıyla hareket eden İletigo'nun yükümlülüklerini yerine getirmesi için temel bir belgedir.
              </p>

              <div>
                <h3 className="font-semibold text-lg text-gray-900 mb-2">1. Veri Sorumlusu</h3>
                <p>
                  İşbu Politika kapsamında kişisel verilerinizin veri sorumlusu, İletigo Teknoloji Ltd. Şti.'dir.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-lg text-gray-900 mb-2">2. Hangi Kişisel Verileri Topluyoruz?</h3>
                <p className="mb-2">Sunduğumuz kurumsal mutabakat hizmetinin doğası gereği, hem hizmetlerimizi kullanan Müşteri Firma yetkililerinin hem de mutabakat süreçlerinde yer alan üçüncü taraf firma yetkililerinin verilerini işleyebiliriz.</p>

                <div className="mb-3">
                  <h4 className="font-medium text-gray-900 mb-1">Kullanıcı ve Müşteri Firma Verileri:</h4>
                  <ul className="list-disc ml-6 space-y-1">
                    <li><strong>Kimlik Bilgileri:</strong> Ad, soyadı, T.C. kimlik numarası (gerekli durumlarda, örn. e-mutabakat).</li>
                    <li><strong>İletişim Bilgileri:</strong> Kurumsal e-posta adresi, cep telefonu numarası, iş telefonu, unvan, çalışılan departman ve firma adı.</li>
                    <li><strong>Kullanıcı Hesap Bilgileri:</strong> Kullanıcı adı, şifrelenmiş parola, kullanıcı ID, IP adresi, siteye giriş-çıkış (log) kayıtları, tarayıcı bilgileri.</li>
                    <li><strong>Finansal Veriler:</strong> Mutabakat süreçlerinin bir parçası olarak Müşteri Firmalar tarafından sisteme yüklenen cari hesap ekstreleri, fatura bilgileri, bakiye bilgileri gibi veriler. Bu veriler Müşteri Firma'nın kontrolünde olup, İletigo bu verileri yalnızca hizmetin gerektirdiği ölçüde işler.</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Üçüncü Taraf (Muhatap Firma) Verileri:</h4>
                  <p>Müşteri Firmalarımızın mutabakat yapmak amacıyla sisteme girdikleri karşı firma yetkililerinin ad, soyadı, unvan, kurumsal e-posta ve telefon numarası gibi iletişim bilgileri. Bu durumda veri sorumlusu Müşteri Firma olup, İletigo "veri işleyen" sıfatına sahiptir.</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-lg text-gray-900 mb-2">3. Kişisel Verileri Hangi Amaçlarla İşliyoruz?</h3>
                <p className="mb-2">Topladığımız kişisel verileri aşağıdaki amaçlarla işlemekteyiz:</p>
                <ul className="list-disc ml-6 space-y-1">
                  <li><strong>Hizmetlerin Sunulması:</strong> Kullanıcı hesabı oluşturmak, mutabakat süreçlerini yürütmek, taraflar arasında iletişimi sağlamak.</li>
                  <li><strong>İletişim:</strong> Hizmetle ilgili güncellemeler, teknik destek, bildirimler ve hatırlatmalar (mutabakat onayı, reddi vb.) hakkında bilgi vermek.</li>
                  <li><strong>Güvenlik:</strong> Sistem güvenliğini sağlamak, sahtekarlığı veya yasa dışı faaliyetleri önlemek ve tespit etmek.</li>
                  <li><strong>Yasal Yükümlülükler:</strong> Ticari faaliyetlerimize ilişkin yasal ve idari yükümlülükleri (vergi, e-fatura, denetim vb.) yerine getirmek.</li>
                  <li><strong>Hizmet İyileştirme:</strong> Hizmetlerimizin performansını analiz etmek, kullanıcı deneyimini geliştirmek ve yeni özellikler sunmak.</li>
                  <li><strong>Pazarlama ve Bilgilendirme (Açık Rıza Halinde):</strong> Yeni hizmetlerimiz, kampanyalarımız ve etkinliklerimiz hakkında bilgi vermek amacıyla ticari elektronik ileti göndermek.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-lg text-gray-900 mb-2">4. Kişisel Verilerin İşlenmesinin Hukuki Sebepleri</h3>
                <p className="mb-2">Kişisel verileriniz, KVKK'nın 5. ve 6. maddelerinde belirtilen hukuki sebeplere dayanılarak işlenmektedir:</p>
                <ul className="list-disc ml-6 space-y-1">
                  <li>Bir sözleşmenin kurulması veya ifasıyla doğrudan doğruya ilgili olması,</li>
                  <li>Veri sorumlusunun hukuki yükümlülüğünü yerine getirebilmesi için zorunlu olması,</li>
                  <li>İlgili kişinin temel hak ve özgürlüklerine zarar vermemek kaydıyla, veri sorumlusunun meşru menfaatleri için veri işlenmesinin zorunlu olması,</li>
                  <li>Kanunlarda açıkça öngörülmesi,</li>
                  <li>Açık rızanızın bulunması (örn. pazarlama faaliyetleri için).</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-lg text-gray-900 mb-2">5. Kişisel Verilerin Aktarılması</h3>
                <p className="mb-2">Kişisel verilerinizin güvenliği bizim için esastır. Verilerinizi kural olarak üçüncü taraflarla paylaşmayız. Ancak aşağıdaki durumlarda ve yasal sınırlar çerçevesinde veri aktarımı yapılabilir:</p>
                <ul className="list-disc ml-6 space-y-1">
                  <li><strong>Yetkili Kurum ve Kuruluşlar:</strong> Yasal bir zorunluluk gereği, talep edilmesi halinde mahkemeler, savcılıklar, bakanlıklar ve diğer kamu kurumları ile paylaşılabilir.</li>
                  <li><strong>Hizmet Sağlayıcılar ve İş Ortakları:</strong> Hizmetlerimizi sunabilmek için destek aldığımız altyapı sağlayıcıları (sunucu, bulut hizmetleri), e-posta gönderim servisleri, SMS sağlayıcıları gibi iş ortaklarımızla, yalnızca hizmetin gerektirdiği ölçüde ve gizlilik taahhüdü altında paylaşılabilir.</li>
                  <li><strong>Müşteri Firma:</strong> Bir Müşteri Firma çalışanı iseniz, hesap ve aktivite bilgileriniz, hizmet sözleşmesi kapsamında Müşteri Firmanızdaki yetkili kişilerle paylaşılabilir.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-lg text-gray-900 mb-2">6. Kişisel Verilerin Saklanma Süresi</h3>
                <p>
                  Kişisel verilerinizi, ilgili mevzuatta öngörülen veya işlendikleri amaç için gerekli olan süre kadar muhafaza etmekteyiz. Yasal saklama sürelerinin sona ermesi veya işleme amacının ortadan kalkması durumunda, kişisel verileriniz KVKK'ya uygun olarak silinir, yok edilir veya anonim hale getirilir.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-lg text-gray-900 mb-2">7. Veri Sahibinin Hakları (KVKK Madde 11)</h3>
                <p className="mb-2">
                  Kişisel veri sahibi olarak KVKK'nın 11. maddesi uyarınca aşağıdaki haklara sahipsiniz:
                </p>
                <ul className="list-disc ml-6 space-y-1">
                  <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme,</li>
                  <li>İşlenmişse buna ilişkin bilgi talep etme,</li>
                  <li>İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme,</li>
                  <li>Yurt içinde veya yurt dışında verilerin aktarıldığı üçüncü kişileri bilme,</li>
                  <li>Eksik veya yanlış işlenmişse düzeltilmesini isteme,</li>
                  <li>KVKK'da öngörülen şartlar çerçevesinde silinmesini veya yok edilmesini isteme,</li>
                  <li>Yapılan düzeltme, silme veya yok etme işlemlerinin, verilerin aktarıldığı üçüncü kişilere bildirilmesini isteme,</li>
                  <li>İşlenen verilerin münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle aleyhinize bir sonucun ortaya çıkmasına itiraz etme,</li>
                  <li>Verilerin kanuna aykırı olarak işlenmesi sebebiyle zarara uğramanız hâlinde zararın giderilmesini talep etme.</li>
                </ul>
                <p className="mt-2">Bu haklarınızı kullanmak için <a href="mailto:iletisim@iletigo.com" className="text-blue-600 underline">iletisim@iletigo.com</a> e-posta adresinden veya şirket adresimize yazılı olarak başvurabilirsiniz.</p>
              </div>

              <div>
                <h3 className="font-semibold text-lg text-gray-900 mb-2">8. Veri Güvenliği</h3>
                <p>
                  İletigo, kişisel verilerinizin hukuka aykırı olarak işlenmesini, erişilmesini önlemek ve muhafazasını sağlamak amacıyla şifreleme, erişim yetki kontrolleri, güvenlik duvarları, veri yedekleme gibi gerekli tüm teknik ve idari tedbirleri almaktadır.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-lg text-gray-900 mb-2">9. Çerez (Cookie) Politikası</h3>
                <p>
                  Sitemizi ziyaretiniz sırasında kullanıcı deneyiminizi geliştirmek amacıyla çerezler kullanmaktayız. Çerez politikamız hakkında detaylı bilgi için lütfen çerez politikası sayfamızı ziyaret ediniz.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-lg text-gray-900 mb-2">10. Politika'da Yapılacak Değişiklikler</h3>
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

      {/* Kullanıcı Sözleşmesi Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">
                  iletigo.com Web Sitesi Kullanım Koşulları ve Genel Sorumluluklar Sözleşmesi
                </h2>
                <button
                  onClick={() => setShowTermsModal(false)}
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
              <div>
                <h3 className="font-semibold text-lg text-gray-900 mb-2">1. Taraflar</h3>
                <p>
                  İşbu Kullanıcı Sözleşmesi ("Sözleşme"), İletigo Teknoloji Ltd. Şti. ("İletigo") ile iletigo.com web sitesini ("Site") ziyaret eden veya kullanan tüm gerçek ve tüzel kişiler ("Kullanıcı") arasında akdedilmiştir.
                </p>
                <p className="mt-2">
                  Kullanıcı, Site'ye giriş yaparak ve/veya kullanarak bu sözleşmenin tamamını okuduğunu, anladığını ve burada belirtilen tüm şartları, kuralları ve sorumlulukları kayıtsız şartsız kabul ettiğini beyan ve taahhüt eder. Bu koşulları kabul etmiyorsanız, lütfen Site'yi kullanmaktan vazgeçiniz.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-lg text-gray-900 mb-2">2. Sözleşmenin Konusu</h3>
                <p>
                  İşbu Sözleşme'nin konusu, İletigo tarafından sunulan hizmetlerin kullanımına ilişkin olarak Taraflar'ın karşılıklı hak ve yükümlülüklerinin belirlenmesidir.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-lg text-gray-900 mb-2">3. Kullanım Koşulları</h3>
                <ul className="list-disc ml-6 space-y-1">
                  <li>Kullanıcı, Site'yi yalnızca hukuka uygun amaçlarla kullanacağını ve yasalara aykırı herhangi bir faaliyette bulunmayacağını kabul eder.</li>
                  <li>Site'nin işleyişini engelleyecek veya aksatacak herhangi bir yazılım, araç veya mekanizma kullanılamaz.</li>
                  <li>Kullanıcı, diğer kullanıcıların bilgilerine ve verilerine izinsiz olarak ulaşmayacağını ve bunları kullanmayacağını taahhüt eder.</li>
                  <li>Site içeriğinin İletigo'nun izni olmaksızın ticari amaçlarla kopyalanması, çoğaltılması, dağıtılması veya işlenmesi yasaktır.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-lg text-gray-900 mb-2">4. Tarafların Hak ve Sorumlulukları</h3>

                <div className="mb-3">
                  <h4 className="font-medium text-gray-900 mb-1">4.1. İletigo'nun Hak ve Sorumlulukları</h4>
                  <ul className="list-disc ml-6 space-y-1">
                    <li>İletigo, Site'nin kesintisiz ve hatasız bir şekilde çalışması için azami gayreti gösterecektir. Ancak teknik arızalar, siber saldırılar veya mücbir sebeplerden kaynaklanabilecek kesintilerden sorumlu tutulamaz.</li>
                    <li>İletigo, Site üzerinden sunulan hizmetlerin içeriğinde ve kullanım koşullarında önceden haber vermeksizin değişiklik yapma hakkını saklı tutar. Yapılan değişiklikler, Site'de yayınlandığı tarihten itibaren geçerli olur.</li>
                    <li>İletigo, Kullanıcı'nın işbu Sözleşme hükümlerine aykırı davrandığını tespit etmesi halinde, Kullanıcı'nın Site'ye erişimini tek taraflı olarak ve bildirimde bulunmaksızın sonlandırma hakkına sahiptir.</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-1">4.2. Kullanıcı'nın Hak ve Sorumlulukları</h4>
                  <ul className="list-disc ml-6 space-y-1">
                    <li>Kullanıcı, Site'yi kullanırken verdiği tüm bilgilerin doğru, güncel ve eksiksiz olduğunu kabul ve beyan eder. Bu bilgilerin yanlış veya eksik olmasından doğacak tüm zararlardan Kullanıcı sorumludur.</li>
                    <li>Varsa, kullanıcı adı ve şifre gibi hesap bilgilerinin güvenliğinden Kullanıcı bizzat sorumludur. Bu bilgilerin üçüncü şahısların eline geçmesi sonucu doğabilecek zararlardan İletigo sorumlu değildir.</li>
                    <li>Kullanıcı, Site'yi kullanarak gerçekleştirdiği tüm işlemlerin hukuki ve cezai sorumluluğunun kendisine ait olduğunu kabul eder.</li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-lg text-gray-900 mb-2">5. Fikri Mülkiyet Hakları</h3>
                <p>
                  iletigo.com web sitesinde yer alan her türlü tasarım, metin, görsel, logo, ikon, yazılım, kod ve diğer tüm unsurların mülkiyeti ve telif hakları İletigo'ya aittir. Bu unsurlar, İletigo'nun yazılı izni olmaksızın kopyalanamaz, çoğaltılamaz, değiştirilemez, dağıtılamaz veya başka bir amaçla kullanılamaz.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-lg text-gray-900 mb-2">6. Sorumluluğun Sınırlandırılması</h3>
                <p>
                  İletigo, Site'nin kullanımından veya kullanılamamasından kaynaklanan doğrudan veya dolaylı hiçbir zarardan (veri kaybı, kar kaybı vb.) sorumlu değildir.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-lg text-gray-900 mb-2">7. Sözleşme Değişiklikleri</h3>
                <p>
                  İletigo, işbu Sözleşme'yi ve eklerini, herhangi bir zamanda ve önceden bildirimde bulunmaksızın tek taraflı olarak değiştirme hakkına sahiptir. Değişiklikler Site'de yayınlandığı anda yürürlüğe girer. Kullanıcı, Site'yi kullanmaya devam ederek bu değişiklikleri kabul etmiş sayılır. Sözleşmeyi düzenli olarak gözden geçirmek Kullanıcı'nın sorumluluğundadır.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-lg text-gray-900 mb-2">8. Mücbir Sebepler</h3>
                <p>
                  Doğal afetler, savaş, terör eylemleri, siber saldırılar, mevzuat değişiklikleri, genel salgın hastalıklar ve tarafların kontrolü dışında gelişen benzeri durumlar "mücbir sebep" olarak kabul edilir. Mücbir sebeplerin varlığı halinde tarafların işbu Sözleşme'den doğan yükümlülükleri askıya alınır ve gecikmeden dolayı taraflar sorumlu tutulamaz.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-lg text-gray-900 mb-2">9. Uygulanacak Hukuk ve Yetkili Mahkeme</h3>
                <p>
                  İşbu Sözleşme'nin uygulanmasından ve yorumlanmasından doğacak her türlü uyuşmazlığın çözümünde Türk Hukuku uygulanacaktır. Uyuşmazlıkların çözümünde İstanbul (Çağlayan) Mahkemeleri ve İcra Daireleri yetkilidir.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-lg text-gray-900 mb-2">10. Yürürlük</h3>
                <p>
                  İşbu Sözleşme, Kullanıcı'nın iletigo.com web sitesini ziyaret ettiği ve kullanmaya başladığı andan itibaren yürürlüğe girer ve Site'yi kullanmayı sonlandırmadığı müddetçe yürürlükte kalır.
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => setShowTermsModal(false)}
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