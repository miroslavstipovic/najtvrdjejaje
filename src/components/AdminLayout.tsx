'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'
import LogoutButton from './LogoutButton'

interface AdminLayoutProps {
  children: React.ReactNode
  title?: string
  description?: string
}

export default function AdminLayout({ children, title, description }: AdminLayoutProps) {
  const { user, loading, isAuthenticated, logout } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isMobileMenuOpen])

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Učitavanje...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center px-5">
        <div className="text-center max-w-md">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Potrebna autentifikacija</h2>
          <p className="text-gray-600 text-base sm:text-lg mb-8">Prijavite se za pristup administratorskoj ploči.</p>
          <Link 
            href="/admin"
            className="btn-primary"
          >
            Idi na prijavu
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-soft sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-5 sm:py-6">
            {/* Mobile: Hamburger + Title */}
            <div className="flex items-center gap-4 md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="tap-target text-gray-700 hover:text-primary-600 transition-colors"
                aria-label="Toggle menu"
              >
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div>
                {title && (
                  <h1 className="text-lg font-bold text-gray-900 truncate">{title}</h1>
                )}
              </div>
            </div>

            {/* Desktop: Title + Description */}
            <div className="hidden md:block">
              {title && (
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">{title}</h1>
              )}
              {description && (
                <p className="text-gray-600 mt-1">{description}</p>
              )}
            </div>

            {/* User Info & Actions */}
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="hidden sm:block text-sm text-gray-600">
                Pozdrav, <span className="font-medium">{user?.name}</span>
              </div>
              <Link 
                href="/" 
                className="hidden sm:inline-flex tap-target text-gray-500 hover:text-primary-600 transition-colors text-sm"
                target="_blank"
              >
                Pogledaj stranicu
              </Link>
              <div className="hidden sm:block">
                <LogoutButton showConfirm={false} />
              </div>
              {/* Mobile: just user initial */}
              <div className="sm:hidden tap-target bg-primary-100 text-primary-700 rounded-full w-10 h-10 flex items-center justify-center font-semibold">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:block bg-gray-50 border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
            <div className="flex items-center gap-6 py-3 overflow-x-auto">
              <Link 
                href="/admin/dashboard"
                className="text-primary-600 hover:text-primary-700 font-medium text-sm whitespace-nowrap py-2 border-b-2 border-primary-600"
              >
                Dashboard
              </Link>
              <Link 
                href="/admin/articles"
                className="text-gray-600 hover:text-primary-600 text-sm transition-colors whitespace-nowrap py-2"
              >
                Članci
              </Link>
              <Link 
                href="/admin/categories"
                className="text-gray-600 hover:text-primary-600 text-sm transition-colors whitespace-nowrap py-2"
              >
                Kategorije
              </Link>
              <Link 
                href="/admin/competitors"
                className="text-gray-600 hover:text-primary-600 text-sm transition-colors whitespace-nowrap py-2"
              >
                Natjecatelji
              </Link>
              <Link 
                href="/admin/competitions"
                className="text-gray-600 hover:text-primary-600 text-sm transition-colors whitespace-nowrap py-2"
              >
                Turniri
              </Link>
              <Link 
                href="/admin/rankings"
                className="text-gray-600 hover:text-primary-600 text-sm transition-colors whitespace-nowrap py-2"
              >
                Rang liste
              </Link>
              <Link 
                href="/admin/media"
                className="text-gray-600 hover:text-primary-600 text-sm transition-colors whitespace-nowrap py-2"
              >
                Mediji
              </Link>
              <Link 
                href="/admin/branding"
                className="text-gray-600 hover:text-primary-600 text-sm transition-colors whitespace-nowrap py-2"
              >
                Branding
              </Link>
              <Link 
                href="/admin/settings"
                className="text-gray-600 hover:text-primary-600 text-sm transition-colors whitespace-nowrap py-2"
              >
                Postavke
              </Link>
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile Slide-out Menu */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Drawer */}
          <div className="fixed top-0 left-0 bottom-0 w-80 max-w-[85vw] bg-white z-50 md:hidden shadow-xl overflow-y-auto">
            {/* Drawer Header */}
            <div className="bg-primary-600 text-white p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Admin Menu</h2>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="tap-target text-white hover:text-primary-100 transition-colors"
                  aria-label="Close menu"
                >
                  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-white/20 rounded-full w-12 h-12 flex items-center justify-center text-xl font-semibold">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium">{user?.name}</p>
                  <p className="text-sm text-primary-100">{user?.email}</p>
                </div>
              </div>
            </div>

            {/* Drawer Navigation */}
            <nav className="p-5 space-y-2">
              <Link 
                href="/admin/dashboard"
                className="block px-4 py-4 text-gray-900 hover:bg-primary-50 hover:text-primary-600 rounded-xl font-medium transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                📊 Dashboard
              </Link>
              <Link 
                href="/admin/articles"
                className="block px-4 py-4 text-gray-900 hover:bg-primary-50 hover:text-primary-600 rounded-xl font-medium transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                📝 Članci
              </Link>
              <Link 
                href="/admin/categories"
                className="block px-4 py-4 text-gray-900 hover:bg-primary-50 hover:text-primary-600 rounded-xl font-medium transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                📁 Kategorije
              </Link>
              <Link 
                href="/admin/competitors"
                className="block px-4 py-4 text-gray-900 hover:bg-primary-50 hover:text-primary-600 rounded-xl font-medium transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                🥚 Natjecatelji
              </Link>
              <Link 
                href="/admin/competitions"
                className="block px-4 py-4 text-gray-900 hover:bg-primary-50 hover:text-primary-600 rounded-xl font-medium transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                🏆 Turniri
              </Link>
              <Link 
                href="/admin/rankings"
                className="block px-4 py-4 text-gray-900 hover:bg-primary-50 hover:text-primary-600 rounded-xl font-medium transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                📊 Rang liste
              </Link>
              <Link 
                href="/admin/media"
                className="block px-4 py-4 text-gray-900 hover:bg-primary-50 hover:text-primary-600 rounded-xl font-medium transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                🖼️ Mediji
              </Link>
              <Link 
                href="/admin/branding"
                className="block px-4 py-4 text-gray-900 hover:bg-primary-50 hover:text-primary-600 rounded-xl font-medium transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                🎨 Branding
              </Link>
              <Link 
                href="/admin/settings"
                className="block px-4 py-4 text-gray-900 hover:bg-primary-50 hover:text-primary-600 rounded-xl font-medium transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                ⚙️ Postavke
              </Link>
              <Link 
                href="/admin/admins"
                className="block px-4 py-4 text-gray-900 hover:bg-primary-50 hover:text-primary-600 rounded-xl font-medium transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                👥 Administratori
              </Link>
              <Link 
                href="/"
                className="block px-4 py-4 text-gray-900 hover:bg-primary-50 hover:text-primary-600 rounded-xl font-medium transition-colors"
                target="_blank"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                🌐 Pogledaj stranicu
              </Link>
            </nav>

            {/* Drawer Footer */}
            <div className="absolute bottom-0 left-0 right-0 p-5 border-t border-gray-200 bg-white">
              <button
                onClick={() => {
                  logout()
                  setIsMobileMenuOpen(false)
                }}
                className="w-full btn-secondary justify-center"
              >
                Odjava
              </button>
            </div>
          </div>
        </>
      )}

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
