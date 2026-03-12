'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import AdminLayout from '@/components/AdminLayout'
import { compressImage, formatFileSize, type ImageType } from '@/utils/imageCompression'

interface BrandingData {
  logoUrl: string | null
  faviconUrl: string
  siteName: string
}

export default function BrandingPage() {
  const [branding, setBranding] = useState<BrandingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState<'logo' | 'favicon' | null>(null)
  const [compressing, setCompressing] = useState<'logo' | 'favicon' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [compressionInfo, setCompressionInfo] = useState<string | null>(null)
  
  const logoInputRef = useRef<HTMLInputElement>(null)
  const faviconInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchBranding()
  }, [])

  const fetchBranding = async () => {
    try {
      const response = await fetch('/api/admin/branding')
      if (response.ok) {
        const data = await response.json()
        setBranding(data)
      }
    } catch (err) {
      console.error('Failed to fetch branding:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (type: 'logo' | 'favicon', file: File) => {
    setError(null)
    setSuccess(null)
    setCompressionInfo(null)

    const token = localStorage.getItem('adminToken')
    if (!token) {
      setError('Niste prijavljeni')
      return
    }

    // Compress image before upload
    setCompressing(type)
    const originalSize = file.size
    
    try {
      // Use appropriate compression settings based on type
      const imageType: ImageType = type === 'logo' ? 'logo' : 'favicon'
      const compressedFile = await compressImage(file, imageType)
      
      const compressedSize = compressedFile.size
      const reductionPercent = Math.round((1 - compressedSize / originalSize) * 100)
      
      if (reductionPercent > 0) {
        setCompressionInfo(`🗜️ Komprimirano: ${formatFileSize(originalSize)} → ${formatFileSize(compressedSize)} (${reductionPercent}% manje)`)
      }
      
      setCompressing(null)
      setUploading(type)

      const formData = new FormData()
      formData.append('file', compressedFile)
      formData.append('type', type)

      const response = await fetch('/api/admin/branding', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(data.message)
        fetchBranding()
      } else {
        setError(data.message || 'Upload failed')
      }
    } catch (err) {
      setError('Greška pri uploadu ili kompresiji')
      console.error('Upload error:', err)
    } finally {
      setUploading(null)
      setCompressing(null)
    }
  }

  const handleDelete = async (type: 'logo' | 'favicon') => {
    if (!confirm(`Jeste li sigurni da želite ukloniti ${type === 'logo' ? 'logo' : 'favicon'}?`)) {
      return
    }

    setError(null)
    setSuccess(null)

    const token = localStorage.getItem('adminToken')
    if (!token) {
      setError('Niste prijavljeni')
      return
    }

    try {
      const response = await fetch('/api/admin/branding', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(data.message)
        fetchBranding()
      } else {
        setError(data.message || 'Brisanje nije uspjelo')
      }
    } catch (err) {
      setError('Greška pri brisanju')
      console.error('Delete error:', err)
    }
  }

  const handleFileChange = (type: 'logo' | 'favicon') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleUpload(type, file)
    }
    e.target.value = ''
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Branding</h1>
          <p className="text-gray-600 mt-1">Upravljanje logotipom i faviconom</p>
        </div>

        {/* Error/Success/Compression Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            {success}
            {compressionInfo && (
              <p className="mt-1 text-sm text-green-600">{compressionInfo}</p>
            )}
          </div>
        )}

        <div className="grid gap-8 md:grid-cols-2">
          {/* Logo Section */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Logo</h2>
            <p className="text-sm text-gray-500 mb-4">
              Preporučena veličina: 300x100 px. Podržani formati: PNG, JPG, SVG, WebP
            </p>
            
            {/* Current Logo Preview */}
            <div className="mb-4 p-4 bg-gray-100 rounded-lg flex items-center justify-center min-h-[120px]">
              {branding?.logoUrl ? (
                <Image
                  src={branding.logoUrl}
                  alt="Current logo"
                  width={200}
                  height={80}
                  className="max-h-20 object-contain"
                  style={{ width: 'auto' }}
                />
              ) : (
                <div className="text-center text-gray-400">
                  <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm">Nema uploadanog logotipa</p>
                </div>
              )}
            </div>

            {/* Upload Button */}
            <input
              type="file"
              ref={logoInputRef}
              onChange={handleFileChange('logo')}
              accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
              className="hidden"
            />
            
            <div className="flex gap-2">
              <button
                onClick={() => logoInputRef.current?.click()}
                disabled={uploading === 'logo' || compressing === 'logo'}
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {compressing === 'logo' ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Kompresija...
                  </span>
                ) : uploading === 'logo' ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Upload...
                  </span>
                ) : (
                  'Upload Logo'
                )}
              </button>
              
              {branding?.logoUrl && (
                <button
                  onClick={() => handleDelete('logo')}
                  className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                >
                  Ukloni
                </button>
              )}
            </div>
          </div>

          {/* Favicon Section */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Favicon</h2>
            <p className="text-sm text-gray-500 mb-4">
              Preporučena veličina: 32x32 px ili 64x64 px. Podržani formati: PNG, ICO, SVG
            </p>
            
            {/* Current Favicon Preview */}
            <div className="mb-4 p-4 bg-gray-100 rounded-lg flex items-center justify-center min-h-[120px]">
              {branding?.faviconUrl ? (
                <div className="text-center">
                  <Image
                    src={branding.faviconUrl}
                    alt="Current favicon"
                    width={64}
                    height={64}
                    className="mx-auto mb-2"
                  />
                  <p className="text-xs text-gray-500">64x64 preview</p>
                </div>
              ) : (
                <div className="text-center text-gray-400">
                  <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-sm">Default favicon</p>
                </div>
              )}
            </div>

            {/* Upload Button */}
            <input
              type="file"
              ref={faviconInputRef}
              onChange={handleFileChange('favicon')}
              accept="image/png,image/x-icon,image/ico,image/svg+xml"
              className="hidden"
            />
            
            <div className="flex gap-2">
              <button
                onClick={() => faviconInputRef.current?.click()}
                disabled={uploading === 'favicon' || compressing === 'favicon'}
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {compressing === 'favicon' ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Kompresija...
                  </span>
                ) : uploading === 'favicon' ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Upload...
                  </span>
                ) : (
                  'Upload Favicon'
                )}
              </button>
              
              {branding?.faviconUrl && branding.faviconUrl !== '/favicon.ico' && (
                <button
                  onClick={() => handleDelete('favicon')}
                  className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-medium text-blue-800 mb-2">💡 Napomene</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Logo će se prikazivati u headeru stranice umjesto teksta</li>
            <li>• Favicon je mala ikona koja se prikazuje u tabu browsera</li>
            <li>• Promjene možda neće biti vidljive odmah - osvježite stranicu ili očistite cache</li>
            <li>• Za favicon preporučujemo PNG ili ICO format</li>
            <li>• 🗜️ <strong>Automatska kompresija</strong>: Slike se automatski optimiziraju prije uploada</li>
          </ul>
        </div>
      </div>
    </AdminLayout>
  )
}
