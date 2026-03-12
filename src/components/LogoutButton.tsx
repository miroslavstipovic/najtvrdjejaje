'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'

interface LogoutButtonProps {
  className?: string
  variant?: 'button' | 'link'
  showConfirm?: boolean
}

export default function LogoutButton({ 
  className = '', 
  variant = 'button',
  showConfirm = true 
}: LogoutButtonProps) {
  const [loading, setLoading] = useState(false)
  const { logout } = useAuth()

  const handleLogout = async () => {
    if (showConfirm && !confirm('Are you sure you want to logout?')) {
      return
    }

    setLoading(true)
    // Simplified: clear client token only
    logout()
    setLoading(false)
  }

  const baseClasses = variant === 'button' 
    ? 'bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50'
    : 'text-red-600 hover:text-red-700 text-sm font-medium transition-colors'

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className={`${baseClasses} ${className}`}
    >
      {loading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 inline" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Logging out...
        </>
      ) : (
        'Logout'
      )}
    </button>
  )
}
