'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function AuthCodeErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const description = searchParams.get('description')

  return (
      <div className="max-w-2xl w-full space-y-8 text-center px-6">
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          
          <h2 className="text-3xl font-bold text-white mb-4">
            Authentication Error
          </h2>
          
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 font-mono text-sm">
                Error: {error}
              </p>
              {description && (
                <p className="text-red-300 text-sm mt-2">
                  {description}
                </p>
              )}
            </div>
          )}
          
          <p className="text-gray-300 mb-6">
            There was an error during the authentication process. This could be due to:
          </p>
          
          <ul className="text-sm text-gray-400 text-left max-w-lg mx-auto space-y-3 mb-8">
            <li className="flex items-start gap-3">
              <span className="text-red-400 mt-1">•</span>
              <span><strong className="text-white">Redirect URL not configured:</strong> Make sure <code className="bg-white/10 px-2 py-1 rounded text-xs">http://localhost:3000/auth/callback</code> is added to your Supabase project&apos;s Authentication → URL Configuration → Redirect URLs</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-400 mt-1">•</span>
              <span><strong className="text-white">Invalid or expired code:</strong> The authentication code may have expired</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-400 mt-1">•</span>
              <span><strong className="text-white">Network issues:</strong> Check your internet connection</span>
            </li>
          </ul>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6 text-left">
            <p className="text-blue-300 text-sm font-semibold mb-2">
              🔧 Quick Fix:
            </p>
            <ol className="text-gray-300 text-sm space-y-2">
              <li>1. Go to <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Supabase Dashboard</a></li>
              <li>2. Select your project → Authentication → URL Configuration</li>
              <li>3. Add <code className="bg-white/10 px-2 py-1 rounded text-xs">http://localhost:3000/auth/callback</code> to Redirect URLs</li>
              <li>4. For production, also add your Vercel URL: <code className="bg-white/10 px-2 py-1 rounded text-xs">https://yourdomain.vercel.app/auth/callback</code></li>
            </ol>
          </div>
        </div>

        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </Link>
          <Link
            href="/"
            className="px-8 py-4 bg-white/5 text-white font-semibold rounded-lg hover:bg-white/10 transition-colors border border-white/10"
          >
            Back to Home
          </Link>
        </div>
      </div>
  )
}

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <Suspense fallback={<div className="text-white">Loading...</div>}>
        <AuthCodeErrorContent />
      </Suspense>
    </div>
  )
}



