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
      <div className="min-h-screen w-full bg-gradient-to-br from-[#1e3a5f] to-[#DC2626] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#2B2A29] text-white">
      {/* Hero Section with Background Effects */}
      <section className="relative bg-gradient-to-br from-[#1e3a5f] via-[#264174] to-[#DC2626] py-12 sm:py-16 md:py-20 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-md mx-auto">
      {/* Login Form */}
            <div className="bg-gradient-to-br from-[#264174]/95 via-[#DC2626]/90 to-[#264174]/95 p-8 md:p-10 rounded-2xl border-2 border-white/20 shadow-2xl">
            <div className="text-center mb-8">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4 leading-tight">
                Welcome Back
              </h1>
                <p className="text-base sm:text-lg text-white/90 font-medium">
                Sign in to continue your Super Accountant journey
              </p>
            </div>

            <div className="space-y-6">
              <button
              onClick={signInWithGoogle}
                  className="w-full bg-white text-gray-900 px-8 py-5 rounded-xl text-lg font-bold hover:bg-gray-100 transition-all duration-300 flex items-center justify-center shadow-2xl shadow-white/20 hover:shadow-white/30 hover:scale-[1.02] border-2 border-white/50"
              >
                  <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>

                <div className="text-center pt-4">
                  <p className="text-white/80 text-sm">
                  By signing in, you agree to our{' '}
                    <Link href="/terms-of-service" className="text-white underline decoration-white/40 underline-offset-4 hover:decoration-white transition-colors font-medium">
                    Terms of Service
                    </Link>{' '}
                  and{' '}
                    <Link href="/privacy-policy" className="text-white underline decoration-white/40 underline-offset-4 hover:decoration-white transition-colors font-medium">
                    Privacy Policy
                    </Link>
                </p>
              </div>
            </div>
          </div>

          <div className="text-center mt-8">
            <Link
              href="/"
                className="inline-flex items-center text-white/80 hover:text-white transition-colors text-sm font-medium group"
            >
                <svg className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Home
            </Link>
          </div>
        </div>
      </div>
      </section>
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
