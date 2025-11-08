'use client'

import { useAuth } from '@/contexts/AuthContext'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { createProfile as createProfileAction } from '@/app/actions/create-profile'

export default function CheckProfilePage() {
  const { user, loading } = useAuth()
  const [profileStatus, setProfileStatus] = useState<any>(null)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const supabase = getSupabaseClient()

  useEffect(() => {
    if (user) {
      checkProfile()
    }
  }, [user])

  const checkProfile = async () => {
    if (!user) return

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    setProfileStatus({
      exists: !!data,
      profile: data,
      error: error,
      userId: user.id,
      userEmail: user.email,
      userMetadata: user.user_metadata
    })
  }

  const createProfile = async () => {
    if (!user) return
    setCreating(true)
    setCreateError(null)

    try {
      const result = await createProfileAction()
      console.log('Profile creation result:', result)
      
      if (result.success) {
        await checkProfile()
      } else {
        setCreateError(result.error || 'Failed to create profile')
        console.error('Profile creation failed:', result)
      }
    } catch (err) {
      console.error('Profile creation error:', err)
      setCreateError(String(err))
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-black text-white p-8">Loading...</div>
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <h1 className="text-2xl mb-4">Not logged in</h1>
        <a href="/login" className="text-blue-400 hover:underline">Go to login</a>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Profile Diagnostic</h1>

        <div className="bg-white/5 border border-white/10 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Profile Status</h2>
          {profileStatus ? (
            <div className="space-y-4">
              <div>
                <strong className={profileStatus.exists ? 'text-green-400' : 'text-red-400'}>
                  {profileStatus.exists ? '✓ Profile EXISTS' : '✗ Profile DOES NOT EXIST'}
                </strong>
              </div>

              <div>
                <strong>User ID:</strong>
                <code className="ml-2 bg-white/10 px-2 py-1 rounded text-sm">
                  {profileStatus.userId}
                </code>
              </div>

              <div>
                <strong>Email:</strong>
                <span className="ml-2">{profileStatus.userEmail}</span>
              </div>

              {profileStatus.error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded p-4">
                  <strong className="text-red-400">Error:</strong>
                  <pre className="text-sm mt-2 text-red-300">
                    {JSON.stringify(profileStatus.error, null, 2)}
                  </pre>
                </div>
              )}

              {profileStatus.profile && (
                <div>
                  <strong>Profile Data:</strong>
                  <pre className="bg-white/10 p-4 rounded mt-2 text-sm overflow-auto">
                    {JSON.stringify(profileStatus.profile, null, 2)}
                  </pre>
                </div>
              )}

              {profileStatus.userMetadata && (
                <div>
                  <strong>User Metadata (from Google):</strong>
                  <pre className="bg-white/10 p-4 rounded mt-2 text-sm overflow-auto">
                    {JSON.stringify(profileStatus.userMetadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <p>Checking...</p>
          )}
        </div>

        <div className="flex gap-4">
          <button
            onClick={checkProfile}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Refresh Status
          </button>

          {profileStatus && !profileStatus.exists && (
            <div className="flex flex-col gap-2">
              <button
                onClick={createProfile}
                disabled={creating}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create Profile Now'}
              </button>
              {createError && (
                <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded p-2">
                  Error: {createError}
                </div>
              )}
            </div>
          )}

          <a
            href="/assessment"
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Go to Assessment
          </a>
        </div>
      </div>
    </div>
  )
}

