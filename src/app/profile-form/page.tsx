'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { profileSchema, type ProfileFormData } from '@/lib/validations/profile'
import { getSupabaseClient } from '@/lib/supabase/client'

export default function ProfileFormPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = getSupabaseClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  })

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

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

  if (authLoading) {
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
    <div className="min-h-screen bg-black text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-white rounded-sm flex items-center justify-center">
              <span className="text-black font-bold text-lg">SA</span>
            </div>
            <span className="text-white text-2xl font-semibold">Super Accountant</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">Complete Your Profile</h1>
          <p className="text-gray-400">Please fill in all required information to proceed to the assessment</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Personal Information */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-2xl font-semibold mb-6">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">First Name *</label>
                <input
                  {...register('firstName')}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20"
                  placeholder="John"
                />
                {errors.firstName && <p className="mt-1 text-sm text-red-400">{errors.firstName.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Last Name *</label>
                <input
                  {...register('lastName')}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20"
                  placeholder="Doe"
                />
                {errors.lastName && <p className="mt-1 text-sm text-red-400">{errors.lastName.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Email *</label>
                <input
                  {...register('email')}
                  type="email"
                  defaultValue={user.email || ''}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20"
                  placeholder="john@example.com"
                />
                {errors.email && <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Phone *</label>
                <input
                  {...register('phone')}
                  type="tel"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20"
                  placeholder="+1234567890"
                />
                {errors.phone && <p className="mt-1 text-sm text-red-400">{errors.phone.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Date of Birth *</label>
                <input
                  {...register('dateOfBirth')}
                  type="date"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20"
                />
                {errors.dateOfBirth && <p className="mt-1 text-sm text-red-400">{errors.dateOfBirth.message}</p>}
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-2xl font-semibold mb-6">Address</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Street Address *</label>
                <input
                  {...register('address')}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20"
                  placeholder="123 Main St"
                />
                {errors.address && <p className="mt-1 text-sm text-red-400">{errors.address.message}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">City *</label>
                  <input
                    {...register('city')}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20"
                    placeholder="New York"
                  />
                  {errors.city && <p className="mt-1 text-sm text-red-400">{errors.city.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">State *</label>
                  <input
                    {...register('state')}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20"
                    placeholder="NY"
                  />
                  {errors.state && <p className="mt-1 text-sm text-red-400">{errors.state.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">ZIP Code *</label>
                  <input
                    {...register('zipCode')}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20"
                    placeholder="10001"
                  />
                  {errors.zipCode && <p className="mt-1 text-sm text-red-400">{errors.zipCode.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Country *</label>
                <input
                  {...register('country')}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20"
                  placeholder="United States"
                />
                {errors.country && <p className="mt-1 text-sm text-red-400">{errors.country.message}</p>}
              </div>
            </div>
          </div>

          {/* Professional Background */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-2xl font-semibold mb-6">Professional Background</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Education Level *</label>
                <select
                  {...register('education')}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20"
                >
                  <option value="">Select education level</option>
                  <option value="high_school">High School</option>
                  <option value="associate">Associate Degree</option>
                  <option value="bachelor">Bachelor's Degree</option>
                  <option value="master">Master's Degree</option>
                  <option value="doctorate">Doctorate</option>
                </select>
                {errors.education && <p className="mt-1 text-sm text-red-400">{errors.education.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Work Experience *</label>
                <select
                  {...register('workExperience')}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20"
                >
                  <option value="">Select work experience</option>
                  <option value="none">No Experience</option>
                  <option value="0-2">0-2 years</option>
                  <option value="2-5">2-5 years</option>
                  <option value="5-10">5-10 years</option>
                  <option value="10+">10+ years</option>
                </select>
                {errors.workExperience && <p className="mt-1 text-sm text-red-400">{errors.workExperience.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Current Occupation *</label>
                <input
                  {...register('currentOccupation')}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20"
                  placeholder="Software Engineer"
                />
                {errors.currentOccupation && <p className="mt-1 text-sm text-red-400">{errors.currentOccupation.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Accounting Experience *</label>
                <select
                  {...register('accountingExperience')}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20"
                >
                  <option value="">Select accounting experience</option>
                  <option value="none">No Experience</option>
                  <option value="basic">Basic Knowledge</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="professional">Professional/CPA</option>
                </select>
                {errors.accountingExperience && <p className="mt-1 text-sm text-red-400">{errors.accountingExperience.message}</p>}
              </div>
            </div>
          </div>

          {/* Motivation & Goals */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-2xl font-semibold mb-6">Motivation & Goals</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Why do you want to join this program? * (Min 50 characters)</label>
                <textarea
                  {...register('motivation')}
                  rows={4}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20"
                  placeholder="Explain your motivation..."
                />
                {errors.motivation && <p className="mt-1 text-sm text-red-400">{errors.motivation.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">What are your career goals? * (Min 50 characters)</label>
                <textarea
                  {...register('goals')}
                  rows={4}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20"
                  placeholder="Describe your goals..."
                />
                {errors.goals && <p className="mt-1 text-sm text-red-400">{errors.goals.message}</p>}
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-2xl font-semibold mb-6">Emergency Contact</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Name *</label>
                <input
                  {...register('emergencyContactName')}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20"
                  placeholder="Jane Doe"
                />
                {errors.emergencyContactName && <p className="mt-1 text-sm text-red-400">{errors.emergencyContactName.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Phone *</label>
                <input
                  {...register('emergencyContactPhone')}
                  type="tel"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20"
                  placeholder="+1234567890"
                />
                {errors.emergencyContactPhone && <p className="mt-1 text-sm text-red-400">{errors.emergencyContactPhone.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Relation *</label>
                <input
                  {...register('emergencyContactRelation')}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20"
                  placeholder="Mother"
                />
                {errors.emergencyContactRelation && <p className="mt-1 text-sm text-red-400">{errors.emergencyContactRelation.message}</p>}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center pt-6">
            <button
              type="submit"
              disabled={submitting}
              className="px-12 py-4 bg-white text-black font-semibold rounded-full hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              {submitting ? 'Saving...' : 'Continue to Assessment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

