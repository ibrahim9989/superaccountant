'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import ProfileForm from '@/components/ProfileForm'

export default function ProfilePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen w-full relative">
        <div
          className="absolute inset-0 z-0"
          style={{
            background: "radial-gradient(125% 125% at 50% 10%, #000000 40%, #010133 100%)",
          }}
        />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-azure-accent"></div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  // Always show the profile form - allow users to edit their profile
  return <ProfileForm />
}
