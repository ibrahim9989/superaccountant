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
      <div className="min-h-screen w-full relative">
        <div
          className="absolute inset-0 z-0"
          style={{ background: 'radial-gradient(125% 125% at 50% 10%, #000, #111 60%, #000 100%)' }}
        />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full relative">
      {/* Monochrome Background */}
      <div
        className="absolute inset-0 z-0"
        style={{ background: 'radial-gradient(125% 125% at 50% 10%, #000, #111 60%, #000 100%)' }}
      />

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between p-6 lg:px-12">
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">SA</span>
          </div>
          <span className="text-white text-xl font-semibold">Super Accountant</span>
        </Link>
      </nav>

      {/* Login Form */}
      <div className="relative z-10 flex items-center justify-center min-h-[80vh] px-6">
        <div className="max-w-md w-full">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 shadow-2xl">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">
                Welcome Back
              </h1>
              <p className="text-gray-300">
                Sign in to continue your Super Accountant journey
              </p>
            </div>

            <div className="space-y-6">
              <button
              onClick={signInWithGoogle}
                className="w-full flex items-center justify-center px-6 py-4 bg-white hover:bg-gray-50 text-gray-900 font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                {/* Monochrome Google-style glyph */}
                <span className="w-5 h-5 mr-3 rounded-full border border-gray-400 flex items-center justify-center text-xs font-bold">G</span>
                Continue with Google
              </button>

              <div className="text-center">
                <p className="text-gray-400 text-sm">
                  By signing in, you agree to our{' '}
                  <a href="#" className="text-white underline decoration-gray-500/40 underline-offset-4 hover:decoration-white transition-colors">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="#" className="text-white underline decoration-gray-500/40 underline-offset-4 hover:decoration-white transition-colors">
                    Privacy Policy
                  </a>
                </p>
              </div>
            </div>
          </div>

          <div className="text-center mt-8">
            <Link
              href="/"
              className="text-gray-400 hover:text-white transition-colors text-sm"
            >
              ← Back to Home
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
