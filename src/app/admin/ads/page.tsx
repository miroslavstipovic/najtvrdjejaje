'use client'

import { useEffect, useState } from 'react'
import AdminLayout from '@/components/AdminLayout'

interface AdSettings {
  id: number
  enabledOnHomepage: boolean
  enabledOnArticles: boolean
  enabledOnCategories: boolean
  adsenseClientId: string | null
  homepageAdSlot: string | null
  articleContentAdSlot: string | null
  articleBottomAdSlot: string | null
  articleSidebarAdSlot: string | null
  categoryTopAdSlot: string | null
  categoryInlineAdSlot: string | null
  mapSidebarAdSlot: string | null
  mapBottomAdSlot: string | null
}

export default function AdsManagementPage() {
  const [settings, setSettings] = useState<AdSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  const [enabledOnHomepage, setEnabledOnHomepage] = useState(true)
  const [enabledOnArticles, setEnabledOnArticles] = useState(true)
  const [enabledOnCategories, setEnabledOnCategories] = useState(true)
  const [adsenseClientId, setAdsenseClientId] = useState('')
  const [homepageAdSlot, setHomepageAdSlot] = useState('')
  const [articleContentAdSlot, setArticleContentAdSlot] = useState('')
  const [articleBottomAdSlot, setArticleBottomAdSlot] = useState('')
  const [articleSidebarAdSlot, setArticleSidebarAdSlot] = useState('')
  const [categoryTopAdSlot, setCategoryTopAdSlot] = useState('')
  const [categoryInlineAdSlot, setCategoryInlineAdSlot] = useState('')
  const [mapSidebarAdSlot, setMapSidebarAdSlot] = useState('')
  const [mapBottomAdSlot, setMapBottomAdSlot] = useState('')

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    const token = localStorage.getItem('adminToken')
    if (!token) return

    try {
      const response = await fetch('/api/admin/ads', {
        headers: { 'Authorization': `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings)
        setEnabledOnHomepage(data.settings.enabledOnHomepage)
        setEnabledOnArticles(data.settings.enabledOnArticles)
        setEnabledOnCategories(data.settings.enabledOnCategories)
        setAdsenseClientId(data.settings.adsenseClientId || '')
        setHomepageAdSlot(data.settings.homepageAdSlot || '')
        setArticleContentAdSlot(data.settings.articleContentAdSlot || '')
        setArticleBottomAdSlot(data.settings.articleBottomAdSlot || '')
        setArticleSidebarAdSlot(data.settings.articleSidebarAdSlot || '')
        setCategoryTopAdSlot(data.settings.categoryTopAdSlot || '')
        setCategoryInlineAdSlot(data.settings.categoryInlineAdSlot || '')
        setMapSidebarAdSlot(data.settings.mapSidebarAdSlot || '')
        setMapBottomAdSlot(data.settings.mapBottomAdSlot || '')
      }
    } catch (error) {
      console.error('Failed to fetch ad settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    const token = localStorage.getItem('adminToken')
    if (!token) return

    setSaving(true)
    setMessage(null)

    try {
      const response = await fetch('/api/admin/ads', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enabledOnHomepage,
          enabledOnArticles,
          enabledOnCategories,
          adsenseClientId: adsenseClientId.trim() || null,
          homepageAdSlot: homepageAdSlot.trim() || null,
          articleContentAdSlot: articleContentAdSlot.trim() || null,
          articleBottomAdSlot: articleBottomAdSlot.trim() || null,
          articleSidebarAdSlot: articleSidebarAdSlot.trim() || null,
          categoryTopAdSlot: categoryTopAdSlot.trim() || null,
          categoryInlineAdSlot: categoryInlineAdSlot.trim() || null,
          mapSidebarAdSlot: mapSidebarAdSlot.trim() || null,
          mapBottomAdSlot: mapBottomAdSlot.trim() || null,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSettings(data.settings)
        setMessage({ type: 'success', text: 'Postavke reklama su uspješno sačuvane!' })
        setTimeout(() => setMessage(null), 5000)
      } else {
        setMessage({ type: 'error', text: data.message || 'Greška pri čuvanju postavki' })
      }
    } catch (error) {
      console.error('Save error:', error)
      setMessage({ type: 'error', text: 'Greška pri čuvanju postavki' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout title="Google AdSense" description="Upravljaj prikazivanjem reklama">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Učitavanje...</p>
            </div>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Google AdSense" description="Upravljaj prikazivanjem reklama">
      <div className="max-w-4xl mx-auto px-5 sm:px-6 lg:px-8 py-8">
        {/* Success/Error Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-xl ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* AdSense Client ID */}
        <div className="card p-6 sm:p-8 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">AdSense Konfiguracija</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="clientId" className="label-field">
                AdSense Client ID
              </label>
              <input
                id="clientId"
                type="text"
                className="input-field font-mono text-sm"
                placeholder="ca-pub-1234567890123456"
                value={adsenseClientId}
                onChange={(e) => setAdsenseClientId(e.target.value)}
              />
              <p className="text-sm text-gray-500 mt-2">
                Format: <code className="bg-gray-100 px-2 py-1 rounded">ca-pub-XXXXXXXXXXXXXXXX</code>
                <br />
                Pronađite svoj Client ID u{' '}
                <a
                  href="https://www.google.com/adsense"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:text-primary-700"
                >
                  Google AdSense dashboardu
                </a>
              </p>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>💡 Napomena:</strong> Nakon što unesete Client ID, također ga dodajte u <code className="bg-blue-100 px-2 py-1 rounded">.env.local</code> fajl kao{' '}
                <code className="bg-blue-100 px-2 py-1 rounded">NEXT_PUBLIC_ADSENSE_CLIENT_ID</code> i restartujte dev server.
              </p>
            </div>
          </div>
        </div>

        {/* Ad Slot IDs */}
        <div className="card p-6 sm:p-8 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Ad Slot ID-ovi</h2>
          <p className="text-sm text-gray-600 mb-6">
            Kreirajte pojedinačne ad unit-e u Google AdSense i unesite njihove slot ID-ove ovde.
            Svaka pozicija na sajtu treba svoj jedinstveni slot ID.
          </p>
          
          <div className="space-y-6">
            {/* Homepage Ad Slot */}
            <div>
              <label htmlFor="homepageAdSlot" className="label-field">
                🏠 Početna stranica Slot ID
              </label>
              <input
                id="homepageAdSlot"
                type="text"
                className="input-field font-mono text-sm"
                placeholder="1234567890"
                value={homepageAdSlot}
                onChange={(e) => setHomepageAdSlot(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">Između sekcija na početnoj stranici</p>
            </div>

            {/* Article Content Ad Slot */}
            <div>
              <label htmlFor="articleContentAdSlot" className="label-field">
                📝 Članak - Sadržaj Slot ID
              </label>
              <input
                id="articleContentAdSlot"
                type="text"
                className="input-field font-mono text-sm"
                placeholder="0987654321"
                value={articleContentAdSlot}
                onChange={(e) => setArticleContentAdSlot(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">Između sadržaja i galerije</p>
            </div>

            {/* Article Bottom Ad Slot */}
            <div>
              <label htmlFor="articleBottomAdSlot" className="label-field">
                📝 Članak - Donji dio Slot ID
              </label>
              <input
                id="articleBottomAdSlot"
                type="text"
                className="input-field font-mono text-sm"
                placeholder="1122334455"
                value={articleBottomAdSlot}
                onChange={(e) => setArticleBottomAdSlot(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">Prije sekcije povezanih članaka</p>
            </div>

            {/* Category Top Ad Slot */}
            <div>
              <label htmlFor="categoryTopAdSlot" className="label-field">
                📁 Kategorija - Vrh Slot ID
              </label>
              <input
                id="categoryTopAdSlot"
                type="text"
                className="input-field font-mono text-sm"
                placeholder="3344556677"
                value={categoryTopAdSlot}
                onChange={(e) => setCategoryTopAdSlot(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">Iznad liste članaka u kategoriji</p>
            </div>

            {/* Category Inline Ad Slot */}
            <div>
              <label htmlFor="categoryInlineAdSlot" className="label-field">
                📁 Kategorija - Između članaka Slot ID
              </label>
              <input
                id="categoryInlineAdSlot"
                type="text"
                className="input-field font-mono text-sm"
                placeholder="4455667788"
                value={categoryInlineAdSlot}
                onChange={(e) => setCategoryInlineAdSlot(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">Svaki 6. članak u listi</p>
            </div>

            {/* Map Sidebar Ad Slot */}
            <div>
              <label htmlFor="mapSidebarAdSlot" className="label-field">
                🗺️ Mapa - Sidebar Slot ID
              </label>
              <input
                id="mapSidebarAdSlot"
                type="text"
                className="input-field font-mono text-sm"
                placeholder="5566778899"
                value={mapSidebarAdSlot}
                onChange={(e) => setMapSidebarAdSlot(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">Sidebar sa listom lokacija (desktop)</p>
            </div>

            {/* Map Bottom Ad Slot */}
            <div>
              <label htmlFor="mapBottomAdSlot" className="label-field">
                🗺️ Mapa - Donji dio Slot ID
              </label>
              <input
                id="mapBottomAdSlot"
                type="text"
                className="input-field font-mono text-sm"
                placeholder="6677889900"
                value={mapBottomAdSlot}
                onChange={(e) => setMapBottomAdSlot(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">Ispod mape (mobilni/tablet)</p>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
            <p className="text-sm text-yellow-800">
              <strong>⚠️ Važno:</strong> Slot ID-ovi su brojevi od 10 cifara koje dobijete kada kreirate novi ad unit u Google AdSense.
              Svaki slot ID mora biti jedinstveni broj koji ste dobili od Google-a.
            </p>
          </div>
        </div>

        {/* Toggle Settings */}
        <div className="card p-6 sm:p-8 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Prikaži reklame na:</h2>
          <div className="space-y-4">
            {/* Homepage Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
              <div>
                <h3 className="font-semibold text-gray-900">Početna stranica</h3>
                <p className="text-sm text-gray-600">Reklame između sekcija kategorija</p>
              </div>
              <button
                onClick={() => setEnabledOnHomepage(!enabledOnHomepage)}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                  enabledOnHomepage ? 'bg-green-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    enabledOnHomepage ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Articles Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
              <div>
                <h3 className="font-semibold text-gray-900">Članci</h3>
                <p className="text-sm text-gray-600">Reklame u sidebar-u i između sadržaja</p>
              </div>
              <button
                onClick={() => setEnabledOnArticles(!enabledOnArticles)}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                  enabledOnArticles ? 'bg-green-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    enabledOnArticles ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Categories Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
              <div>
                <h3 className="font-semibold text-gray-900">Stranice kategorija</h3>
                <p className="text-sm text-gray-600">Reklame iznad i između članaka</p>
              </div>
              <button
                onClick={() => setEnabledOnCategories(!enabledOnCategories)}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                  enabledOnCategories ? 'bg-green-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    enabledOnCategories ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Ad Placement Info */}
        <div className="card p-6 sm:p-8 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Strategija postavljanja reklama</h2>
          <div className="space-y-3 text-sm text-gray-700">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🏠</span>
              <div>
                <strong>Početna stranica:</strong> Reklame se prikazuju između sekcija kategorija za maksimalnu vidljivost.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">📝</span>
              <div>
                <strong>Članci:</strong> Sidebar reklama (desktop) i reklame između sadržaja i galerije za bolje angažovanje.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">📁</span>
              <div>
                <strong>Kategorije:</strong> Reklame iznad liste članaka i između redova (svakih 6 članaka).
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary"
          >
            {saving ? 'Čuvanje...' : '💾 Sačuvaj postavke'}
          </button>
        </div>
      </div>
    </AdminLayout>
  )
}

