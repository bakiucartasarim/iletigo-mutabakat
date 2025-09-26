'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex items-center">
                  <div className="bg-blue-600 p-2 rounded-lg mr-3">
                    <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 2l7.997 3.884A2 2 0 0119 7.616V16a2 2 0 01-2 2H3a2 2 0 01-2-2V7.616a2 2 0 011.003-1.732z" />
                    </svg>
                  </div>
                  <span className="text-2xl font-bold text-gray-900">İletigo</span>
                </div>
              </div>
            </div>

            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                <a href="#ozellikler" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors">Özellikler</a>
                <a href="#cozumler" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors">Çözümler</a>
                <a href="#fiyatlandirma" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors">Fiyatlandırma</a>
                <a href="#iletisim" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors">İletişim</a>
                <Link href="/login" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors">
                  Giriş Yap
                </Link>
                <Link href="/register" className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">
                  Ücretsiz Deneyin
                </Link>
              </div>
            </div>

            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-gray-700 hover:text-blue-600 p-2"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
              <a href="#ozellikler" className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600">Özellikler</a>
              <a href="#cozumler" className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600">Çözümler</a>
              <a href="#fiyatlandirma" className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600">Fiyatlandırma</a>
              <a href="#iletisim" className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600">İletişim</a>
              <Link href="/login" className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600">
                Giriş Yap
              </Link>
              <Link href="/register" className="block px-3 py-2 text-base font-medium bg-blue-600 text-white rounded-md mt-2">
                Ücretsiz Deneyin
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 pt-16 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,#fff,rgba(255,255,255,0.6))] -z-10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-center">
            <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
              <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                <span className="block xl:inline">Cari Mutabakat</span>
                <span className="block text-blue-600 xl:inline"> Süreçlerinizi</span>
                <span className="block xl:inline">Otomatiğe Bağlayın</span>
              </h1>
              <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl">
                İletigo ile BA/BS ve cari hesap mutabakatlarınızı saniyeler içinde tamamlayın.
                Zamandan tasarruf edin, hataları sıfırlayın ve nakit akışınızı hızlandırın.
              </p>
              <div className="mt-8 sm:max-w-lg sm:mx-auto sm:text-center lg:text-left lg:mx-0">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/register" className="w-full sm:w-auto bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-blue-700 transition-all duration-200 text-center shadow-lg hover:shadow-xl">
                    Ücretsiz Deneyin
                  </Link>
                  <button className="w-full sm:w-auto border-2 border-blue-600 text-blue-600 px-8 py-3 rounded-lg text-lg font-medium hover:bg-blue-50 transition-all duration-200 text-center">
                    Demoyu İzleyin
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center">
              <div className="relative mx-auto w-full rounded-lg shadow-2xl lg:max-w-md">
                <div className="relative block w-full bg-white rounded-lg overflow-hidden">
                  <div className="bg-gray-100 px-4 py-2 border-b flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    <div className="flex-1 text-center text-sm text-gray-600">İletigo Dashboard</div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Mutabakat Durumu</h3>
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Aktif</span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">Toplam Gönderim</span>
                        <span className="text-lg font-bold text-blue-600">1,247</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">Onaylanan</span>
                        <span className="text-lg font-bold text-green-600">1,089</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">Bekleyen</span>
                        <span className="text-lg font-bold text-yellow-600">158</span>
                      </div>
                      <div className="mt-4">
                        <div className="bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-600 h-2 rounded-full" style={{width: '87%'}}></div>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">%87 Tamamlanma Oranı</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Band - Company Logos */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm font-semibold uppercase text-gray-500 tracking-wide">
            Türkiye'nin Önde Gelen Firmaları Bize Güveniyor
          </p>
          <div className="mt-6 grid grid-cols-2 gap-8 md:grid-cols-6 lg:grid-cols-5">
            <div className="col-span-1 flex justify-center md:col-span-2 lg:col-span-1">
              <div className="h-12 w-24 bg-gray-300 rounded-md opacity-50 flex items-center justify-center">
                <span className="text-xs text-gray-600">Logo 1</span>
              </div>
            </div>
            <div className="col-span-1 flex justify-center md:col-span-2 lg:col-span-1">
              <div className="h-12 w-24 bg-gray-300 rounded-md opacity-50 flex items-center justify-center">
                <span className="text-xs text-gray-600">Logo 2</span>
              </div>
            </div>
            <div className="col-span-1 flex justify-center md:col-span-2 lg:col-span-1">
              <div className="h-12 w-24 bg-gray-300 rounded-md opacity-50 flex items-center justify-center">
                <span className="text-xs text-gray-600">Logo 3</span>
              </div>
            </div>
            <div className="col-span-1 flex justify-center md:col-span-3 lg:col-span-1">
              <div className="h-12 w-24 bg-gray-300 rounded-md opacity-50 flex items-center justify-center">
                <span className="text-xs text-gray-600">Logo 4</span>
              </div>
            </div>
            <div className="col-span-2 flex justify-center md:col-span-3 lg:col-span-1">
              <div className="h-12 w-24 bg-gray-300 rounded-md opacity-50 flex items-center justify-center">
                <span className="text-xs text-gray-600">Logo 5</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem & Solution */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
            {/* Problem */}
            <div className="mb-10 lg:mb-0">
              <h2 className="text-3xl font-extrabold text-gray-900 mb-6">
                Manuel Mutabakatın Yarattığı Zaman Kaybı ve Riskler
              </h2>
              <ul className="space-y-4">
                <li className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <p className="ml-3 text-lg text-gray-700">Haftalar süren telefon ve e-posta trafiği</p>
                </li>
                <li className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <p className="ml-3 text-lg text-gray-700">Gözden kaçan hatalar ve uyuşmazlıklar</p>
                </li>
                <li className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <p className="ml-3 text-lg text-gray-700">Geciken tahsilatlar ve bozulan nakit akışı</p>
                </li>
                <li className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <p className="ml-3 text-lg text-gray-700">Yüksek operasyonel maliyet ve personel yükü</p>
                </li>
              </ul>
            </div>

            {/* Solution */}
            <div>
              <h2 className="text-3xl font-extrabold text-gray-900 mb-6">
                İletigo ile Mutabakatta Yeni Nesil Kolaylık
              </h2>
              <ul className="space-y-4">
                <li className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="ml-3 text-lg text-gray-700">Tek tıkla binlerce firmaya mutabakat gönderimi</p>
                </li>
                <li className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="ml-3 text-lg text-gray-700">Otomatik hatırlatmalar ve anlık takip</p>
                </li>
                <li className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="ml-3 text-lg text-gray-700">%100 dijital, güvenli ve yasal geçerli süreçler</p>
                </li>
                <li className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="ml-3 text-lg text-gray-700">Raporlanabilir verilerle tam kontrol</p>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="cozumler" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Sadece 3 Adımda Mutabakatlarınızı Tamamlayın
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
              Kolay, hızlı ve güvenli süreçlerle dakikalar içinde işlemlerinizi tamamlayın
            </p>
          </div>

          <div className="mt-20">
            <div className="lg:grid lg:grid-cols-3 lg:gap-8">
              <div className="text-center">
                <div className="flex items-center justify-center h-20 w-20 rounded-full bg-blue-500 text-white mx-auto mb-6">
                  <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">1. Yükle</h3>
                <p className="text-lg text-gray-500">
                  Cari listenizi veya BA/BS formunuzu Excel, CSV veya ERP entegrasyonu ile
                  saniyeler içinde sisteme yükleyin.
                </p>
              </div>

              <div className="mt-10 lg:mt-0 text-center">
                <div className="flex items-center justify-center h-20 w-20 rounded-full bg-blue-500 text-white mx-auto mb-6">
                  <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">2. Gönder</h3>
                <p className="text-lg text-gray-500">
                  Tek bir tuşla tüm firmalara e-posta veya SMS yoluyla mutabakat
                  taleplerinizi otomatik olarak gönderin.
                </p>
              </div>

              <div className="mt-10 lg:mt-0 text-center">
                <div className="flex items-center justify-center h-20 w-20 rounded-full bg-blue-500 text-white mx-auto mb-6">
                  <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">3. Takip Et & Raporla</h3>
                <p className="text-lg text-gray-500">
                  Gelen yanıtları anlık olarak takip edin. Onay, ret ve uyuşmazlıkları
                  tek ekrandan yönetin ve detaylı raporlar alın.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="ozellikler" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              İşinizi Kolaylaştıracak Güçlü Özellikler
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
              Modern teknoloji ile donatılmış kapsamlı mutabakat çözümü
            </p>
          </div>

          <div className="mt-20">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <div className="pt-6">
                <div className="flow-root bg-gray-50 rounded-lg px-6 pb-8">
                  <div className="-mt-6">
                    <div>
                      <span className="inline-flex items-center justify-center p-3 bg-blue-500 rounded-md shadow-lg">
                        <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </span>
                    </div>
                    <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">Otomatik BA/BS Mutabakatı</h3>
                    <p className="mt-5 text-base text-gray-500">
                      KDV iadesi süreçlerinizi hızlandırın. Bilanço ve gelir tablosu mutabakatlarınızı otomatikleştirin.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <div className="flow-root bg-gray-50 rounded-lg px-6 pb-8">
                  <div className="-mt-6">
                    <div>
                      <span className="inline-flex items-center justify-center p-3 bg-blue-500 rounded-md shadow-lg">
                        <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </span>
                    </div>
                    <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">Cari Hesap Mutabakatı</h3>
                    <p className="mt-5 text-base text-gray-500">
                      Alacak ve borçlarınızı anında teyit edin. Müşteri ve tedarikçilerinizle hızlı uzlaşma sağlayın.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <div className="flow-root bg-gray-50 rounded-lg px-6 pb-8">
                  <div className="-mt-6">
                    <div>
                      <span className="inline-flex items-center justify-center p-3 bg-blue-500 rounded-md shadow-lg">
                        <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </span>
                    </div>
                    <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">Gelişmiş Raporlama</h3>
                    <p className="mt-5 text-base text-gray-500">
                      Kim onayladı, kim reddetti, kim henüz yanıtlamadı? Tüm süreci anlık raporlayın ve takip edin.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <div className="flow-root bg-gray-50 rounded-lg px-6 pb-8">
                  <div className="-mt-6">
                    <div>
                      <span className="inline-flex items-center justify-center p-3 bg-blue-500 rounded-md shadow-lg">
                        <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </span>
                    </div>
                    <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">ERP Entegrasyonu</h3>
                    <p className="mt-5 text-base text-gray-500">
                      Logo, Paraşüt, Zirve ve diğer muhasebe programlarıyla tam uyum. Mevcut sistemlerinizi kullanmaya devam edin.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <div className="flow-root bg-gray-50 rounded-lg px-6 pb-8">
                  <div className="-mt-6">
                    <div>
                      <span className="inline-flex items-center justify-center p-3 bg-blue-500 rounded-md shadow-lg">
                        <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </span>
                    </div>
                    <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">Güvenli Veri Saklama</h3>
                    <p className="mt-5 text-base text-gray-500">
                      KVKK uyumlu, Türkiye'deki sunucularda 256-bit SSL şifreleme ile verileriniz tamamen güvende.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <div className="flow-root bg-gray-50 rounded-lg px-6 pb-8">
                  <div className="-mt-6">
                    <div>
                      <span className="inline-flex items-center justify-center p-3 bg-blue-500 rounded-md shadow-lg">
                        <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </span>
                    </div>
                    <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">Toplu İletişim</h3>
                    <p className="mt-5 text-base text-gray-500">
                      E-posta ve SMS ile müşterilerinize en hızlı yoldan ulaşın. Otomatik hatırlatmalar gönderin.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Testimonials */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Müşterilerimiz Ne Diyor?
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
              İletigo ile mutabakat süreçlerini dönüştüren firmaların deneyimleri
            </p>
          </div>

          <div className="mt-20">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="bg-white rounded-lg shadow-lg p-8">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-lg">AY</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h4 className="text-lg font-bold text-gray-900">Ayşe Yılmaz</h4>
                    <p className="text-gray-600">Finans Müdürü</p>
                    <p className="text-sm text-gray-500">ABC Lojistik</p>
                  </div>
                </div>
                <p className="text-gray-700 italic">
                  "İletigo sayesinde mutabakat için harcadığımız 1 haftalık mesai, 1 saate indi.
                  Finans ekibimiz artık daha stratejik işlere odaklanabiliyor."
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-8">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 font-bold text-lg">MK</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h4 className="text-lg font-bold text-gray-900">Mehmet Kaya</h4>
                    <p className="text-gray-600">Genel Müdür</p>
                    <p className="text-sm text-gray-500">XYZ İnşaat</p>
                  </div>
                </div>
                <p className="text-gray-700 italic">
                  "KDV iadesi süreçlerimiz çok hızlandı. İletigo'nun otomatik BA/BS mutabakatı
                  sayesinde vergi dairesine daha hızlı başvurabiliyoruz."
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-8">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-purple-600 font-bold text-lg">SG</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h4 className="text-lg font-bold text-gray-900">Selma Güneş</h4>
                    <p className="text-gray-600">Mali İşler Uzmanı</p>
                    <p className="text-sm text-gray-500">DEF Ticaret</p>
                  </div>
                </div>
                <p className="text-gray-700 italic">
                  "Müşterilerimizle olan uyuşmazlıklar minimuma indi. Her şey şeffaf ve
                  takip edilebilir. Harika bir sistem!"
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="fiyatlandirma" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              İşletmenize Uygun Paketi Seçin
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
              Basit, şeffaf ve adil fiyatlandırma. İstediğiniz zaman paket değiştirebilirsiniz.
            </p>
          </div>

          <div className="mt-20">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              {/* Başlangıç */}
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8">
                <h3 className="text-2xl font-bold text-gray-900">Başlangıç</h3>
                <p className="mt-4 text-gray-500">Küçük işletmeler için ideal</p>
                <p className="mt-8">
                  <span className="text-4xl font-extrabold text-gray-900">₺299</span>
                  <span className="text-base font-medium text-gray-500">/ay</span>
                </p>
                <ul className="mt-8 space-y-4">
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    100 firmaya kadar mutabakat
                  </li>
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Temel raporlama
                  </li>
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    E-posta desteği
                  </li>
                </ul>
                <Link href="/register" className="mt-8 block w-full bg-gray-800 text-white text-center py-3 px-4 rounded-md font-medium hover:bg-gray-900 transition-colors">
                  Paketi Seç
                </Link>
              </div>

              {/* Profesyonel */}
              <div className="bg-blue-600 border border-blue-600 rounded-lg shadow-sm p-8 relative">
                <div className="absolute top-0 right-6 transform -translate-y-1/2">
                  <span className="inline-flex items-center px-4 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    En Popüler
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-white">Profesyonel</h3>
                <p className="mt-4 text-blue-100">Orta ölçekli şirketler için</p>
                <p className="mt-8">
                  <span className="text-4xl font-extrabold text-white">₺599</span>
                  <span className="text-base font-medium text-blue-100">/ay</span>
                </p>
                <ul className="mt-8 space-y-4">
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-blue-100 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-white">500 firmaya kadar mutabakat</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-blue-100 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-white">Gelişmiş raporlama ve analiz</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-blue-100 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-white">ERP entegrasyonu</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-blue-100 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-white">Telefon desteği</span>
                  </li>
                </ul>
                <Link href="/register" className="mt-8 block w-full bg-white text-blue-600 text-center py-3 px-4 rounded-md font-medium hover:bg-gray-50 transition-colors">
                  Paketi Seç
                </Link>
              </div>

              {/* Kurumsal */}
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8">
                <h3 className="text-2xl font-bold text-gray-900">Kurumsal</h3>
                <p className="mt-4 text-gray-500">Büyük şirketler için</p>
                <p className="mt-8">
                  <span className="text-4xl font-extrabold text-gray-900">₺1,299</span>
                  <span className="text-base font-medium text-gray-500">/ay</span>
                </p>
                <ul className="mt-8 space-y-4">
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Sınırsız mutabakat
                  </li>
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Özel raporlama ve dashboard
                  </li>
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    API entegrasyonu
                  </li>
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    7/24 öncelikli destek
                  </li>
                </ul>
                <Link href="/register" className="mt-8 block w-full bg-gray-800 text-white text-center py-3 px-4 rounded-md font-medium hover:bg-gray-900 transition-colors">
                  Paketi Seç
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-blue-700">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            <span className="block">Mutabakat Süreçlerinizde</span>
            <span className="block text-blue-200">Devrim Yaratmaya Hazır Mısınız?</span>
          </h2>
          <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
            <div className="inline-flex rounded-md shadow">
              <Link href="/register" className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50 transition-colors">
                14 Gün Ücretsiz Deneme Başlat
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="iletisim" className="bg-gray-900">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
          <div className="xl:grid xl:grid-cols-3 xl:gap-8">
            <div className="space-y-8 xl:col-span-1">
              <div className="flex items-center">
                <div className="bg-blue-600 p-2 rounded-lg mr-3">
                  <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 2l7.997 3.884A2 2 0 0119 7.616V16a2 2 0 01-2 2H3a2 2 0 01-2-2V7.616a2 2 0 011.003-1.732z" />
                  </svg>
                </div>
                <span className="text-2xl font-bold text-white">İletigo</span>
              </div>
              <p className="text-gray-400 text-base">
                Türkiye'nin lider cari mutabakat platformu. İşletmenizi dijitalleştirin,
                zaman kazanın ve verimliliğinizi artırın.
              </p>
              <div className="flex space-x-6">
                <a href="#" className="text-gray-400 hover:text-gray-300">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-gray-300">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              </div>
            </div>
            <div className="mt-12 grid grid-cols-2 gap-8 xl:mt-0 xl:col-span-2">
              <div className="md:grid md:grid-cols-2 md:gap-8">
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Çözümler</h3>
                  <ul className="mt-4 space-y-4">
                    <li><a href="#" className="text-base text-gray-300 hover:text-white">Cari Mutabakat</a></li>
                    <li><a href="#" className="text-base text-gray-300 hover:text-white">BA/BS Mutabakatı</a></li>
                    <li><a href="#" className="text-base text-gray-300 hover:text-white">Raporlama</a></li>
                    <li><a href="#" className="text-base text-gray-300 hover:text-white">Entegrasyonlar</a></li>
                  </ul>
                </div>
                <div className="mt-12 md:mt-0">
                  <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Kurumsal</h3>
                  <ul className="mt-4 space-y-4">
                    <li><a href="#" className="text-base text-gray-300 hover:text-white">Hakkımızda</a></li>
                    <li><a href="#" className="text-base text-gray-300 hover:text-white">Kariyer</a></li>
                    <li><a href="#" className="text-base text-gray-300 hover:text-white">Basın</a></li>
                    <li><a href="#" className="text-base text-gray-300 hover:text-white">İletişim</a></li>
                  </ul>
                </div>
              </div>
              <div className="md:grid md:grid-cols-2 md:gap-8">
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Destek</h3>
                  <ul className="mt-4 space-y-4">
                    <li><a href="#" className="text-base text-gray-300 hover:text-white">Yardım Merkezi</a></li>
                    <li><a href="#" className="text-base text-gray-300 hover:text-white">API Dokümantasyon</a></li>
                    <li><a href="#" className="text-base text-gray-300 hover:text-white">Sistem Durumu</a></li>
                  </ul>
                </div>
                <div className="mt-12 md:mt-0">
                  <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Yasal</h3>
                  <ul className="mt-4 space-y-4">
                    <li><a href="#" className="text-base text-gray-300 hover:text-white">Gizlilik Sözleşmesi</a></li>
                    <li><a href="#" className="text-base text-gray-300 hover:text-white">Kullanım Koşulları</a></li>
                    <li><a href="#" className="text-base text-gray-300 hover:text-white">KVKK</a></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-12 border-t border-gray-700 pt-8">
            <p className="text-base text-gray-400 xl:text-center">
              © 2025 İletigo Teknoloji Ltd. Şti. Tüm hakları saklıdır.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}