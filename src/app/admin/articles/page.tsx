'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import AdminLayout from '@/components/AdminLayout'
import { useAuth } from '@/hooks/useAuth'

interface Article {
  id: number
  title: string
  slug: string
  excerpt: string | null
  isPublished: boolean
  isFeatured: boolean
  category: {
    id: number
    name: string
  }
  createdAt: string
  updatedAt: string
}

export default function AdminArticles() {
  const { isAuthenticated, loading: authLoading } = useAuth()
  const searchParams = useSearchParams()
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Article[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const router = useRouter()

  // Get page from URL on mount
  useEffect(() => {
    const pageParam = searchParams.get('page')
    if (pageParam) {
      setCurrentPage(parseInt(pageParam))
    }
  }, [searchParams])

  useEffect(() => {
    if (isAuthenticated) {
      fetchArticles(currentPage)
    }
  }, [isAuthenticated, currentPage])

  const fetchArticles = async (page: number = 1) => {
    const token = localStorage.getItem('adminToken')
    if (!token) return

    try {
      const response = await fetch(`/api/admin/articles?page=${page}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setArticles(data.articles)
        setTotalPages(data.totalPages)
        
        // Update URL without navigation
        window.history.replaceState(null, '', `/admin/articles?page=${page}`)
      }
    } catch (error) {
      console.error('Failed to fetch articles:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    
    if (!query.trim()) {
      setIsSearching(false)
      setSearchResults([])
      return
    }

    const token = localStorage.getItem('adminToken')
    if (!token) return

    setIsSearching(true)

    try {
      const response = await fetch(`/api/admin/articles?search=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.articles)
      }
    } catch (error) {
      console.error('Search error:', error)
    }
  }

  const clearSearch = () => {
    setSearchQuery('')
    setSearchResults([])
    setIsSearching(false)
  }

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Jeste li sigurni da želite obrisati "${title}"?`)) return

    const token = localStorage.getItem('adminToken')
    if (!token) return

    try {
      const response = await fetch(`/api/admin/articles/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        setArticles(articles.filter(article => article.id !== id))
      } else {
        alert('Brisanje članka nije uspjelo')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Brisanje članka nije uspjelo')
    }
  }

  const togglePublish = async (id: number, currentStatus: boolean) => {
    const token = localStorage.getItem('adminToken')
    if (!token) return

    try {
      const response = await fetch(`/api/admin/articles/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isPublished: !currentStatus }),
      })

      if (response.ok) {
        setArticles(articles.map(article => 
          article.id === id 
            ? { ...article, isPublished: !currentStatus }
            : article
        ))
      } else {
        alert('Ažuriranje statusa članka nije uspjelo')
      }
    } catch (error) {
      console.error('Update error:', error)
      alert('Failed to update article status')
    }
  }

  const setFeatured = async (id: number, title: string) => {
    if (!confirm(`Postaviti "${title}" kao istaknuti članak? Ovo će ukloniti status istaknutog s ostalih članaka.`)) return

    const token = localStorage.getItem('adminToken')
    if (!token) return

    try {
      const response = await fetch('/api/admin/featured', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ articleId: id }),
      })

      if (response.ok) {
        // Refresh the articles list to reflect the changes
        fetchArticles(currentPage)
      } else {
        const error = await response.json()
        alert(error.message || 'Postavljanje istaknutog članka nije uspjelo')
      }
    } catch (error) {
      console.error('Featured error:', error)
      alert('Postavljanje istaknutog članka nije uspjelo')
    }
  }

  return (
    <AdminLayout title="Članci" description="Upravljajte člancima">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
          <Link 
            href="/admin/articles/new"
            className="btn-primary text-sm sm:text-base text-center"
          >
            + Novi članak
          </Link>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Pretraži članke po naslovu..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full px-4 py-3 pl-10 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <svg 
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          {isSearching && searchQuery && (
            <p className="mt-2 text-sm text-gray-600">
              Pronađeno: {searchResults.length} {searchResults.length === 1 ? 'članak' : 'članaka'}
            </p>
          )}
        </div>

        {/* Articles List */}
        {(isSearching ? searchResults : articles).length === 0 ? (
          <div className="card p-12 text-center">
            <div className="text-5xl mb-6">{isSearching ? '🔍' : '📝'}</div>
            <p className="text-gray-600 text-lg mb-6">
              {isSearching ? 'Nema članaka koji odgovaraju pretrazi.' : 'Nema pronađenih članaka.'}
            </p>
            {!isSearching && (
              <Link 
                href="/admin/articles/new"
                className="btn-primary inline-flex"
              >
                Kreiraj svoj prvi članak
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {(isSearching ? searchResults : articles).map((article) => (
              <div key={article.id} className="card hover:shadow-md transition-shadow">
                <div className="p-5 sm:p-6">
                  {/* Mobile & Desktop Layout */}
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Status & Info - Left Side */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className={`badge ${
                          article.isPublished 
                            ? 'badge-success' 
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {article.isPublished ? '✓ Objavljeno' : '○ Skica'}
                        </span>
                        {article.isFeatured && (
                          <span className="badge-warning">
                            ⭐ Istaknuto
                          </span>
                        )}
                        <span className="badge bg-blue-100 text-blue-700">
                          {article.category.name}
                        </span>
                      </div>
                      
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 leading-snug">
                        {article.title}
                      </h3>
                      
                      {article.excerpt && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2 leading-relaxed">
                          {article.excerpt}
                        </p>
                      )}
                      
                      <p className="text-xs sm:text-sm text-gray-500">
                        {new Date(article.createdAt).toLocaleDateString('hr-HR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>

                    {/* Actions - Right Side */}
                    <div className="flex flex-wrap lg:flex-col gap-2 lg:items-end">
                      <button
                        onClick={() => togglePublish(article.id, article.isPublished)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors min-h-[44px] ${
                          article.isPublished
                            ? 'text-orange-700 bg-orange-50 hover:bg-orange-100'
                            : 'text-green-700 bg-green-50 hover:bg-green-100'
                        }`}
                      >
                        {article.isPublished ? 'Poništi objavu' : 'Objavi'}
                      </button>
                      
                      {article.isPublished && !article.isFeatured && (
                        <button
                          onClick={() => setFeatured(article.id, article.title)}
                          className="px-4 py-2 rounded-xl text-yellow-700 bg-yellow-50 hover:bg-yellow-100 text-sm font-medium transition-colors min-h-[44px] whitespace-nowrap"
                        >
                          Postavi kao istaknuto
                        </button>
                      )}
                      
                      <Link
                        href={`/admin/articles/${article.id}/edit?returnPage=${currentPage}`}
                        className="px-4 py-2 rounded-xl text-primary-600 bg-primary-50 hover:bg-primary-100 text-sm font-medium transition-colors min-h-[44px] inline-flex items-center justify-center"
                      >
                        Uredi
                      </Link>
                      
                      <button
                        onClick={() => handleDelete(article.id, article.title)}
                        className="px-4 py-2 rounded-xl text-red-600 bg-red-50 hover:bg-red-100 text-sm font-medium transition-colors min-h-[44px]"
                      >
                        Obriši
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!isSearching && totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <nav className="relative z-0 inline-flex rounded-2xl shadow-soft overflow-hidden">
              {currentPage > 1 && (
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  className="relative inline-flex items-center px-5 py-3 sm:px-6 sm:py-4 border-r border-gray-200 bg-white text-sm sm:text-base font-medium text-gray-700 hover:bg-gray-50 transition-colors min-h-[44px]"
                >
                  Prijašnja
                </button>
              )}
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`relative inline-flex items-center px-5 py-3 sm:px-6 sm:py-4 border-r border-gray-200 text-sm sm:text-base font-medium transition-all min-h-[44px] ${
                    currentPage === page
                      ? 'z-10 bg-primary-600 text-white hover:bg-primary-700'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              
              {currentPage < totalPages && (
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  className="relative inline-flex items-center px-5 py-3 sm:px-6 sm:py-4 bg-white text-sm sm:text-base font-medium text-gray-700 hover:bg-gray-50 transition-colors min-h-[44px]"
                >
                  Sljedeća
                </button>
              )}
            </nav>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
