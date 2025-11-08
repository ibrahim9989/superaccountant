'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { profileSchema, type ProfileFormData } from '@/lib/validations/profile'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

export default function ProfileForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  })

  // Load existing profile data
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profile && !error) {
          // Populate form with existing data
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
      } catch (error) {
        console.error('Error loading profile:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [user, supabase, reset])

  const onSubmit = async (data: ProfileFormData) => {
    if (!user) return

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const { error } = await supabase
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
          updated_at: new Date().toISOString(),
        })

      if (error) {
        throw error
      }

      // Redirect to dashboard or next step
      router.push('/dashboard')
    } catch (error) {
      console.error('Error saving profile:', error)
      setSubmitError('Failed to save profile. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const inputClasses = "w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 hover:border-slate-600"
  const labelClasses = "block text-sm font-medium text-slate-300 mb-2"
  const errorClasses = "text-red-400 text-sm mt-2 flex items-center gap-1"
  const sectionClasses = "border-b border-slate-800/50 pb-8"
  const headingClasses = "text-xl font-semibold text-white mb-6 flex items-center gap-3"

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-700 border-t-blue-500 mx-auto"></div>
            <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-transparent border-t-purple-500 animate-ping mx-auto"></div>
          </div>
          <p className="text-slate-400 mt-6 font-medium">Loading your profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-2xl mb-4">
            <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 text-transparent bg-clip-text mb-3">
            Your Profile
          </h1>
          <p className="text-slate-400 text-lg">
            Keep your information up-to-date for a personalized learning experience
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden">
          <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-8">
          {/* Personal Information */}
          <div className={sectionClasses}>
            <h2 className={headingClasses}>
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              Personal Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClasses}>First Name *</label>
                <input
                  {...register('firstName')}
                  className={inputClasses}
                  placeholder="Enter your first name"
                />
                {errors.firstName && (
                  <p className={errorClasses}>{errors.firstName.message}</p>
                )}
              </div>

              <div>
                <label className={labelClasses}>Last Name *</label>
                <input
                  {...register('lastName')}
                  className={inputClasses}
                  placeholder="Enter your last name"
                />
                {errors.lastName && (
                  <p className={errorClasses}>{errors.lastName.message}</p>
                )}
              </div>

              <div>
                <label className={labelClasses}>Email *</label>
                <input
                  {...register('email')}
                  type="email"
                  className={inputClasses}
                  placeholder="Enter your email"
                />
                {errors.email && (
                  <p className={errorClasses}>{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className={labelClasses}>Phone Number *</label>
                <input
                  {...register('phone')}
                  type="tel"
                  className={inputClasses}
                  placeholder="Enter your phone number"
                />
                {errors.phone && (
                  <p className={errorClasses}>{errors.phone.message}</p>
                )}
              </div>

              <div>
                <label className={labelClasses}>Date of Birth *</label>
                <input
                  {...register('dateOfBirth')}
                  type="date"
                  className={inputClasses}
                />
                {errors.dateOfBirth && (
                  <p className={errorClasses}>{errors.dateOfBirth.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className={sectionClasses}>
            <h2 className={headingClasses}>Address Information</h2>
            <div className="space-y-6">
              <div>
                <label className={labelClasses}>Address *</label>
                <input
                  {...register('address')}
                  className={inputClasses}
                  placeholder="Enter your full address"
                />
                {errors.address && (
                  <p className={errorClasses}>{errors.address.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className={labelClasses}>City *</label>
                  <input
                    {...register('city')}
                    className={inputClasses}
                    placeholder="Enter your city"
                  />
                  {errors.city && (
                    <p className={errorClasses}>{errors.city.message}</p>
                  )}
                </div>

                <div>
                  <label className={labelClasses}>State *</label>
                  <input
                    {...register('state')}
                    className={inputClasses}
                    placeholder="Enter your state"
                  />
                  {errors.state && (
                    <p className={errorClasses}>{errors.state.message}</p>
                  )}
                </div>

                <div>
                  <label className={labelClasses}>ZIP Code *</label>
                  <input
                    {...register('zipCode')}
                    className={inputClasses}
                    placeholder="Enter your ZIP code"
                  />
                  {errors.zipCode && (
                    <p className={errorClasses}>{errors.zipCode.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className={labelClasses}>Country *</label>
                <input
                  {...register('country')}
                  className={inputClasses}
                  placeholder="Enter your country"
                />
                {errors.country && (
                  <p className={errorClasses}>{errors.country.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Professional Information */}
          <div className={sectionClasses}>
            <h2 className={headingClasses}>Professional Information</h2>
            <div className="space-y-6">
              <div>
                <label className={labelClasses}>Education Level *</label>
                <select
                  {...register('education')}
                  className={inputClasses}
                >
                  <option value="">Select your education level</option>
                  <option value="high-school">High School</option>
                  <option value="associate">Associate Degree</option>
                  <option value="bachelor">Bachelor&apos;s Degree</option>
                  <option value="master">Master&apos;s Degree</option>
                  <option value="phd">PhD</option>
                  <option value="other">Other</option>
                </select>
                {errors.education && (
                  <p className={errorClasses}>{errors.education.message}</p>
                )}
              </div>

              <div>
                <label className={labelClasses}>Work Experience *</label>
                <select
                  {...register('workExperience')}
                  className={inputClasses}
                >
                  <option value="">Select your work experience</option>
                  <option value="0-1">0-1 years</option>
                  <option value="2-5">2-5 years</option>
                  <option value="6-10">6-10 years</option>
                  <option value="11-15">11-15 years</option>
                  <option value="16+">16+ years</option>
                </select>
                {errors.workExperience && (
                  <p className={errorClasses}>{errors.workExperience.message}</p>
                )}
              </div>

              <div>
                <label className={labelClasses}>Current Occupation *</label>
                <input
                  {...register('currentOccupation')}
                  className={inputClasses}
                  placeholder="Enter your current occupation"
                />
                {errors.currentOccupation && (
                  <p className={errorClasses}>{errors.currentOccupation.message}</p>
                )}
              </div>

              <div>
                <label className={labelClasses}>Accounting Experience *</label>
                <select
                  {...register('accountingExperience')}
                  className={inputClasses}
                >
                  <option value="">Select your accounting experience</option>
                  <option value="none">No experience</option>
                  <option value="basic">Basic knowledge</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="expert">Expert</option>
                </select>
                {errors.accountingExperience && (
                  <p className={errorClasses}>{errors.accountingExperience.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Motivation and Goals */}
          <div className={sectionClasses}>
            <h2 className={headingClasses}>Motivation & Goals</h2>
            <div className="space-y-6">
              <div>
                <label className={labelClasses}>Why do you want to become a Super Accountant? *</label>
                <textarea
                  {...register('motivation')}
                  rows={4}
                  className={inputClasses}
                  placeholder="Please explain your motivation for pursuing the Super Accountant certification..."
                />
                {errors.motivation && (
                  <p className={errorClasses}>{errors.motivation.message}</p>
                )}
              </div>

              <div>
                <label className={labelClasses}>What are your career goals? *</label>
                <textarea
                  {...register('goals')}
                  rows={4}
                  className={inputClasses}
                  placeholder="Please describe your career goals and how the Super Accountant certification will help you achieve them..."
                />
                {errors.goals && (
                  <p className={errorClasses}>{errors.goals.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="pb-6">
            <h2 className={headingClasses}>Emergency Contact</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className={labelClasses}>Contact Name *</label>
                <input
                  {...register('emergencyContactName')}
                  className={inputClasses}
                  placeholder="Enter emergency contact name"
                />
                {errors.emergencyContactName && (
                  <p className={errorClasses}>{errors.emergencyContactName.message}</p>
                )}
              </div>

              <div>
                <label className={labelClasses}>Contact Phone *</label>
                <input
                  {...register('emergencyContactPhone')}
                  type="tel"
                  className={inputClasses}
                  placeholder="Enter emergency contact phone"
                />
                {errors.emergencyContactPhone && (
                  <p className={errorClasses}>{errors.emergencyContactPhone.message}</p>
                )}
              </div>

              <div>
                <label className={labelClasses}>Relationship *</label>
                <input
                  {...register('emergencyContactRelation')}
                  className={inputClasses}
                  placeholder="e.g., Spouse, Parent, Sibling"
                />
                {errors.emergencyContactRelation && (
                  <p className={errorClasses}>{errors.emergencyContactRelation.message}</p>
                )}
              </div>
            </div>
          </div>

          {submitError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <p className="text-red-400">{submitError}</p>
            </div>
          )}

          <div className="flex justify-center pt-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-azure-accent hover:bg-blue-600 text-white px-12 py-4 rounded-lg font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-azure-accent/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </div>
              ) : (
                'Complete Profile'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
    </div>
  )
}