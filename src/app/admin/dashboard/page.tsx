'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'

interface DashboardStats {
  totalArticles: number
  publishedArticles: number
  totalCategories: number
  totalAdmins: number
}

interface FeaturedArticle {
  id: number
  title: string
  slug: string
  category: {
    id: number
    name: string
  }
}

// Removed DashboardLayout component

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [featuredArticle, setFeaturedArticle] = useState<FeaturedArticle | null>(null)
  const [loading, setLoading] = useState(true)
  const { user, isAuthenticated, loading: authLoading } = useAuth()

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData()
    }
  }, [isAuthenticated])

  const fetchDashboardData = async () => {
    const token = localStorage.getItem('adminToken')
    if (!token) return

    try {
      const [dashboardResponse, featuredResponse] = await Promise.all([
        fetch('/api/admin/dashboard', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch('/api/admin/featured', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ])

      if (dashboardResponse.ok && featuredResponse.ok) {
        const dashboardData = await dashboardResponse.json()
        const featuredData = await featuredResponse.json()
        
        setStats(dashboardData.stats)
        setFeaturedArticle(featuredData.featuredArticle)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const removeFeatured = async () => {
    if (!confirm('Remove featured status from all articles?')) return

    const token = localStorage.getItem('adminToken')
    if (!token) return

    try {
      const response = await fetch('/api/admin/featured', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      })

      if (response.ok) {
        setFeaturedArticle(null)
      } else {
        alert('Failed to remove featured article')
      }
    } catch (error) {
      console.error('Remove featured error:', error)
      alert('Failed to remove featured article')
    }
  }

  const description = user?.name ? `Dobrodošli natrag, ${user.name}` : "Dobrodošli natrag"

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Učitavanje...</p>
        </div>
              </div>
    )
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Potrebna je autentikacija</h2>
          <p className="text-gray-600 mb-6">Prijavite se za pristup administratorskoj nadzornoj ploči.</p>
          <a 
            href="/admin"
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-md font-medium inline-block"
          >
            Idi na prijavu
          </a>
                </div>
              </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <header className="bg-white shadow-soft">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Nadzorna ploča</h1>
              <p className="text-gray-600 mt-2 text-base sm:text-lg">{description}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  localStorage.removeItem('adminToken')
                  window.location.href = '/admin'
                }}
                className="btn-secondary text-sm sm:text-base"
              >
                Odjava
              </button>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Učitavanje...</p>
            </div>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10 sm:space-y-12">
            {/* Stats */}
            <section>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
                <div className="card p-8 text-center hover:shadow-lg transition-shadow">
                  <div className="text-sm sm:text-base text-gray-500 mb-2">Ukupno članaka</div>
                  <div className="text-3xl sm:text-4xl font-bold text-primary-600">{stats?.totalArticles || 0}</div>
                </div>
                <div className="card p-8 text-center hover:shadow-lg transition-shadow">
                  <div className="text-sm sm:text-base text-gray-500 mb-2">Objavljeno</div>
                  <div className="text-3xl sm:text-4xl font-bold text-green-600">{stats?.publishedArticles || 0}</div>
                </div>
                <div className="card p-8 text-center hover:shadow-lg transition-shadow">
                  <div className="text-sm sm:text-base text-gray-500 mb-2">Kategorije</div>
                  <div className="text-3xl sm:text-4xl font-bold text-blue-600">{stats?.totalCategories || 0}</div>
                </div>
                <div className="card p-8 text-center hover:shadow-lg transition-shadow">
                  <div className="text-sm sm:text-base text-gray-500 mb-2">Administratori</div>
                  <div className="text-3xl sm:text-4xl font-bold text-purple-600">{stats?.totalAdmins || 0}</div>
                </div>
              </div>
            </section>

            {/* Featured Article */}
            <section className="card p-6 sm:p-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">Istaknuti članak</h2>
              {featuredArticle ? (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 text-base sm:text-lg mb-1">{featuredArticle.title}</div>
                    <div className="text-sm sm:text-base text-gray-500 mb-2">{featuredArticle.category.name}</div>
                    <Link href={`/article/${featuredArticle.slug}`} className="text-sm sm:text-base text-primary-600 hover:text-primary-700 inline-flex items-center min-h-[44px]">
                      Pogledaj članak →
                    </Link>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Link href={`/admin/articles/${featuredArticle.id}/edit`} className="btn-secondary text-sm px-5 py-2.5">
                      Uredi
                    </Link>
                    <button onClick={removeFeatured} className="bg-red-50 hover:bg-red-100 text-red-700 px-5 py-2.5 rounded-xl font-medium transition-colors min-h-[44px] text-sm">
                      Ukloni istaknuto
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 text-base">Trenutno nema istaknutog članka</div>
              )}
            </section>

            {/* Quick Actions */}
            <section>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">Brze akcije</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
                <Link href="/admin/competitors" className="card-interactive p-8 group">
                  <div className="text-3xl mb-4">🥚</div>
                  <div className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">Natjecatelji</div>
                  <div className="text-gray-600 text-sm sm:text-base">Upravljaj natjecateljima</div>
                </Link>
                <Link href="/admin/competitions" className="card-interactive p-8 group">
                  <div className="text-3xl mb-4">🏆</div>
                  <div className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">Turniri</div>
                  <div className="text-gray-600 text-sm sm:text-base">Kreiraj i upravljaj turnirima</div>
                </Link>
                <Link href="/admin/rankings" className="card-interactive p-8 group">
                  <div className="text-3xl mb-4">📊</div>
                  <div className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">Rang liste</div>
                  <div className="text-gray-600 text-sm sm:text-base">Pregledaj i ažuriraj rang liste</div>
                </Link>
                <Link href="/admin/articles" className="card-interactive p-8 group">
                  <div className="text-3xl mb-4">📝</div>
                  <div className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">Članci</div>
                  <div className="text-gray-600 text-sm sm:text-base">Kreiraj, uredi i objavi članke</div>
                </Link>
                <Link href="/admin/categories" className="card-interactive p-8 group">
                  <div className="text-3xl mb-4">📁</div>
                  <div className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">Kategorije</div>
                  <div className="text-gray-600 text-sm sm:text-base">Organiziraj sadržaj po kategorijama</div>
                </Link>
                <Link href="/admin/media" className="card-interactive p-8 group">
                  <div className="text-3xl mb-4">🖼️</div>
                  <div className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">Biblioteka medija</div>
                  <div className="text-gray-600 text-sm sm:text-base">Upravljaj slikama i videima</div>
                </Link>
                <Link href="/admin/branding" className="card-interactive p-8 group">
                  <div className="text-3xl mb-4">🎨</div>
                  <div className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">Branding</div>
                  <div className="text-gray-600 text-sm sm:text-base">Logo i favicon</div>
                </Link>
                <Link href="/admin/admins" className="card-interactive p-8 group">
                  <div className="text-3xl mb-4">👥</div>
                  <div className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">Administratori</div>
                  <div className="text-gray-600 text-sm sm:text-base">Dodaj ili ukloni administratore</div>
                </Link>
                <Link href="/" target="_blank" className="card-interactive p-8 group">
                  <div className="text-3xl mb-4">🌐</div>
                  <div className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">Pregledaj stranicu</div>
                  <div className="text-gray-600 text-sm sm:text-base">Pogledaj kako izgleda portal</div>
                </Link>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  )
}
