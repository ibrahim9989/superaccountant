import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')
  const next = requestUrl.searchParams.get('next') ?? '/dashboard'
  const origin = requestUrl.origin

  console.log('Auth callback received:', {
    code: !!code,
    error,
    errorDescription,
    next,
    origin,
    fullUrl: request.url,
    allParams: Object.fromEntries(requestUrl.searchParams.entries())
  })

  if (error) {
    console.error('OAuth error:', error, errorDescription)
    return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${error}&description=${encodeURIComponent(errorDescription || '')}`)
  }

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    )

    try {
      // Exchange code for session
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

      console.log('Session exchange result:', {
        hasSession: !!data.session,
        hasUser: !!data.user,
        error: exchangeError?.message
      })

      if (exchangeError) {
        console.error('Session exchange error:', exchangeError)
        return NextResponse.redirect(`${origin}/auth/auth-code-error?error=session_exchange_failed&description=${encodeURIComponent(exchangeError.message)}`)
      }

      if (data.session && data.user) {
        // Check profile and assessment status to determine redirect
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id, approval_status, first_name, phone')
            .eq('id', data.user.id)
            .maybeSingle()

          console.log('Profile check:', { exists: !!profile, status: profile?.approval_status, error: profileError })

          // If no profile exists, redirect to profile form
          if (!profile) {
            console.log('No profile found, redirecting to profile form')
            return NextResponse.redirect(`${origin}/profile-form`)
          }

          // Check if profile form is incomplete (basic fields missing)
          const isProfileIncomplete = !profile.first_name || !profile.phone
          
          if (isProfileIncomplete) {
            console.log('Profile incomplete, redirecting to profile form')
            return NextResponse.redirect(`${origin}/profile-form`)
          }

          // Profile exists and is complete, check approval status
          const approvalStatus = profile.approval_status

          if (approvalStatus === 'approved') {
            // Approved users go to dashboard
            console.log('User approved, redirecting to dashboard')
            return NextResponse.redirect(`${origin}/dashboard`)
          }

          // For pending or null/rejected status, check if assessment is completed
          const { data: assessmentSession, error: assessmentError } = await supabase
            .from('test_sessions')
            .select('id, status, completed_at')
            .eq('user_id', data.user.id)
            .eq('status', 'completed')
            .order('completed_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          console.log('Assessment check:', { 
            exists: !!assessmentSession, 
            error: assessmentError 
          })

          if (assessmentSession) {
            // Assessment completed, show under review
            console.log('Assessment completed, redirecting to under-review')
            return NextResponse.redirect(`${origin}/under-review`)
          } else {
            // No assessment completed, redirect to assessment
            console.log('No assessment completed, redirecting to assessment')
            return NextResponse.redirect(`${origin}/assessment`)
          }
        } catch (err) {
          console.error('Profile/assessment check error:', err)
          // Default to profile form on error
          return NextResponse.redirect(`${origin}/profile-form`)
        }
      }

      console.error('No session or user after exchange')
      return NextResponse.redirect(`${origin}/auth/auth-code-error?error=no_session`)
    } catch (err) {
      console.error('Unexpected error in callback:', err)
      return NextResponse.redirect(`${origin}/auth/auth-code-error?error=unexpected_error&description=${encodeURIComponent(String(err))}`)
    }
  }

  // No code provided
  console.error('No authorization code received. Full URL:', request.url)
  return NextResponse.redirect(`${origin}/auth/auth-code-error?error=no_code&description=${encodeURIComponent('No authorization code in callback. This usually means the OAuth provider did not complete the flow.')}`)
}
