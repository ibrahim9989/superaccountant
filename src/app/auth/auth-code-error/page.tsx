import Link from 'next/link'

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Authentication Error
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            There was an error during the authentication process. This could be due to:
          </p>
          <ul className="mt-4 text-sm text-gray-600 text-left max-w-sm mx-auto">
            <li>• Invalid or expired authentication code</li>
            <li>• Network connectivity issues</li>
            <li>• Configuration problems</li>
          </ul>
        </div>
        <div className="mt-8">
          <Link
            href="/login"
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
          >
            Try Again
          </Link>
        </div>
      </div>
    </div>
  )
}



