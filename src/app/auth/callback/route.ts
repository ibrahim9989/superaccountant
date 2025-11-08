import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  
  console.log('Auth callback received:', { 
    code: !!code, 
    error, 
    errorDescription,
    origin,
    url: request.url 
  })

  if (error) {
    console.error('OAuth error:', error, errorDescription)
    return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${error}&description=${errorDescription}`)
  }

  if (code) {
    try {
      // Create a new client instance for server-side use
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      
      // Exchange the code for a session
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      
      console.log('Session exchange result:', { 
        hasSession: !!data.session, 
        hasUser: !!data.user, 
        error: exchangeError?.message 
      })
      
      if (exchangeError) {
        console.error('Session exchange error:', exchangeError)
        return NextResponse.redirect(`${origin}/auth/auth-code-error?error=session_exchange_failed&description=${exchangeError.message}`)
      }
      
      if (data.session && data.user) {
        // Check if profile exists, if not create it
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', data.user.id)
            .single()

          if (profileError && profileError.code === 'PGRST116') {
            // Profile doesn't exist, create it
            const { error: insertError } = await supabase
              .from('profiles')
              .insert({
                id: data.user.id,
                first_name: data.user.user_metadata?.given_name || '',
                last_name: data.user.user_metadata?.family_name || '',
                email: data.user.email || '',
                phone: '',
                date_of_birth: null,
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
                emergency_contact_relation: ''
              })

            if (insertError) {
              console.error('Failed to create profile:', insertError)
              // Don't fail the auth, just log the error
            }
          }
        } catch (profileErr) {
          console.error('Profile check/creation error:', profileErr)
          // Don't fail the auth, just log the error
        }

        // Success - redirect to dashboard
        return NextResponse.redirect(`${origin}/dashboard`)
      } else {
        console.error('No session or user after exchange')
        return NextResponse.redirect(`${origin}/auth/auth-code-error?error=no_session`)
      }
    } catch (err) {
      console.error('Unexpected error in callback:', err)
      return NextResponse.redirect(`${origin}/auth/auth-code-error?error=unexpected_error&description=${err}`)
    }
  }

  // No code provided
  console.error('No authorization code received')
  return NextResponse.redirect(`${origin}/auth/auth-code-error?error=no_code`)
}
