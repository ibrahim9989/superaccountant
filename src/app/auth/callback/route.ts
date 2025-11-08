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
        // Check if profile exists, if not create it
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', data.user.id)
            .maybeSingle()

          console.log('Profile check:', { exists: !!profile, error: profileError })

          if (!profile) {
            console.log('Creating profile for user:', data.user.id)
            console.log('User metadata:', data.user.user_metadata)
            
            // Profile doesn't exist, create it with all required fields
            const profileData = {
              id: data.user.id,
              first_name: data.user.user_metadata?.given_name || data.user.user_metadata?.full_name || 'User',
              last_name: data.user.user_metadata?.family_name || '',
              email: data.user.email || '',
              phone: '',
              date_of_birth: '2000-01-01', // Default date since it's NOT NULL
              address: '',
              city: '',
              state: '',
              zip_code: '',
              country: '',
              education: '',
              work_experience: '',
              current_occupation: '',
              accounting_experience: '',
              motivation: '',
              goals: '',
              emergency_contact_name: '',
              emergency_contact_phone: '',
              emergency_contact_relation: '',
              approval_status: 'pending' // Default to pending until admin approves
            }

            console.log('Inserting profile:', profileData)

            const { data: insertedProfile, error: insertError } = await supabase
              .from('profiles')
              .upsert(profileData, { onConflict: 'id' })
              .select()

            if (insertError) {
              console.error('Failed to create profile:', insertError)
              console.error('Profile data that failed:', profileData)
              // Don't fail auth, but log extensively
            } else {
              console.log('Profile created successfully:', insertedProfile)
            }
          } else {
            console.log('Profile already exists')
          }
        } catch (profileErr) {
          console.error('Profile check/creation error:', profileErr)
        }

        // Redirect to profile form for new users, or to intended destination
        const redirectTo = next.startsWith('/') ? next : '/profile-form'
        console.log('Redirecting to:', redirectTo)
        return NextResponse.redirect(`${origin}${redirectTo}`)
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
