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
      <div className="min-h-screen w-full bg-gradient-to-br from-[#1e3a5f] to-[#DC2626] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-[#2B2A29] text-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#1e3a5f] via-[#264174] to-[#DC2626] py-12 sm:py-16 md:py-20 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 leading-tight">
              Profile Under Review
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-white/90 mb-6 max-w-4xl mx-auto font-medium">
              Thank you for completing your profile and assessment!
            </p>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16 bg-gradient-to-b from-[#2B2A29] to-[#264174]/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Sign Out Button */}
          <div className="flex justify-end mb-6">
            <button
              onClick={handleSignOut}
              className="px-6 py-3 bg-[#DC2626] text-white rounded-lg font-semibold hover:bg-[#B91C1C] transition-colors"
            >
              Sign Out
            </button>
          </div>

          <div className="bg-gradient-to-br from-[#264174]/50 to-[#DC2626]/40 rounded-2xl p-6 md:p-10 border border-white/10 text-left">
            <h2 className="text-2xl md:text-3xl font-black text-white mb-8">
              What happens next?
            </h2>
            <div className="space-y-6 text-white/90">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-white font-bold">1</span>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Profile Review</h3>
                  <p>Our team will carefully review your profile and assessment results.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-white font-bold">2</span>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Evaluation</h3>
                  <p>We'll assess your background, motivation, and assessment performance.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-white font-bold">3</span>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Notification</h3>
                  <p>You'll receive an email notification once your profile has been approved.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-gradient-to-br from-white/20 to-white/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1 border border-white/20">
                  <span className="text-white font-bold">4</span>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Course Access</h3>
                  <p>Once approved, you'll be able to enroll in courses and start your learning journey.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#264174]/50 to-[#DC2626]/40 rounded-xl p-6 mb-8 mt-8 border border-white/10">
            <p className="text-white/90 text-lg">
              <strong className="text-white">Please wait for admin approval.</strong> This typically takes 24-48 hours.
            </p>
          </div>

          <p className="text-white/80 text-center">
            We'll notify you at <strong className="text-white">{user.email}</strong>
          </p>
        </div>
      </section>
    </div>
  )
}
