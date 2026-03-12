'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface SessionExpiredModalProps {
  show: boolean
  onLogin: () => void
}

export default function SessionExpiredModal({ show, onLogin }: SessionExpiredModalProps) {
  const [countdown, setCountdown] = useState(30)
  const router = useRouter()

  useEffect(() => {
    if (show && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1)
      }, 1000)

      return () => clearTimeout(timer)
    } else if (show && countdown === 0) {
      router.push('/admin')
    }
  }, [show, countdown, router])

  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-gray-900">Session Expired</h3>
            <p className="text-gray-600">Your session has expired for security reasons.</p>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-sm text-gray-500">
            You will be redirected to the login page in <span className="font-medium text-red-600">{countdown}</span> seconds.
          </p>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={() => router.push('/admin')}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
          >
            Go to Login Now
          </button>
          <button
            onClick={onLogin}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md"
          >
            Login Again
          </button>
        </div>
      </div>
    </div>
  )
}
