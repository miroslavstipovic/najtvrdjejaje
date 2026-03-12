'use client'

import { useEffect, useState } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { useAuth } from '@/hooks/useAuth'

interface Category {
  id: number
  name: string
  slug: string
  description: string | null
  coverImage: string | null
  order: number
  _count: {
    articles: number
  }
  createdAt: string
  updatedAt: string
}

export default function AdminCategories() {
  const { isAuthenticated, loading: authLoading } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)

  useEffect(() => {
    if (isAuthenticated) {
      fetchCategories()
    }
  }, [isAuthenticated])

  const fetchCategories = async () => {
    const token = localStorage.getItem('adminToken')
    if (!token) return

    try {
      const response = await fetch('/api/admin/categories', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        // Sort by order
        const sortedCategories = data.categories.sort((a: Category, b: Category) => a.order - b.order)
        setCategories(sortedCategories)
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Jeste li sigurni da želite obrisati "${name}"? Ovo će također obrisati sve članke u ovoj kategoriji.`)) return

    const token = localStorage.getItem('adminToken')
    if (!token) return

    try {
      const response = await fetch(`/api/admin/categories/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        setCategories(categories.filter(category => category.id !== id))
      } else {
        const error = await response.json()
        alert(error.message || 'Brisanje kategorije nije uspjelo')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Brisanje kategorije nije uspjelo')
    }
  }

  const updateOrder = async (id: number, newOrder: number) => {
    const token = localStorage.getItem('adminToken')
    if (!token) return

    try {
      const response = await fetch(`/api/admin/categories/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ order: newOrder }),
      })

      if (response.ok) {
        const updatedCategory = await response.json()
        setCategories(categories.map(cat => 
          cat.id === id ? updatedCategory : cat
        ).sort((a, b) => a.order - b.order))
      }
    } catch (error) {
      console.error('Update order error:', error)
    }
  }

  return (
    <AdminLayout title="Kategorije" description="Organiziraj kategorije sadržaja">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn-primary"
          >
            + Nova kategorija
          </button>
        </div>

        {/* Info about ordering */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <p className="text-sm text-blue-800">
            <strong>💡 Redoslijed kategorija:</strong> Broj redoslijeda određuje kako će kategorije biti prikazane na početnoj stranici. 
            Manji broj = prikazuje se prije.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <div key={category.id} className="card">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {category.name}
                      </h3>
                      <span className="badge bg-gray-100 text-gray-700 text-xs">
                        #{category.order}
                      </span>
                    </div>
                    {category.description && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {category.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span className="badge badge-primary text-xs">
                        {category._count.articles} članaka
                      </span>
                      <span className="text-xs">
                        /{category.slug}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Order Controls */}
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Redoslijed prikaza
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={category.order}
                      onChange={(e) => updateOrder(category.id, parseInt(e.target.value) || 0)}
                      className="w-20 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      min="0"
                    />
                    <div className="flex gap-1">
                      <button
                        onClick={() => updateOrder(category.id, Math.max(0, category.order - 1))}
                        className="p-1.5 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="Pomakni gore"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => updateOrder(category.id, category.order + 1)}
                        className="p-1.5 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="Pomakni dolje"
                      >
                        ↓
                      </button>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setEditingCategory(category)}
                    className="flex-1 px-4 py-2 text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-xl text-sm font-medium transition-colors"
                  >
                    Uredi
                  </button>
                  {category._count.articles === 0 && (
                    <button
                      onClick={() => handleDelete(category.id, category.name)}
                      className="px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl text-sm font-medium transition-colors"
                    >
                      Obriši
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {categories.length === 0 && !loading && (
            <div className="col-span-full card p-12 text-center">
              <div className="text-5xl mb-6">📁</div>
              <p className="text-gray-600 text-lg mb-6">Nema pronađenih kategorija.</p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="btn-primary inline-flex"
              >
                Kreiraj svoju prvu kategoriju
              </button>
            </div>
          )}
        </div>

        {/* Create/Edit Category Modal */}
        {(showCreateForm || editingCategory) && (
          <CategoryModal
            category={editingCategory}
            onClose={() => {
              setShowCreateForm(false)
              setEditingCategory(null)
            }}
            onSuccess={(newCategory) => {
              if (editingCategory) {
                setCategories(categories.map(cat => 
                  cat.id === newCategory.id ? newCategory : cat
                ).sort((a, b) => a.order - b.order))
              } else {
                setCategories([...categories, newCategory].sort((a, b) => a.order - b.order))
              }
              setShowCreateForm(false)
              setEditingCategory(null)
            }}
          />
        )}
      </div>
    </AdminLayout>
  )
}

interface CategoryModalProps {
  category: Category | null
  onClose: () => void
  onSuccess: (category: Category) => void
}

function CategoryModal({ category, onClose, onSuccess }: CategoryModalProps) {
  const [name, setName] = useState(category?.name || '')
  const [description, setDescription] = useState(category?.description || '')
  const [order, setOrder] = useState(category?.order?.toString() || '0')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const token = localStorage.getItem('adminToken')
    if (!token) return

    try {
      const url = category 
        ? `/api/admin/categories/${category.id}`
        : '/api/admin/categories'
      
      const method = category ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          name, 
          description: description || null,
          order: parseInt(order) || 0,
        }),
      })

      if (response.ok) {
        const savedCategory = await response.json()
        onSuccess(savedCategory)
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Spremanje kategorije nije uspjelo')
      }
    } catch (error) {
      setError('Spremanje kategorije nije uspjelo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          {category ? 'Uredi kategoriju' : 'Nova kategorija'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="category-name" className="label-field">
              Naziv kategorije
            </label>
            <input
              id="category-name"
              name="categoryName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              placeholder="npr. Tehnologija, Vijesti..."
              required
            />
          </div>

          <div>
            <label htmlFor="category-description" className="label-field">
              Opis (opcionalno)
            </label>
            <textarea
              id="category-description"
              name="categoryDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="input-field"
              placeholder="Kratki opis kategorije..."
            />
          </div>

          <div>
            <label htmlFor="category-order" className="label-field">
              Redoslijed prikaza
            </label>
            <input
              id="category-order"
              name="categoryOrder"
              type="number"
              value={order}
              onChange={(e) => setOrder(e.target.value)}
              className="input-field"
              min="0"
              placeholder="0"
            />
            <p className="text-xs text-gray-500 mt-1">
              Manji broj znači da će se kategorija prikazati prije na početnoj stranici
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
            >
              Odustani
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn-primary"
            >
              {loading ? 'Spremanje...' : (category ? 'Ažuriraj' : 'Kreiraj')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
