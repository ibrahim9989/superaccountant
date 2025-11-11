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
      <div className="min-h-screen bg-black flex items-center justify-center relative">
        <div className="absolute inset-0 opacity-40">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-white/5 via-gray-800/10 to-black/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-black/10 via-gray-700/15 to-white/5 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-800 border-t-white"></div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center">
      {/* Luxury Background Effects */}
      <div className="absolute inset-0 opacity-40">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-white/5 via-gray-800/10 to-black/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-black/10 via-gray-700/15 to-white/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] bg-gradient-to-br from-gray-900/10 via-transparent to-gray-900/10 rounded-full blur-3xl" />
      </div>

      {/* Subtle Pattern Overlay */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='50' cy='50' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Logo at top */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center space-x-3 z-20">
        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
          <span className="text-black font-bold text-lg">SA</span>
        </div>
        <span className="text-white text-2xl font-semibold tracking-tight">Super Accountant</span>
      </div>

      {/* Sign Out Button */}
      <button
        onClick={handleSignOut}
        className="absolute top-8 right-8 px-6 py-3 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 border border-gray-600/50 hover:border-gray-500/70 text-white/90 hover:text-white rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-xl z-20"
      >
        Sign Out
      </button>

      {/* Main Content */}
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto py-12 pt-32">
        <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 border border-gray-500/50 rounded-full mb-6 shadow-2xl backdrop-blur-sm relative z-30">
          <div className="w-2.5 h-2.5 bg-gradient-to-r from-white to-gray-300 rounded-full mr-3 animate-pulse"></div>
          <span className="text-white text-xs font-bold tracking-[0.22em] uppercase">PROFILE UNDER REVIEW</span>
          <div className="w-2.5 h-2.5 bg-gradient-to-r from-gray-300 to-white rounded-full ml-3 animate-pulse"></div>
        </div>

        <h1 className="text-5xl md:text-6xl font-black text-white mb-6 leading-tight bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent">
          Profile Under Review
        </h1>

        <p className="text-xl md:text-2xl text-gray-300 mb-12 leading-relaxed font-light">
          Thank you for completing your profile and assessment!
        </p>

        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-600/50 rounded-3xl p-10 mb-8 text-left max-w-3xl mx-auto shadow-2xl">
          <h2 className="text-3xl font-black text-white mb-8 bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent">
            What happens next?
          </h2>
          <div className="space-y-6 text-gray-300">
            <div className="flex items-start gap-6">
              <div className="w-12 h-12 bg-gradient-to-br from-white/20 via-gray-700/20 to-white/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1 border border-gray-600/50">
                <span className="text-white font-black text-lg">1</span>
              </div>
              <div>
                <h3 className="font-black text-white mb-2 text-lg">Profile Review</h3>
                <p className="font-light text-lg">Our team will carefully review your profile and assessment results.</p>
              </div>
            </div>

            <div className="flex items-start gap-6">
              <div className="w-12 h-12 bg-gradient-to-br from-white/20 via-gray-700/20 to-white/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1 border border-gray-600/50">
                <span className="text-white font-black text-lg">2</span>
              </div>
              <div>
                <h3 className="font-black text-white mb-2 text-lg">Evaluation</h3>
                <p className="font-light text-lg">We'll assess your background, motivation, and assessment performance.</p>
              </div>
            </div>

            <div className="flex items-start gap-6">
              <div className="w-12 h-12 bg-gradient-to-br from-white/20 via-gray-700/20 to-white/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1 border border-gray-600/50">
                <span className="text-white font-black text-lg">3</span>
              </div>
              <div>
                <h3 className="font-black text-white mb-2 text-lg">Notification</h3>
                <p className="font-light text-lg">You'll receive an email notification once your profile has been approved.</p>
              </div>
            </div>

            <div className="flex items-start gap-6">
              <div className="w-12 h-12 bg-gradient-to-br from-white/20 via-gray-700/20 to-white/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1 border border-gray-600/50">
                <span className="text-white font-black text-lg">4</span>
              </div>
              <div>
                <h3 className="font-black text-white mb-2 text-lg">Course Access</h3>
                <p className="font-light text-lg">Once approved, you'll be able to enroll in courses and start your learning journey.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-600/50 rounded-2xl p-8 mb-8 max-w-3xl mx-auto shadow-2xl">
          <p className="text-gray-200 text-xl font-light">
            <strong className="text-white font-bold">Please wait for admin approval.</strong> This typically takes 24-48 hours.
          </p>
        </div>

        <p className="text-gray-400 text-lg font-light">
          We'll notify you at <strong className="text-white font-bold">{user.email}</strong>
        </p>
      </div>
    </div>
  )
}
