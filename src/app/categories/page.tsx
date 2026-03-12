import { prisma } from '@/lib/prisma'
import Link from 'next/link'

interface Article {
  id: number
  title: string
  slug: string
  excerpt: string | null
  coverImage: string | null
  createdAt: Date
}

interface Category {
  id: number
  name: string
  slug: string
  description: string | null
  coverImage: string | null
  _count: {
    articles: number
  }
  articles: Article[]
}

export default async function CategoriesPage() {
  let categories: Category[] = []

  if (process.env.PRISMA_POSTGRES) {
    try {
      // Get all categories with article counts
      categories = await prisma.category.findMany({
        include: {
          _count: {
            select: {
              articles: {
                where: { isPublished: true }
              }
            }
          },
          articles: {
            where: { isPublished: true },
            take: 3,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              title: true,
              slug: true,
              excerpt: true,
              coverImage: true,
              createdAt: true,
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
      })
    } catch (error) {
      console.warn('Failed to load categories:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white shadow-sm">
        <div className="container-custom py-4">
          <nav className="flex" aria-label="Navigacijski put">
            <ol className="inline-flex items-center space-x-1 md:space-x-3">
              <li className="inline-flex items-center">
                <Link 
                  href="/" 
                  className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-primary-600"
                >
                  <svg className="w-3 h-3 mr-2.5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
                  </svg>
                  Početna
                </Link>
              </li>
              <li aria-current="page">
                <div className="flex items-center">
                  <svg className="w-3 h-3 text-gray-400 mx-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                  </svg>
                  <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">
                    Kategorije
                  </span>
                </div>
              </li>
            </ol>
          </nav>
        </div>
      </div>

      {/* Categories Header */}
      <div className="bg-white">
        <div className="container-custom py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Pregled kategorija
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Istražite naš raznoliki video sadržaj organiziran po temama
            </p>
            <div className="w-20 h-1 bg-primary-600 mx-auto mt-4"></div>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="container-custom py-12">
        {categories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {categories.map((category) => (
              <div key={category.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                {/* Category Header */}
                <div className="p-6 pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">
                      {category.name}
                    </h2>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                      {category._count.articles} članaka
                    </span>
                  </div>
                  {category.description && (
                    <p className="text-gray-600 text-sm mb-4">
                      {category.description}
                    </p>
                  )}
                </div>

                {/* Recent Articles Preview */}
                {category.articles.length > 0 && (
                  <div className="px-6 pb-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Nedavni članci:</h3>
                    <div className="space-y-2">
                      {category.articles.map((article) => (
                        <Link
                          key={article.id}
                          href={`/article/${article.slug}`}
                          className="block text-sm text-gray-600 hover:text-primary-600 transition-colors line-clamp-1"
                        >
                          • {article.title}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* View All Button */}
                <div className="p-6 pt-4 border-t border-gray-100">
                  <Link
                    href={`/category/${category.slug}`}
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-primary-600 text-primary-600 hover:bg-primary-600 hover:text-white font-medium rounded-md transition-colors"
                  >
                    Pogledaj sve članke
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nema pronađenih kategorija</h3>
            <p className="text-gray-500 mb-4">
              Kategorije će se pojaviti ovdje nakon što ih administrator kreira.
            </p>
            <Link 
              href="/"
              className="btn-primary"
            >
              Idi na početnu stranicu
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export const metadata = {
  title: 'Categories - Video Portal',
  description: 'Browse all video content categories available on Video Portal.',
}
