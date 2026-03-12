import Link from 'next/link'

export default function AdminNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Admin Page Not Found</h2>
        <p className="text-gray-600 mb-6">
          The admin page you're looking for doesn't exist.
        </p>
        <div className="space-y-3">
          <Link
            href="/admin/dashboard"
            className="w-full bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-md font-medium inline-block"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/admin"
            className="w-full bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-md font-medium inline-block"
          >
            Admin Login
          </Link>
        </div>
      </div>
    </div>
  )
}
