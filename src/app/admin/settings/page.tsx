'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/AdminLayout'
import ImageUpload from '@/components/ImageUpload'

interface SiteSetting {
  id: number
  key: string
  value: string
}

export default function AdminSettings() {
  const [settings, setSettings] = useState<SiteSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  // Form state - Basic Settings
  const [siteName, setSiteName] = useState('')
  const [siteDescription, setSiteDescription] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [faviconUrl, setFaviconUrl] = useState('')
  
  // Contact Information
  const [contactPhone, setContactPhone] = useState('')
  const [contactAddress, setContactAddress] = useState('')
  const [officeHours, setOfficeHours] = useState('')
  // Social Links
  const [socialFacebook, setSocialFacebook] = useState('')
  const [socialTwitter, setSocialTwitter] = useState('')
  const [socialInstagram, setSocialInstagram] = useState('')
  const [socialYoutube, setSocialYoutube] = useState('')
  const [socialLinkedin, setSocialLinkedin] = useState('')
  const [socialTiktok, setSocialTiktok] = useState('')
  
  // Content Settings
  const [aboutTitle, setAboutTitle] = useState('')
  const [aboutContent, setAboutContent] = useState('')
  const [missionStatement, setMissionStatement] = useState('')
  const [teamDescription, setTeamDescription] = useState('')
  const [footerAbout, setFooterAbout] = useState('')
  const [copyrightText, setCopyrightText] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('adminToken')
    if (!token) {
      router.push('/admin')
      return
    }

    fetchSettings(token)
  }, [router])

  const fetchSettings = async (token: string) => {
    try {
      const response = await fetch('/api/admin/settings', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings)
        
        // Populate form fields
        const settingsMap = data.settings.reduce((acc: any, setting: SiteSetting) => {
          acc[setting.key] = setting.value
          return acc
        }, {})
        
        // Basic Settings
        setSiteName(settingsMap['site_name'] || '')
        setSiteDescription(settingsMap['site_description'] || '')
        setContactEmail(settingsMap['contact_email'] || '')
        setFaviconUrl(settingsMap['favicon_url'] || '')
        
        // Contact Information
        setContactPhone(settingsMap['contact_phone'] || '')
        setContactAddress(settingsMap['contact_address'] || '')
        setOfficeHours(settingsMap['office_hours'] || '')
        // Social Links
        setSocialFacebook(settingsMap['social_facebook'] || '')
        setSocialTwitter(settingsMap['social_twitter'] || '')
        setSocialInstagram(settingsMap['social_instagram'] || '')
        setSocialYoutube(settingsMap['social_youtube'] || '')
        setSocialLinkedin(settingsMap['social_linkedin'] || '')
        setSocialTiktok(settingsMap['social_tiktok'] || '')
        
        // Content Settings
        setAboutTitle(settingsMap['about_title'] || '')
        setAboutContent(settingsMap['about_content'] || '')
        setMissionStatement(settingsMap['mission_statement'] || '')
        setTeamDescription(settingsMap['team_description'] || '')
        setFooterAbout(settingsMap['footer_about'] || '')
        setCopyrightText(settingsMap['copyright_text'] || '')
      } else {
        localStorage.removeItem('adminToken')
        router.push('/admin')
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    const token = localStorage.getItem('adminToken')
    if (!token) return

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([
          { key: 'site_name', value: siteName },
          { key: 'site_description', value: siteDescription },
          { key: 'contact_email', value: contactEmail },
          { key: 'favicon_url', value: faviconUrl },
          { key: 'contact_phone', value: contactPhone },
          { key: 'contact_address', value: contactAddress },
          { key: 'office_hours', value: officeHours },
          { key: 'social_facebook', value: socialFacebook },
          { key: 'social_twitter', value: socialTwitter },
          { key: 'social_instagram', value: socialInstagram },
          { key: 'social_youtube', value: socialYoutube },
          { key: 'social_linkedin', value: socialLinkedin },
          { key: 'social_tiktok', value: socialTiktok },
          { key: 'about_title', value: aboutTitle },
          { key: 'about_content', value: aboutContent },
          { key: 'mission_statement', value: missionStatement },
          { key: 'team_description', value: teamDescription },
          { key: 'footer_about', value: footerAbout },
          { key: 'copyright_text', value: copyrightText },
        ]),
      })

      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings)
        setMessage('Settings saved successfully!')
        
        // Clear message after 3 seconds
        setTimeout(() => setMessage(''), 3000)
      } else {
        const error = await response.json()
        setMessage(error.message || 'Failed to save settings')
      }
    } catch (error) {
      setMessage('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout title="Postavke stranice" description="Konfigurirajte postavke web stranice">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Postavke stranice" description="Konfigurirajte postavke web stranice">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <form onSubmit={handleSubmit}>
          {/* Basic Settings */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">Osnovne postavke</h2>
            <div className="space-y-6">
              <div>
                <label htmlFor="siteName" className="block text-sm font-medium text-gray-700 mb-2">
                  Naziv stranice
                </label>
                <input
                  type="text"
                  id="siteName"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter your site name"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  Ovo će se pojaviti u zaglavlju i naslovu preglednika.
                </p>
              </div>

              <div>
                <label htmlFor="siteDescription" className="block text-sm font-medium text-gray-700 mb-2">
                  Opis stranice
                </label>
                <textarea
                  id="siteDescription"
                  value={siteDescription}
                  onChange={(e) => setSiteDescription(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter your site description"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  Koristi se za SEO i meta podatke stranice.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Favicon (preporučeno 32×32 PNG/ICO)
                </label>
                <div className="space-y-3">
                  <ImageUpload 
                    label="Prenesi favicon"
                    currentImage={faviconUrl}
                    accept="image/png,image/x-icon,image/vnd.microsoft.icon,image/svg+xml"
                    maxSize={1}
                    onImageUpload={(url) => setFaviconUrl(url)}
                  />
                  <p className="text-sm text-gray-500">
                    Ova ikona se koristi u kartici preglednika. Ako je prazno, koristi se zadani favicon.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-6">Kontakt informacije</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 mb-2">
                    Kontakt e-pošta
                  </label>
                  <input
                    type="email"
                    id="contactEmail"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="contact@example.com"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700 mb-2">
                    Kontakt telefon
                  </label>
                  <input
                    type="tel"
                    id="contactPhone"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="+123 456 7890"
                  />
                </div>

                <div className="lg:col-span-2">
                  <label htmlFor="contactAddress" className="block text-sm font-medium text-gray-700 mb-2">
                    Adresa (neobavezno)
                  </label>
                  <textarea
                    id="contactAddress"
                    value={contactAddress}
                    onChange={(e) => setContactAddress(e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="123 Main St&#10;City, State 12345&#10;Country"
                  />
                </div>

                <div className="lg:col-span-2">
                  <label htmlFor="officeHours" className="block text-sm font-medium text-gray-700 mb-2">
                    Radno vrijeme (neobavezno)
                  </label>
                  <textarea
                    id="officeHours"
                    value={officeHours}
                    onChange={(e) => setOfficeHours(e.target.value)}
                    rows={2}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Monday - Friday: 9:00 AM - 5:00 PM&#10;Weekend: Closed"
                  />
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-6">Social Links</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="socialFacebook" className="block text-sm font-medium text-gray-700 mb-2">Facebook URL</label>
                  <input
                    type="url"
                    id="socialFacebook"
                    value={socialFacebook}
                    onChange={(e) => setSocialFacebook(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="https://facebook.com/yourpage"
                  />
                </div>
                <div>
                  <label htmlFor="socialTwitter" className="block text-sm font-medium text-gray-700 mb-2">Twitter/X URL</label>
                  <input
                    type="url"
                    id="socialTwitter"
                    value={socialTwitter}
                    onChange={(e) => setSocialTwitter(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="https://twitter.com/yourhandle"
                  />
                </div>
                <div>
                  <label htmlFor="socialInstagram" className="block text-sm font-medium text-gray-700 mb-2">Instagram URL</label>
                  <input
                    type="url"
                    id="socialInstagram"
                    value={socialInstagram}
                    onChange={(e) => setSocialInstagram(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="https://instagram.com/yourhandle"
                  />
                </div>
                <div>
                  <label htmlFor="socialYoutube" className="block text-sm font-medium text-gray-700 mb-2">YouTube URL</label>
                  <input
                    type="url"
                    id="socialYoutube"
                    value={socialYoutube}
                    onChange={(e) => setSocialYoutube(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="https://youtube.com/@yourchannel"
                  />
                </div>
                <div>
                  <label htmlFor="socialLinkedin" className="block text-sm font-medium text-gray-700 mb-2">LinkedIn URL</label>
                  <input
                    type="url"
                    id="socialLinkedin"
                    value={socialLinkedin}
                    onChange={(e) => setSocialLinkedin(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="https://linkedin.com/company/yourcompany"
                  />
                </div>
                <div>
                  <label htmlFor="socialTiktok" className="block text-sm font-medium text-gray-700 mb-2">TikTok URL</label>
                  <input
                    type="url"
                    id="socialTiktok"
                    value={socialTiktok}
                    onChange={(e) => setSocialTiktok(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="https://tiktok.com/@yourhandle"
                  />
                </div>
              </div>
            </div>

            {/* About Page Content */}
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-6">Sadržaj stranice O nama</h2>
              <div className="space-y-6">
                <div>
                  <label htmlFor="aboutTitle" className="block text-sm font-medium text-gray-700 mb-2">
                    Naslov stranice O nama
                  </label>
                  <input
                    type="text"
                    id="aboutTitle"
                    value={aboutTitle}
                    onChange={(e) => setAboutTitle(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="About Us"
                  />
                </div>

                <div>
                  <label htmlFor="aboutContent" className="block text-sm font-medium text-gray-700 mb-2">
                    Sadržaj O nama
                  </label>
                  <textarea
                    id="aboutContent"
                    value={aboutContent}
                    onChange={(e) => setAboutContent(e.target.value)}
                    rows={8}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter your about page content..."
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Ovo će biti prikazano na stranici O nama.
                  </p>
                </div>

                <div>
                  <label htmlFor="missionStatement" className="block text-sm font-medium text-gray-700 mb-2">
                    Misija (neobavezno)
                  </label>
                  <textarea
                    id="missionStatement"
                    value={missionStatement}
                    onChange={(e) => setMissionStatement(e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter your mission statement..."
                  />
                </div>

                <div>
                  <label htmlFor="teamDescription" className="block text-sm font-medium text-gray-700 mb-2">
                    Opis tima (neobavezno)
                  </label>
                  <textarea
                    id="teamDescription"
                    value={teamDescription}
                    onChange={(e) => setTeamDescription(e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Describe your team..."
                  />
                </div>
              </div>
            </div>

            {/* Footer Settings */}
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-6">Postavke podnožja</h2>
              <div className="space-y-6">
                <div>
                  <label htmlFor="footerAbout" className="block text-sm font-medium text-gray-700 mb-2">
                    Tekst o podnožju
                  </label>
                  <textarea
                    id="footerAbout"
                    value={footerAbout}
                    onChange={(e) => setFooterAbout(e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Brief description for footer (optional)"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Ako je prazno, koristit će se opis stranice.
                  </p>
                </div>

                <div>
                  <label htmlFor="copyrightText" className="block text-sm font-medium text-gray-700 mb-2">
                    Tekst autorskih prava
                  </label>
                  <input
                    type="text"
                    id="copyrightText"
                    value={copyrightText}
                    onChange={(e) => setCopyrightText(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="© 2024 Your Company. All rights reserved."
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Ako je prazno, generirat će se zadani tekst autorskih prava.
                  </p>
                </div>
              </div>
            </div>

            {message && (
              <div className={`p-3 rounded-md text-sm mb-6 ${
                message.includes('successfully') 
                  ? 'bg-green-50 text-green-700 border border-green-200' 
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {message}
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Spremanje...' : 'Spremi sve postavke'}
              </button>
            </div>
          </form>

          {/* Additional Settings Sections */}
          <div className="mt-8 bg-white shadow rounded-lg">
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">System Information</h2>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Total Articles</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {settings.find(s => s.key === 'total_articles')?.value || 'Loading...'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Total Categories</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {settings.find(s => s.key === 'total_categories')?.value || 'Loading...'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Database Status</dt>
                  <dd className="mt-1 text-sm text-green-600">Connected</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date().toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
      </div>
    </AdminLayout>
  )
}
