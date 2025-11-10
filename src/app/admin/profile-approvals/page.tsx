'use client'

import { useState, useEffect } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

interface Profile {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  date_of_birth: string
  education: string
  work_experience: string
  current_occupation: string
  accounting_experience: string
  motivation: string
  goals: string
  approval_status: 'pending' | 'approved' | 'rejected'
  created_at: string
  updated_at: string
}

export default function ProfileApprovalsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const supabase = getSupabaseClient()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      loadProfiles()
    }
  }, [user, filter])

  const loadProfiles = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (filter !== 'all') {
        query = query.eq('approval_status', filter)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error loading profiles:', error)
        return
      }

      setProfiles(data || [])
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const updateApprovalStatus = async (profileId: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ approval_status: status, updated_at: new Date().toISOString() })
        .eq('id', profileId)

      if (error) {
        console.error('Error updating approval status:', error)
        alert('Failed to update approval status')
        return
      }

      // Reload profiles
      loadProfiles()
      alert(`Profile ${status} successfully!`)
    } catch (err) {
      console.error('Error:', err)
      alert('An error occurred')
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">Profile Approvals</h1>
          <button
            onClick={() => router.push('/admin')}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
          >
            Back to Admin
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-4 mb-8">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                filter === tab
                  ? 'bg-white text-black'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === 'pending' && profiles.filter(p => p.approval_status === 'pending').length > 0 && (
                <span className="ml-2 bg-yellow-500 text-black px-2 py-1 rounded-full text-xs">
                  {profiles.filter(p => p.approval_status === 'pending').length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Profiles List */}
        <div className="space-y-4">
          {profiles.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-lg p-8 text-center text-gray-400">
              No profiles found
            </div>
          ) : (
            profiles.map((profile) => (
              <div key={profile.id} className="bg-white/5 border border-white/10 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-semibold mb-1">
                      {profile.first_name} {profile.last_name}
                    </h3>
                    <p className="text-gray-400">{profile.email}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Submitted: {new Date(profile.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-4 py-2 rounded-full text-sm font-semibold ${
                        profile.approval_status === 'approved'
                          ? 'bg-green-500/20 text-green-400'
                          : profile.approval_status === 'rejected'
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}
                    >
                      {profile.approval_status.charAt(0).toUpperCase() + profile.approval_status.slice(1)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-400">Phone</p>
                    <p>{profile.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Date of Birth</p>
                    <p>{profile.date_of_birth || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Education</p>
                    <p>{profile.education || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Work Experience</p>
                    <p>{profile.work_experience || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Current Occupation</p>
                    <p>{profile.current_occupation || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Accounting Experience</p>
                    <p>{profile.accounting_experience || 'N/A'}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-400 mb-1">Motivation</p>
                  <p className="text-sm">{profile.motivation || 'N/A'}</p>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-400 mb-1">Goals</p>
                  <p className="text-sm">{profile.goals || 'N/A'}</p>
                </div>

                {profile.approval_status === 'pending' && (
                  <div className="flex gap-3 pt-4 border-t border-white/10">
                    <button
                      onClick={() => updateApprovalStatus(profile.id, 'approved')}
                      className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => updateApprovalStatus(profile.id, 'rejected')}
                      className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}




