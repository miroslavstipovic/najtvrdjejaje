import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Page Not Found</h2>
        <p className="text-gray-600 mb-6">
          The page you're looking for doesn't exist.
        </p>
        <Link
          href="/"
          className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-md font-medium inline-block"
        >
          Nazad na početnu
        </Link>
      </div>
    </div>
  )
}
