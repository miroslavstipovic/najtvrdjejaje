'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'

interface HeaderProps {
  logoUrl?: string | null
  siteName?: string
}

export default function Header({ logoUrl, siteName = 'Najtvrđe Jaje' }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isMenuOpen])

  return (
    <header className="bg-cream-50 shadow-soft sticky top-0 z-50 border-b border-gold-200">
      <nav className="container-custom">
        <div className="flex justify-between items-center h-24">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={siteName}
                width={450}
                height={150}
                className="h-20 w-auto object-contain"
                priority
              />
            ) : (
              <span className="text-xl sm:text-2xl font-bold text-primary-600">
                🥚 {siteName}
              </span>
            )}
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4 lg:space-x-6">
            <Link href="/" className="text-primary-700 hover:text-primary-500 transition-colors font-medium text-sm py-2 border-b-2 border-transparent hover:border-gold-500">
              Početna
            </Link>
            <Link href="/natjecatelji" className="text-primary-700 hover:text-primary-500 transition-colors font-medium text-sm py-2 border-b-2 border-transparent hover:border-gold-500">
              Natjecatelji
            </Link>
            <Link href="/turniri" className="text-primary-700 hover:text-primary-500 transition-colors font-medium text-sm py-2 border-b-2 border-transparent hover:border-gold-500">
              Turniri
            </Link>
            <Link href="/rang-lista" className="text-primary-700 hover:text-primary-500 transition-colors font-medium text-sm py-2 border-b-2 border-transparent hover:border-gold-500">
              Rang lista
            </Link>
            <Link href="/categories" className="text-primary-700 hover:text-primary-500 transition-colors font-medium text-sm py-2 border-b-2 border-transparent hover:border-gold-500">
              Kategorije
            </Link>
            <Link href="/about" className="text-primary-700 hover:text-primary-500 transition-colors font-medium text-sm py-2 border-b-2 border-transparent hover:border-gold-500">
              O nama
            </Link>
            <Link href="/contact" className="text-primary-700 hover:text-primary-500 transition-colors font-medium text-sm py-2 border-b-2 border-transparent hover:border-gold-500">
              Kontakt
            </Link>
            <Link
              href="/admin"
              className="ml-2 p-2 text-gray-400 hover:text-primary-600 transition-colors rounded-lg hover:bg-primary-50"
              title="Administracija"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden tap-target text-primary-700 hover:text-gold-600 transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Navigation Overlay */}
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-primary-900 bg-opacity-50 md:hidden z-40"
              onClick={() => setIsMenuOpen(false)}
            />
            
            {/* Slide-out Menu */}
            <div className="fixed top-24 left-0 right-0 bottom-0 bg-cream-50 md:hidden z-50 overflow-y-auto animate-slide-down">
              <div className="px-4 py-4 space-y-1">
                <Link 
                  href="/" 
                  className="block px-4 py-3 text-primary-800 hover:bg-gold-100 hover:text-primary-600 rounded-xl font-medium text-base transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Početna
                </Link>
                <Link 
                  href="/natjecatelji" 
                  className="block px-4 py-3 text-primary-800 hover:bg-gold-100 hover:text-primary-600 rounded-xl font-medium text-base transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Natjecatelji
                </Link>
                <Link 
                  href="/turniri" 
                  className="block px-4 py-3 text-primary-800 hover:bg-gold-100 hover:text-primary-600 rounded-xl font-medium text-base transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Turniri
                </Link>
                <Link 
                  href="/rang-lista" 
                  className="block px-4 py-3 text-primary-800 hover:bg-gold-100 hover:text-primary-600 rounded-xl font-medium text-base transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Rang lista
                </Link>
                <Link 
                  href="/categories" 
                  className="block px-4 py-3 text-primary-800 hover:bg-gold-100 hover:text-primary-600 rounded-xl font-medium text-base transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Kategorije
                </Link>
                <Link 
                  href="/about" 
                  className="block px-4 py-3 text-primary-800 hover:bg-gold-100 hover:text-primary-600 rounded-xl font-medium text-base transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  O nama
                </Link>
                <Link 
                  href="/contact" 
                  className="block px-4 py-3 text-primary-800 hover:bg-gold-100 hover:text-primary-600 rounded-xl font-medium text-base transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Kontakt
                </Link>
                <div className="border-t border-gray-200 mt-2 pt-2">
                  <Link 
                    href="/admin" 
                    className="flex items-center gap-2 px-4 py-3 text-gray-400 hover:bg-primary-50 hover:text-primary-600 rounded-xl font-medium text-sm transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Administracija
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}
      </nav>
    </header>
  )
}
