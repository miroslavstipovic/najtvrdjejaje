'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Admin error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Admin Error</h2>
        <p className="text-gray-600 mb-6">
          An error occurred in the admin panel.
        </p>
        <div className="space-y-3">
          <button
            onClick={reset}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-md font-medium"
          >
            Try again
          </button>
          <Link
            href="/admin"
            className="w-full bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-md font-medium inline-block"
          >
            Back to Admin Login
          </Link>
        </div>
      </div>
    </div>
  )
}
