'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'

export default function UnderReviewPage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center">
      {/* Ambient glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-10 -top-10 h-96 w-96 rounded-full bg-white/5 blur-[120px]" />
        <div className="absolute right-24 top-24 h-80 w-80 rounded-full bg-white/5 blur-[120px]" />
      </div>

      {/* Logo at top */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center space-x-3 z-10">
        <div className="w-10 h-10 bg-white rounded-sm flex items-center justify-center">
          <span className="text-black font-bold text-lg">SA</span>
        </div>
        <span className="text-white text-2xl font-semibold tracking-tight">Super Accountant</span>
      </div>

      {/* Sign Out Button */}
      <button
        onClick={handleSignOut}
        className="absolute top-8 right-8 text-white/80 hover:text-white transition-colors text-sm font-medium"
      >
        Sign Out
      </button>

      {/* Main Content */}
      <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
        {/* Icon */}
        <div className="w-24 h-24 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-8">
          <svg className="w-12 h-12 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <h1 className="text-5xl md:text-6xl font-bold text-white mb-6" style={{ fontFamily: 'var(--font-display)' }}>
          Profile Under Review
        </h1>

        <p className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed">
          Thank you for completing your profile and assessment!
        </p>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 mb-8 text-left max-w-2xl mx-auto">
          <h2 className="text-2xl font-semibold text-white mb-4">What happens next?</h2>
          <div className="space-y-4 text-gray-300">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-blue-400 font-bold">1</span>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">Profile Review</h3>
                <p>Our team will carefully review your profile and assessment results.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-blue-400 font-bold">2</span>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">Evaluation</h3>
                <p>We'll assess your background, motivation, and assessment performance.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-blue-400 font-bold">3</span>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">Notification</h3>
                <p>You'll receive an email notification once your profile has been approved.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-green-400 font-bold">4</span>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">Course Access</h3>
                <p>Once approved, you'll be able to enroll in courses and start your learning journey.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-6 mb-8 max-w-2xl mx-auto">
          <p className="text-yellow-300 text-lg">
            <strong>Please wait for admin approval.</strong> This typically takes 24-48 hours.
          </p>
        </div>

        <p className="text-gray-400 text-sm">
          We'll notify you at <strong className="text-white">{user.email}</strong>
        </p>
      </div>
    </div>
  )
}



