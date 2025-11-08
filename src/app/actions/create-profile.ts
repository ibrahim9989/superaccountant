'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createProfile() {
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
            // Ignore
          }
        },
      },
    }
  )

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Check if profile already exists
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  if (existingProfile) {
    return { success: true, message: 'Profile already exists' }
  }

  // Create profile with safe defaults for NOT NULL fields
  const profileData = {
    id: user.id,
    first_name: user.user_metadata?.given_name || user.user_metadata?.full_name || user.user_metadata?.name || 'User',
    last_name: user.user_metadata?.family_name || '',
    email: user.email || '',
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
    approval_status: 'pending' // Default to pending
  }

  console.log('Creating profile with data:', profileData)

  const { data, error } = await supabase
    .from('profiles')
    .insert(profileData)
    .select()

  if (error) {
    console.error('Profile creation error:', error)
    return { success: false, error: error.message, details: error }
  }

  console.log('Profile created successfully:', data)
  return { success: true, data }
}

