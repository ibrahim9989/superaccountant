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
      <div className="min-h-screen w-full bg-gradient-to-br from-[#1e3a5f] to-[#DC2626] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-[#2B2A29] text-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#1e3a5f] via-[#264174] to-[#DC2626] py-12 sm:py-16 md:py-20 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
      </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 leading-tight">
              Complete Your Profile
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-white/90 mb-6 max-w-4xl mx-auto font-medium">
              Please fill in all required information to proceed to the assessment
            </p>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16 bg-gradient-to-b from-[#2B2A29] to-[#264174]/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Sign Out Button */}
          <div className="flex justify-end mb-6">
        <button
          onClick={async () => {
            await signOut()
            router.push('/login')
          }}
              className="px-6 py-3 bg-[#DC2626] text-white rounded-lg font-semibold hover:bg-[#B91C1C] transition-colors"
        >
          Sign Out
        </button>
        </div>

        {error && (
            <div className="mb-6 p-6 bg-gradient-to-br from-[#264174]/50 to-[#DC2626]/40 border border-white/10 rounded-2xl text-white shadow-xl">
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
            <div className="bg-gradient-to-br from-[#264174]/50 to-[#DC2626]/40 rounded-2xl p-6 md:p-8 border border-white/10">
              <h2 className="text-2xl md:text-3xl font-black text-white mb-6">
              Personal Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                  <label className="block text-sm font-bold text-white/90 mb-2">First Name *</label>
                <input
                  {...register('firstName')}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all"
                  placeholder="John"
                />
                  {errors.firstName && <p className="mt-2 text-sm text-white/80 font-medium">{errors.firstName.message}</p>}
              </div>

              <div>
                  <label className="block text-sm font-bold text-white/90 mb-2">Last Name *</label>
                <input
                  {...register('lastName')}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all"
                  placeholder="Doe"
                />
                  {errors.lastName && <p className="mt-2 text-sm text-white/80 font-medium">{errors.lastName.message}</p>}
              </div>

              <div>
                  <label className="block text-sm font-bold text-white/90 mb-2">Email *</label>
                <input
                  {...register('email')}
                  type="email"
                  defaultValue={user.email || ''}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all"
                  placeholder="john@example.com"
                />
                  {errors.email && <p className="mt-2 text-sm text-white/80 font-medium">{errors.email.message}</p>}
              </div>

              <div>
                  <label className="block text-sm font-bold text-white/90 mb-2">Phone *</label>
                <input
                  {...register('phone')}
                  type="tel"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all"
                  placeholder="+1234567890"
                />
                  {errors.phone && <p className="mt-2 text-sm text-white/80 font-medium">{errors.phone.message}</p>}
              </div>

              <div>
                  <label className="block text-sm font-bold text-white/90 mb-2">Date of Birth *</label>
                <input
                  {...register('dateOfBirth')}
                  type="date"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all"
                />
                  {errors.dateOfBirth && <p className="mt-2 text-sm text-white/80 font-medium">{errors.dateOfBirth.message}</p>}
              </div>
            </div>
          </div>

          {/* Address */}
            <div className="bg-gradient-to-br from-[#264174]/50 to-[#DC2626]/40 rounded-2xl p-6 md:p-8 border border-white/10">
              <h2 className="text-2xl md:text-3xl font-black text-white mb-6">
              Address
            </h2>
            <div className="space-y-6">
              <div>
                  <label className="block text-sm font-bold text-white/90 mb-2">Street Address *</label>
                <input
                  {...register('address')}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all"
                  placeholder="123 Main St"
                />
                  {errors.address && <p className="mt-2 text-sm text-white/80 font-medium">{errors.address.message}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                    <label className="block text-sm font-bold text-white/90 mb-2">City *</label>
                  <input
                    {...register('city')}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all"
                    placeholder="New York"
                  />
                    {errors.city && <p className="mt-2 text-sm text-white/80 font-medium">{errors.city.message}</p>}
                </div>

                <div>
                    <label className="block text-sm font-bold text-white/90 mb-2">State *</label>
                  <input
                    {...register('state')}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all"
                    placeholder="NY"
                  />
                    {errors.state && <p className="mt-2 text-sm text-white/80 font-medium">{errors.state.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-white/90 mb-2">ZIP Code *</label>
                    <input
                      {...register('zipCode')}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all"
                      placeholder="10001"
                    />
                    {errors.zipCode && <p className="mt-2 text-sm text-white/80 font-medium">{errors.zipCode.message}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-white/90 mb-2">Country *</label>
                  <input
                    {...register('country')}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all"
                  placeholder="United States"
                />
                  {errors.country && <p className="mt-2 text-sm text-white/80 font-medium">{errors.country.message}</p>}
              </div>
            </div>
          </div>

          {/* Professional Background */}
            <div className="bg-gradient-to-br from-[#264174]/50 to-[#DC2626]/40 rounded-2xl p-6 md:p-8 border border-white/10">
              <h2 className="text-2xl md:text-3xl font-black text-white mb-6">
              Professional Background
            </h2>
            <div className="space-y-6">
              <div>
                  <label className="block text-sm font-bold text-white/90 mb-2">Education Level *</label>
                <select
                  {...register('education')}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all cursor-pointer"
                    style={{ colorScheme: 'dark' }}
                >
                    <option value="" style={{ backgroundColor: 'rgba(30, 30, 30, 0.95)', color: 'white' }}>Select education level</option>
                    <option value="high_school" style={{ backgroundColor: 'rgba(30, 30, 30, 0.95)', color: 'white' }}>High School</option>
                    <option value="associate" style={{ backgroundColor: 'rgba(30, 30, 30, 0.95)', color: 'white' }}>Associate Degree</option>
                    <option value="bachelor" style={{ backgroundColor: 'rgba(30, 30, 30, 0.95)', color: 'white' }}>Bachelor's Degree</option>
                    <option value="master" style={{ backgroundColor: 'rgba(30, 30, 30, 0.95)', color: 'white' }}>Master's Degree</option>
                    <option value="doctorate" style={{ backgroundColor: 'rgba(30, 30, 30, 0.95)', color: 'white' }}>Doctorate</option>
                </select>
                  {errors.education && <p className="mt-2 text-sm text-white/80 font-medium">{errors.education.message}</p>}
              </div>

              <div>
                  <label className="block text-sm font-bold text-white/90 mb-2">Work Experience *</label>
                <select
                  {...register('workExperience')}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all cursor-pointer"
                    style={{ colorScheme: 'dark' }}
                >
                    <option value="" style={{ backgroundColor: 'rgba(30, 30, 30, 0.95)', color: 'white' }}>Select work experience</option>
                    <option value="none" style={{ backgroundColor: 'rgba(30, 30, 30, 0.95)', color: 'white' }}>No Experience</option>
                    <option value="0-2" style={{ backgroundColor: 'rgba(30, 30, 30, 0.95)', color: 'white' }}>0-2 years</option>
                    <option value="2-5" style={{ backgroundColor: 'rgba(30, 30, 30, 0.95)', color: 'white' }}>2-5 years</option>
                    <option value="5-10" style={{ backgroundColor: 'rgba(30, 30, 30, 0.95)', color: 'white' }}>5-10 years</option>
                    <option value="10+" style={{ backgroundColor: 'rgba(30, 30, 30, 0.95)', color: 'white' }}>10+ years</option>
                </select>
                  {errors.workExperience && <p className="mt-2 text-sm text-white/80 font-medium">{errors.workExperience.message}</p>}
              </div>

              <div>
                  <label className="block text-sm font-bold text-white/90 mb-2">Current Occupation *</label>
                <input
                  {...register('currentOccupation')}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all"
                  placeholder="Software Engineer"
                />
                  {errors.currentOccupation && <p className="mt-2 text-sm text-white/80 font-medium">{errors.currentOccupation.message}</p>}
              </div>

              <div>
                  <label className="block text-sm font-bold text-white/90 mb-2">Accounting Experience *</label>
                <select
                  {...register('accountingExperience')}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all cursor-pointer"
                    style={{ colorScheme: 'dark' }}
                >
                    <option value="" style={{ backgroundColor: 'rgba(30, 30, 30, 0.95)', color: 'white' }}>Select accounting experience</option>
                    <option value="none" style={{ backgroundColor: 'rgba(30, 30, 30, 0.95)', color: 'white' }}>No Experience</option>
                    <option value="basic" style={{ backgroundColor: 'rgba(30, 30, 30, 0.95)', color: 'white' }}>Basic Knowledge</option>
                    <option value="intermediate" style={{ backgroundColor: 'rgba(30, 30, 30, 0.95)', color: 'white' }}>Intermediate</option>
                    <option value="advanced" style={{ backgroundColor: 'rgba(30, 30, 30, 0.95)', color: 'white' }}>Advanced</option>
                    <option value="professional" style={{ backgroundColor: 'rgba(30, 30, 30, 0.95)', color: 'white' }}>Professional/CPA</option>
                </select>
                  {errors.accountingExperience && <p className="mt-2 text-sm text-white/80 font-medium">{errors.accountingExperience.message}</p>}
              </div>
            </div>
          </div>

          {/* Motivation & Goals */}
            <div className="bg-gradient-to-br from-[#264174]/50 to-[#DC2626]/40 rounded-2xl p-6 md:p-8 border border-white/10">
              <h2 className="text-2xl md:text-3xl font-black text-white mb-6">
              Motivation & Goals
            </h2>
            <div className="space-y-6">
              <div>
                  <label className="block text-sm font-bold text-white/90 mb-2">Why do you want to join this program? * (Min 50 characters)</label>
                <textarea
                  {...register('motivation')}
                  rows={4}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all resize-none"
                  placeholder="Explain your motivation..."
                />
                  {errors.motivation && <p className="mt-2 text-sm text-white/80 font-medium">{errors.motivation.message}</p>}
              </div>

              <div>
                  <label className="block text-sm font-bold text-white/90 mb-2">What are your career goals? * (Min 50 characters)</label>
                <textarea
                  {...register('goals')}
                  rows={4}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all resize-none"
                  placeholder="Describe your goals..."
                />
                  {errors.goals && <p className="mt-2 text-sm text-white/80 font-medium">{errors.goals.message}</p>}
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
            <div className="bg-gradient-to-br from-[#264174]/50 to-[#DC2626]/40 rounded-2xl p-6 md:p-8 border border-white/10">
              <h2 className="text-2xl md:text-3xl font-black text-white mb-6">
              Emergency Contact
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                  <label className="block text-sm font-bold text-white/90 mb-2">Name *</label>
                <input
                  {...register('emergencyContactName')}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all"
                  placeholder="Jane Doe"
                />
                  {errors.emergencyContactName && <p className="mt-2 text-sm text-white/80 font-medium">{errors.emergencyContactName.message}</p>}
              </div>

              <div>
                  <label className="block text-sm font-bold text-white/90 mb-2">Phone *</label>
                <input
                  {...register('emergencyContactPhone')}
                  type="tel"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all"
                  placeholder="+1234567890"
                />
                  {errors.emergencyContactPhone && <p className="mt-2 text-sm text-white/80 font-medium">{errors.emergencyContactPhone.message}</p>}
              </div>

              <div>
                  <label className="block text-sm font-bold text-white/90 mb-2">Relation *</label>
                <input
                  {...register('emergencyContactRelation')}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all"
                  placeholder="Mother"
                />
                  {errors.emergencyContactRelation && <p className="mt-2 text-sm text-white/80 font-medium">{errors.emergencyContactRelation.message}</p>}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center pt-8">
            <button
              type="submit"
              disabled={submitting}
                className="px-12 py-4 bg-[#DC2626] text-white rounded-lg text-lg font-semibold hover:bg-[#B91C1C] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {submitting ? 'Saving...' : 'Continue to Assessment'}
            </button>
          </div>
        </form>
        </div>
      </section>
    </div>
  )
}

