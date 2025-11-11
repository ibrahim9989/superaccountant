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
      <div className="min-h-screen bg-black flex items-center justify-center relative">
        <div className="absolute inset-0 opacity-40">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-white/5 via-gray-800/10 to-black/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-black/10 via-gray-700/15 to-white/5 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-800 border-t-white"></div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-black text-white relative">
      {/* Luxury Background Effects */}
      <div className="absolute inset-0 opacity-40">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-white/5 via-gray-800/10 to-black/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-black/10 via-gray-700/15 to-white/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] bg-gradient-to-br from-gray-900/10 via-transparent to-gray-900/10 rounded-full blur-3xl" />
      </div>

      {/* Subtle Pattern Overlay */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='50' cy='50' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 border border-gray-500/50 rounded-full mb-4 shadow-2xl backdrop-blur-sm">
              <div className="w-2.5 h-2.5 bg-gradient-to-r from-white to-gray-300 rounded-full mr-3 animate-pulse"></div>
              <span className="text-white text-xs font-bold tracking-[0.22em] uppercase">PROFILE APPROVALS</span>
              <div className="w-2.5 h-2.5 bg-gradient-to-r from-gray-300 to-white rounded-full ml-3 animate-pulse"></div>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent">
              Profile Approvals
            </h1>
          </div>
          <button
            onClick={() => router.push('/admin')}
            className="px-6 py-3 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 border border-gray-600/50 hover:border-gray-500/70 text-white/90 hover:text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-xl"
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
              className={`px-6 py-3 rounded-2xl font-bold transition-all duration-300 transform hover:scale-105 ${
                filter === tab
                  ? 'bg-gradient-to-r from-white via-gray-100 to-white text-black shadow-2xl shadow-white/25'
                  : 'bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 border border-gray-600/50 text-white hover:border-gray-500/70 shadow-xl'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === 'pending' && profiles.filter(p => p.approval_status === 'pending').length > 0 && (
                <span className="ml-2 bg-gradient-to-r from-gray-900 to-black text-white px-2 py-1 rounded-full text-xs font-bold border border-gray-700/50">
                  {profiles.filter(p => p.approval_status === 'pending').length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Profiles List */}
        <div className="space-y-6">
          {profiles.length === 0 ? (
            <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-600/50 rounded-3xl p-12 text-center shadow-2xl">
              <p className="text-gray-400 text-lg font-light">No profiles found</p>
            </div>
          ) : (
            profiles.map((profile) => (
              <div key={profile.id} className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-600/50 rounded-3xl p-8 shadow-2xl">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-3xl font-black text-white mb-2 bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent">
                      {profile.first_name} {profile.last_name}
                    </h3>
                    <p className="text-gray-300 font-medium">{profile.email}</p>
                    <p className="text-sm text-gray-400 mt-2 font-light">
                      Submitted: {new Date(profile.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-4 py-2 rounded-full text-sm font-bold ${
                        profile.approval_status === 'approved'
                          ? 'bg-gradient-to-r from-green-900 to-green-800 text-green-300 border border-green-700/50'
                          : profile.approval_status === 'rejected'
                          ? 'bg-gradient-to-r from-red-900 to-red-800 text-red-300 border border-red-700/50'
                          : 'bg-gradient-to-r from-yellow-900 to-yellow-800 text-yellow-300 border border-yellow-700/50'
                      }`}
                    >
                      {profile.approval_status.charAt(0).toUpperCase() + profile.approval_status.slice(1)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-800/50 px-4 py-3 rounded-xl border border-gray-700/50">
                    <p className="text-sm text-gray-400 font-medium mb-1">Phone</p>
                    <p className="text-white font-bold">{profile.phone || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-800/50 px-4 py-3 rounded-xl border border-gray-700/50">
                    <p className="text-sm text-gray-400 font-medium mb-1">Date of Birth</p>
                    <p className="text-white font-bold">{profile.date_of_birth || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-800/50 px-4 py-3 rounded-xl border border-gray-700/50">
                    <p className="text-sm text-gray-400 font-medium mb-1">Education</p>
                    <p className="text-white font-bold">{profile.education || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-800/50 px-4 py-3 rounded-xl border border-gray-700/50">
                    <p className="text-sm text-gray-400 font-medium mb-1">Work Experience</p>
                    <p className="text-white font-bold">{profile.work_experience || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-800/50 px-4 py-3 rounded-xl border border-gray-700/50">
                    <p className="text-sm text-gray-400 font-medium mb-1">Current Occupation</p>
                    <p className="text-white font-bold">{profile.current_occupation || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-800/50 px-4 py-3 rounded-xl border border-gray-700/50">
                    <p className="text-sm text-gray-400 font-medium mb-1">Accounting Experience</p>
                    <p className="text-white font-bold">{profile.accounting_experience || 'N/A'}</p>
                  </div>
                </div>

                <div className="mb-4 bg-gray-800/30 px-4 py-3 rounded-xl border border-gray-700/30">
                  <p className="text-sm text-gray-400 font-medium mb-2">Motivation</p>
                  <p className="text-gray-300 font-light">{profile.motivation || 'N/A'}</p>
                </div>

                <div className="mb-4 bg-gray-800/30 px-4 py-3 rounded-xl border border-gray-700/30">
                  <p className="text-sm text-gray-400 font-medium mb-2">Goals</p>
                  <p className="text-gray-300 font-light">{profile.goals || 'N/A'}</p>
                </div>

                {profile.approval_status === 'pending' && (
                  <div className="flex gap-4 pt-6 border-t border-gray-600/50">
                    <button
                      onClick={() => updateApprovalStatus(profile.id, 'approved')}
                      className="flex-1 px-6 py-4 bg-gradient-to-r from-green-700 via-green-600 to-green-700 hover:from-green-600 hover:via-green-500 hover:to-green-600 text-white rounded-2xl font-black transition-all duration-300 transform hover:scale-105 shadow-xl"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => updateApprovalStatus(profile.id, 'rejected')}
                      className="flex-1 px-6 py-4 bg-gradient-to-r from-red-700 via-red-600 to-red-700 hover:from-red-600 hover:via-red-500 hover:to-red-600 text-white rounded-2xl font-black transition-all duration-300 transform hover:scale-105 shadow-xl"
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
