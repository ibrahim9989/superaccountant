'use client'

import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { getSupabaseClient } from '@/lib/supabase/client'

interface AuthContextType {
  user: User | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = useMemo(() => getSupabaseClient(), [])

  useEffect(() => {
    let mounted = true

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (mounted) {
          setUser(session?.user ?? null)
          setLoading(false)
        }
      } catch (error) {
        console.error('Error getting initial session:', error)
        if (mounted) {
          setLoading(false)
        }
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: Session | null) => {
        if (mounted) {
          setUser(session?.user ?? null)
          setLoading(false)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase]) // Supabase is memoized, so it's stable

  const signInWithGoogle = useCallback(async () => {
    try {
      const url = new URL(window.location.href)
      const nextParam = url.searchParams.get('next') || '/'
      const redirectPath = nextParam.startsWith('/') ? nextParam : '/'
      
      console.log('Initiating Google sign-in with:', {
        origin: window.location.origin,
        redirectTo: `${window.location.origin}/auth/callback`,
        nextParam: redirectPath
      })
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            next: redirectPath
          }
        }
      })
      
      console.log('OAuth response:', { data, error })
      
      if (error) {
        console.error('Error signing in with Google:', error)
        alert(`Authentication error: ${error.message}`)
      }
    } catch (error) {
      console.error('Unexpected error during Google sign-in:', error)
      alert('An unexpected error occurred. Please try again.')
    }
  }, [supabase])

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Error signing out:', error)
    }
  }, [supabase])

  const value = useMemo(() => ({
    user,
    loading,
    signInWithGoogle,
    signOut
  }), [user, loading, signInWithGoogle, signOut])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
