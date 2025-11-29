'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { profileSchema, type ProfileFormData } from '@/lib/validations/profile'
import { getSupabaseClient } from '@/lib/supabase/client'

export default function ProfileFormPage() {
  const { user, loading: authLoading, signOut } = useAuth()
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const supabase = getSupabaseClient()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  })

  useEffect(() => {
    const checkProfileAndRedirect = async () => {
      if (authLoading) return
      
      if (!user) {
      router.push('/login')
        return
      }

      // Check if user already has a complete profile
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle()

        if (error) {
          console.error('Error checking profile:', error)
          setIsLoadingProfile(false)
          return
        }

        // If profile exists and has required fields, check if we should redirect
        if (profile && profile.first_name && profile.phone) {
          // Only redirect if profile is complete AND user is approved
          // Otherwise allow editing (for pending/rejected users)
          if (profile.approval_status === 'approved') {
            router.push('/dashboard')
            setIsLoadingProfile(false)
            return
          }

          // For pending users, check assessment status
          if (profile.approval_status === 'pending') {
            const { data: assessmentSession } = await supabase
              .from('test_sessions')
              .select('id, status')
              .eq('user_id', user.id)
              .eq('status', 'completed')
              .order('completed_at', { ascending: false })
              .limit(1)
              .maybeSingle()

            if (assessmentSession) {
              router.push('/under-review')
              setIsLoadingProfile(false)
              return
            } else {
              router.push('/assessment')
              setIsLoadingProfile(false)
              return
            }
          }
        }

        // Load existing profile data into form (if profile exists)
        if (profile) {
          reset({
            firstName: profile.first_name || '',
            lastName: profile.last_name || '',
            email: profile.email || user.email || '',
            phone: profile.phone || '',
            dateOfBirth: profile.date_of_birth || '',
            address: profile.address || '',
            city: profile.city || '',
            state: profile.state || '',
            zipCode: profile.zip_code || '',
            country: profile.country || '',
            education: profile.education || '',
            workExperience: profile.work_experience || '',
            currentOccupation: profile.current_occupation || '',
            accountingExperience: profile.accounting_experience || '',
            motivation: profile.motivation || '',
            goals: profile.goals || '',
            emergencyContactName: profile.emergency_contact_name || '',
            emergencyContactPhone: profile.emergency_contact_phone || '',
            emergencyContactRelation: profile.emergency_contact_relation || '',
          })
        }
      } catch (err) {
        console.error('Error checking profile:', err)
        // On error, allow user to fill out form
      } finally {
        setIsLoadingProfile(false)
      }
    }

    checkProfileAndRedirect()
  }, [user, authLoading, router, supabase, reset])

  const onSubmit = async (data: ProfileFormData) => {
    if (!user) return

    setSubmitting(true)
    setError(null)

    try {
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          first_name: data.firstName,
          last_name: data.lastName,
          email: data.email,
          phone: data.phone,
          date_of_birth: data.dateOfBirth,
          address: data.address,
          city: data.city,
          state: data.state,
          zip_code: data.zipCode,
          country: data.country,
          education: data.education,
          work_experience: data.workExperience,
          current_occupation: data.currentOccupation,
          accounting_experience: data.accountingExperience,
          motivation: data.motivation,
          goals: data.goals,
          emergency_contact_name: data.emergencyContactName,
          emergency_contact_phone: data.emergencyContactPhone,
          emergency_contact_relation: data.emergencyContactRelation,
          approval_status: 'pending', // Set to pending when profile is completed
        })

      if (upsertError) {
        console.error('Profile save error:', upsertError)
        setError(upsertError.message)
        return
      }

      // Redirect to assessment
      router.push('/assessment')
    } catch (err) {
      console.error('Unexpected error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (authLoading || isLoadingProfile) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
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

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between p-6 lg:px-12">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <span className="text-black font-bold text-sm">SA</span>
          </div>
          <span className="text-white text-xl font-semibold">Super Accountant</span>
        </div>
        <button
          onClick={async () => {
            await signOut()
            router.push('/login')
          }}
          className="px-6 py-3 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 border border-gray-600/50 hover:border-gray-500/70 text-white/90 hover:text-white rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-xl"
        >
          Sign Out
        </button>
      </nav>

      <div className="relative z-10 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
            <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 border border-gray-500/50 rounded-full mb-6 shadow-2xl backdrop-blur-sm">
              <div className="w-2.5 h-2.5 bg-gradient-to-r from-white to-gray-300 rounded-full mr-3 animate-pulse"></div>
              <span className="text-white text-xs font-bold tracking-[0.22em] uppercase">PROFILE COMPLETION</span>
              <div className="w-2.5 h-2.5 bg-gradient-to-r from-gray-300 to-white rounded-full ml-3 animate-pulse"></div>
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-white mb-6 leading-tight bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent">
              Complete Your Profile
            </h1>
            <p className="text-xl text-gray-300 font-light">Please fill in all required information to proceed to the assessment</p>
        </div>

        {error && (
            <div className="mb-6 p-6 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border border-red-500/30 rounded-2xl text-red-400 shadow-xl">
              <div className="flex items-center">
                <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-semibold">{error}</span>
              </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Personal Information */}
          <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-600/50 rounded-3xl p-8 shadow-2xl">
            <h2 className="text-3xl font-black text-white mb-8 bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent">
              Personal Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-3 tracking-wide uppercase">First Name *</label>
                <input
                  {...register('firstName')}
                  className="w-full px-5 py-4 bg-gray-900/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-gray-500/70 transition-all"
                  placeholder="John"
                />
                {errors.firstName && <p className="mt-2 text-sm text-red-400 font-medium">{errors.firstName.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-300 mb-3 tracking-wide uppercase">Last Name *</label>
                <input
                  {...register('lastName')}
                  className="w-full px-5 py-4 bg-gray-900/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-gray-500/70 transition-all"
                  placeholder="Doe"
                />
                {errors.lastName && <p className="mt-2 text-sm text-red-400 font-medium">{errors.lastName.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-300 mb-3 tracking-wide uppercase">Email *</label>
                <input
                  {...register('email')}
                  type="email"
                  defaultValue={user.email || ''}
                  className="w-full px-5 py-4 bg-gray-900/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-gray-500/70 transition-all"
                  placeholder="john@example.com"
                />
                {errors.email && <p className="mt-2 text-sm text-red-400 font-medium">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-300 mb-3 tracking-wide uppercase">Phone *</label>
                <input
                  {...register('phone')}
                  type="tel"
                  className="w-full px-5 py-4 bg-gray-900/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-gray-500/70 transition-all"
                  placeholder="+1234567890"
                />
                {errors.phone && <p className="mt-2 text-sm text-red-400 font-medium">{errors.phone.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-300 mb-3 tracking-wide uppercase">Date of Birth *</label>
                <input
                  {...register('dateOfBirth')}
                  type="date"
                  className="w-full px-5 py-4 bg-gray-900/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-gray-500/70 transition-all"
                />
                {errors.dateOfBirth && <p className="mt-2 text-sm text-red-400 font-medium">{errors.dateOfBirth.message}</p>}
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-600/50 rounded-3xl p-8 shadow-2xl">
            <h2 className="text-3xl font-black text-white mb-8 bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent">
              Address
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-3 tracking-wide uppercase">Street Address *</label>
                <input
                  {...register('address')}
                  className="w-full px-5 py-4 bg-gray-900/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-gray-500/70 transition-all"
                  placeholder="123 Main St"
                />
                {errors.address && <p className="mt-2 text-sm text-red-400 font-medium">{errors.address.message}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-3 tracking-wide uppercase">City *</label>
                  <input
                    {...register('city')}
                    className="w-full px-5 py-4 bg-gray-900/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-gray-500/70 transition-all"
                    placeholder="New York"
                  />
                  {errors.city && <p className="mt-2 text-sm text-red-400 font-medium">{errors.city.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-3 tracking-wide uppercase">State *</label>
                  <input
                    {...register('state')}
                    className="w-full px-5 py-4 bg-gray-900/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-gray-500/70 transition-all"
                    placeholder="NY"
                  />
                  {errors.state && <p className="mt-2 text-sm text-red-400 font-medium">{errors.state.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-3 tracking-wide uppercase">ZIP Code *</label>
                  <input
                    {...register('zipCode')}
                    className="w-full px-5 py-4 bg-gray-900/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-gray-500/70 transition-all"
                    placeholder="10001"
                  />
                  {errors.zipCode && <p className="mt-2 text-sm text-red-400 font-medium">{errors.zipCode.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-300 mb-3 tracking-wide uppercase">Country *</label>
                <input
                  {...register('country')}
                  className="w-full px-5 py-4 bg-gray-900/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-gray-500/70 transition-all"
                  placeholder="United States"
                />
                {errors.country && <p className="mt-2 text-sm text-red-400 font-medium">{errors.country.message}</p>}
              </div>
            </div>
          </div>

          {/* Professional Background */}
          <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-600/50 rounded-3xl p-8 shadow-2xl">
            <h2 className="text-3xl font-black text-white mb-8 bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent">
              Professional Background
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-3 tracking-wide uppercase">Education Level *</label>
                <select
                  {...register('education')}
                  className="w-full px-5 py-4 bg-gray-900/50 border border-gray-700/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-gray-500/70 transition-all"
                >
                  <option value="">Select education level</option>
                  <option value="high_school">High School</option>
                  <option value="associate">Associate Degree</option>
                  <option value="bachelor">Bachelor's Degree</option>
                  <option value="master">Master's Degree</option>
                  <option value="doctorate">Doctorate</option>
                </select>
                {errors.education && <p className="mt-2 text-sm text-red-400 font-medium">{errors.education.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-300 mb-3 tracking-wide uppercase">Work Experience *</label>
                <select
                  {...register('workExperience')}
                  className="w-full px-5 py-4 bg-gray-900/50 border border-gray-700/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-gray-500/70 transition-all"
                >
                  <option value="">Select work experience</option>
                  <option value="none">No Experience</option>
                  <option value="0-2">0-2 years</option>
                  <option value="2-5">2-5 years</option>
                  <option value="5-10">5-10 years</option>
                  <option value="10+">10+ years</option>
                </select>
                {errors.workExperience && <p className="mt-2 text-sm text-red-400 font-medium">{errors.workExperience.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-300 mb-3 tracking-wide uppercase">Current Occupation *</label>
                <input
                  {...register('currentOccupation')}
                  className="w-full px-5 py-4 bg-gray-900/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-gray-500/70 transition-all"
                  placeholder="Software Engineer"
                />
                {errors.currentOccupation && <p className="mt-2 text-sm text-red-400 font-medium">{errors.currentOccupation.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-300 mb-3 tracking-wide uppercase">Accounting Experience *</label>
                <select
                  {...register('accountingExperience')}
                  className="w-full px-5 py-4 bg-gray-900/50 border border-gray-700/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-gray-500/70 transition-all"
                >
                  <option value="">Select accounting experience</option>
                  <option value="none">No Experience</option>
                  <option value="basic">Basic Knowledge</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="professional">Professional/CPA</option>
                </select>
                {errors.accountingExperience && <p className="mt-2 text-sm text-red-400 font-medium">{errors.accountingExperience.message}</p>}
              </div>
            </div>
          </div>

          {/* Motivation & Goals */}
          <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-600/50 rounded-3xl p-8 shadow-2xl">
            <h2 className="text-3xl font-black text-white mb-8 bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent">
              Motivation & Goals
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-3 tracking-wide uppercase">Why do you want to join this program? * (Min 50 characters)</label>
                <textarea
                  {...register('motivation')}
                  rows={4}
                  className="w-full px-5 py-4 bg-gray-900/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-gray-500/70 transition-all resize-none"
                  placeholder="Explain your motivation..."
                />
                {errors.motivation && <p className="mt-2 text-sm text-red-400 font-medium">{errors.motivation.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-300 mb-3 tracking-wide uppercase">What are your career goals? * (Min 50 characters)</label>
                <textarea
                  {...register('goals')}
                  rows={4}
                  className="w-full px-5 py-4 bg-gray-900/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-gray-500/70 transition-all resize-none"
                  placeholder="Describe your goals..."
                />
                {errors.goals && <p className="mt-2 text-sm text-red-400 font-medium">{errors.goals.message}</p>}
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-600/50 rounded-3xl p-8 shadow-2xl">
            <h2 className="text-3xl font-black text-white mb-8 bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent">
              Emergency Contact
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-3 tracking-wide uppercase">Name *</label>
                <input
                  {...register('emergencyContactName')}
                  className="w-full px-5 py-4 bg-gray-900/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-gray-500/70 transition-all"
                  placeholder="Jane Doe"
                />
                {errors.emergencyContactName && <p className="mt-2 text-sm text-red-400 font-medium">{errors.emergencyContactName.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-300 mb-3 tracking-wide uppercase">Phone *</label>
                <input
                  {...register('emergencyContactPhone')}
                  type="tel"
                  className="w-full px-5 py-4 bg-gray-900/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-gray-500/70 transition-all"
                  placeholder="+1234567890"
                />
                {errors.emergencyContactPhone && <p className="mt-2 text-sm text-red-400 font-medium">{errors.emergencyContactPhone.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-300 mb-3 tracking-wide uppercase">Relation *</label>
                <input
                  {...register('emergencyContactRelation')}
                  className="w-full px-5 py-4 bg-gray-900/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-gray-500/70 transition-all"
                  placeholder="Mother"
                />
                {errors.emergencyContactRelation && <p className="mt-2 text-sm text-red-400 font-medium">{errors.emergencyContactRelation.message}</p>}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center pt-8">
            <button
              type="submit"
              disabled={submitting}
              className="group relative px-12 py-5 bg-gradient-to-r from-white via-gray-100 to-white text-black font-black rounded-2xl text-lg transition-all duration-500 transform hover:scale-105 shadow-2xl shadow-white/25 hover:shadow-white/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-white to-gray-200 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <span className="relative z-10">{submitting ? 'Saving...' : 'Continue to Assessment'}</span>
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  )
}

