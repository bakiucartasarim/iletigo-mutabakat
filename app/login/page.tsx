'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Company {
  id: number
  name: string
  tax_number: string
  city: string
}

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [companies, setCompanies] = useState<Company[]>([])
  const [formData, setFormData] = useState({
    companyId: '',
    email: '',
    password: '',
    rememberMe: false
  })
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await fetch('/api/companies')
        const data = await response.json()
        if (response.ok) {
          setCompanies(data.companies)
        }
      } catch (error) {
        console.error('Companies fetch error:', error)
      }
    }
    fetchCompanies()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyId: formData.companyId,
          email: formData.email,
          password: formData.password
        })
      })

      const data = await response.json()

      if (response.ok) {
        // Redirect to dashboard
        router.push('/dashboard')
      } else {
        setError(data.error || 'Giriş başarısız. Lütfen bilgilerinizi kontrol edin.')
      }
    } catch (error) {
      console.error('Login error:', error)
      setError('Sunucu hatası. Lütfen tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-gray-50 min-h-screen flex items-center justify-center p-6">
      <div className="relative flex flex-col md:flex-row m-6 space-y-8 md:space-y-0 md:space-x-8 bg-white shadow-2xl rounded-2xl overflow-hidden max-w-6xl w-full max-h-[700px]">

        {/* Sol Taraf - Form */}
        <div className="w-full md:w-[60%] p-8 md:p-12 flex items-center justify-center">
          <div className="w-full max-w-md">
            <div className="flex flex-col items-center mb-8">
              <div className="bg-blue-600 p-3 rounded-full mb-4">
                <svg className="h-8 w-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 2l7.997 3.884A2 2 0 0119 7.616V16a2 2 0 01-2 2H3a2 2 0 01-2-2V7.616a2 2 0 011.003-1.732zM10 4.269L3.616 7.616 10 11l6.384-3.384L10 4.269zM3 8.384l7 3.667 7-3.667V16H3V8.384z" />
                </svg>
              </div>
              <h1 className="font-bold text-3xl text-gray-900">Hoş Geldiniz</h1>
              <p className="text-gray-500 mt-2 text-center">İletigo hesabınıza giriş yapın</p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                <p className="text-xs text-blue-800 font-medium text-center">Veritabanı Bağlantısı:</p>
                <p className="text-xs text-blue-700 text-center mt-1">
                  Kayıtlı hesabınızla giriş yapın<br/>
                  veya önce hesap oluşturun
                </p>
              </div>
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

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="companyId" className="block text-sm font-medium text-gray-700">Şirket Seçimi</label>
                <select
                  id="companyId"
                  name="companyId"
                  required
                  value={formData.companyId}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-3 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">Şirket seçiniz...</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name} {company.city && `- ${company.city}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">E-posta Adresi</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-3 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="ornek@sirket.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Şifre</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-3 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Şifrenizi girin"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="rememberMe"
                    name="rememberMe"
                    type="checkbox"
                    checked={formData.rememberMe}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-900">
                    Beni hatırla
                  </label>
                </div>

                <div className="text-sm">
                  <a href="#" className="font-medium text-blue-600 hover:underline">
                    Şifremi unuttum
                  </a>
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
                      Giriş Yapılıyor...
                    </div>
                  ) : (
                    'Giriş Yap'
                  )}
                </button>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Hesabınız yok mu?{' '}
                  <Link href="/register" className="font-medium text-blue-600 hover:underline">
                    Şirket Kaydı Yapın
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>

        {/* Sağ Taraf - Tek Görsel */}
        <div className="relative md:w-[40%] hidden md:flex items-stretch">
          <div className="relative w-full">
            <img
              alt="İletigo cari mutabakat platformu giriş"
              className="w-full h-full object-cover rounded-r-2xl"
              src="/images/9.png"
            />
          </div>
        </div>
      </div>
    </div>
  )
}