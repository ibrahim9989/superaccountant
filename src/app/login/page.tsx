'use client'

import { useAuth } from '@/contexts/AuthContext'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, Suspense } from 'react'
import Link from 'next/link'

function LoginContent() {
  const { user, loading, signInWithGoogle } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextParam = searchParams?.get('next') || ''
  const supabase = getSupabaseClient()

  useEffect(() => {
    const run = async () => {
      if (user && !loading) {
        // Determine proper destination based on profile + approval_status + assessment
        const { data: profile } = await supabase
          .from('profiles')
          .select('approval_status, first_name, phone')
          .eq('id', user.id)
          .maybeSingle()

        // No profile or incomplete profile -> profile form
        if (!profile || !profile.first_name || !profile.phone) {
          router.push('/profile-form')
          return
        }

        // Approved -> dashboard
        if (profile.approval_status === 'approved') {
          router.push('/dashboard')
          return
        }

        // Pending or null/rejected -> check assessment completion
        const { data: assessmentSession } = await supabase
          .from('test_sessions')
          .select('id, status')
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .order('completed_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (assessmentSession) {
          // Assessment completed -> under review
          router.push('/under-review')
        } else {
          // No assessment -> assessment page
          router.push('/assessment')
        }
      }
    }
    run()
  }, [user, loading, router, nextParam, supabase])

  if (loading) {
    return (
      <div className="min-h-screen w-full relative bg-black">
        <div className="absolute inset-0 opacity-40">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-white/5 via-gray-800/10 to-black/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-black/10 via-gray-700/15 to-white/5 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-800 border-t-white"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full relative bg-black">
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

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between p-6 lg:px-12">
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <span className="text-black font-bold text-sm">SA</span>
          </div>
          <span className="text-white text-xl font-semibold">Super Accountant</span>
        </Link>
      </nav>

      {/* Login Form */}
      <div className="relative z-10 flex items-center justify-center min-h-[80vh] px-6">
        <div className="max-w-md w-full">
          {/* Premium Badge */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 border border-gray-500/50 rounded-full mb-6 shadow-2xl backdrop-blur-sm">
              <div className="w-2.5 h-2.5 bg-gradient-to-r from-white to-gray-300 rounded-full mr-3 animate-pulse"></div>
              <span className="text-white text-xs font-bold tracking-[0.22em] uppercase">ELITE ACCOUNTING MASTERY</span>
              <div className="w-2.5 h-2.5 bg-gradient-to-r from-gray-300 to-white rounded-full ml-3 animate-pulse"></div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-600/50 rounded-3xl p-10 shadow-2xl backdrop-blur-sm">
            <div className="text-center mb-10">
              <h1 className="text-5xl md:text-6xl font-black text-white mb-4 leading-tight bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent">
                Welcome Back
              </h1>
              <p className="text-xl text-gray-300 font-light">
                Sign in to continue your Super Accountant journey
              </p>
            </div>

            <div className="space-y-6">
              <button
                onClick={signInWithGoogle}
                className="group relative w-full flex items-center justify-center px-8 py-5 bg-gradient-to-r from-white via-gray-100 to-white text-black font-bold rounded-2xl transition-all duration-500 transform hover:scale-105 shadow-2xl shadow-white/25 hover:shadow-white/40 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-white to-gray-200 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <span className="relative z-10 flex items-center">
                  <span className="w-6 h-6 mr-3 rounded-full border-2 border-gray-900 flex items-center justify-center text-xs font-black">G</span>
                  Continue with Google
                </span>
              </button>

              <div className="text-center pt-4">
                <p className="text-gray-400 text-sm">
                  By signing in, you agree to our{' '}
                  <a href="#" className="text-white underline decoration-gray-500/40 underline-offset-4 hover:decoration-white transition-colors font-medium">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="#" className="text-white underline decoration-gray-500/40 underline-offset-4 hover:decoration-white transition-colors font-medium">
                    Privacy Policy
                  </a>
                </p>
              </div>
            </div>
          </div>

          <div className="text-center mt-8">
            <Link
              href="/"
              className="inline-flex items-center text-gray-400 hover:text-white transition-colors text-sm font-medium group"
            >
              <svg className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center">Loading…</div>}>
      <LoginContent />
    </Suspense>
  )
}
