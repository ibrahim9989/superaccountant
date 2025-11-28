'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const supabase = getSupabaseClient()

  useEffect(() => {
    const checkProfileAndRedirect = async () => {
      if (!loading && user) {
        try {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('id, approval_status, first_name, phone')
            .eq('id', user.id)
            .maybeSingle()

          if (error) {
            console.error('Error checking profile:', error)
            router.push('/profile-form')
            return
          }

          if (!profile || !profile.first_name || !profile.phone) {
            router.push('/profile-form')
            return
          }

          if (profile.approval_status === 'approved') {
            router.push('/dashboard')
            return
          }

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
          } else {
            router.push('/assessment')
          }
        } catch (err) {
          console.error('Unexpected error in profile check:', err)
          router.push('/profile-form')
        }
      }
    }

    checkProfileAndRedirect()
  }, [user, loading, router, supabase])

  const handleGetStarted = async () => {
    if (!user) {
      router.push('/login')
      return
    }

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, approval_status, first_name, phone')
        .eq('id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking profile:', error)
        router.push('/profile-form')
        return
      }

      if (!profile || !profile.first_name || !profile.phone) {
        router.push('/profile-form')
        return
      }

      if (profile.approval_status === 'approved') {
        router.push('/dashboard')
        return
      }

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
      } else {
        router.push('/assessment')
      }
    } catch (err) {
      console.error('Unexpected error in handleGetStarted:', err)
      router.push('/profile-form')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-[#1e3a5f] to-[#DC2626] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }

  if (user) {
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
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 leading-tight">
              Become a Job-Ready
              <span className="block bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent mt-2">
                Accountant in 45 Days
              </span>
            </h1>
            
            <p className="text-base sm:text-lg md:text-xl text-white/90 mb-6 max-w-4xl mx-auto font-medium">
              Practical training in Accounting, Tally, GST, Income Tax & Advanced Excel.
            </p>
            
            <p className="text-sm sm:text-base text-white/80 mb-10 max-w-3xl mx-auto">
              Designed for fresh graduates, job seekers & beginners in finance.
            </p>

            {/* Features Grid */}
            <div className="grid sm:grid-cols-3 gap-4 mb-10 max-w-4xl mx-auto">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-xl mb-2">✓</div>
                <p className="text-white font-semibold text-sm">Daily assignments & quizzes</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-xl mb-2">✓</div>
                <p className="text-white font-semibold text-sm">Hands-on practice in Tally & GST</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-xl mb-2">✓</div>
                <p className="text-white font-semibold text-sm">Placement assistance included</p>
              </div>
            </div>

            <button
              onClick={handleGetStarted}
              className="bg-[#DC2626] text-white px-10 py-4 rounded-lg text-lg font-semibold hover:bg-[#B91C1C] transition-colors"
            >
              Enroll Now – Limited Seats
            </button>
          </div>
        </div>
      </section>

      {/* Who We Are Section */}
      <section className="py-16 bg-gradient-to-b from-[#2B2A29] to-[#264174]/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">Who We Are</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-[#DC2626] to-[#264174] mx-auto mb-6"></div>
          </div>
          
          <div className="bg-gradient-to-br from-[#264174]/50 to-[#DC2626]/40 rounded-2xl p-6 md:p-8 border border-white/10">
            <p className="text-lg md:text-xl text-white font-semibold mb-4 text-center">
              SuperAccountant is a practical accounting training institute focused on making students job-ready through hands-on learning.
            </p>
            <p className="text-base md:text-lg text-white/80 text-center leading-relaxed">
              We train you in real-world accounting workflows, Tally, GST, compliance, Excel, and communication skills — everything companies expect from day one.
            </p>
          </div>
        </div>
      </section>

      {/* Why SuperAccountant Section */}
      <section className="py-16 bg-gradient-to-b from-[#264174]/20 to-[#2B2A29]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">Why SuperAccountant?</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-[#DC2626] to-[#264174] mx-auto"></div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              '100% Practical, Industry-Style Training',
              'Daily Assignments + Weekly Quizzes to build consistency',
              'Case Studies & Real-World Scenarios',
              'Tally + Zoho Books + Advanced Excel with AI',
              'Financial Statements Training',
              'Placement Assistance for All Students',
              'Experienced Trainers from CA & Industry Background',
              'Certificate on Completion',
              'Affordable Fees & Friendly Environment'
            ].map((item, index) => (
              <div key={index} className="bg-gradient-to-br from-[#264174]/60 to-[#DC2626]/50 rounded-xl p-4 border border-white/10 hover:border-white/30 transition-all duration-300 hover:scale-105">
                <div className="flex items-start">
                  <div className="text-lg mr-3 text-white">•</div>
                  <p className="text-white text-sm font-medium">{item}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What You Will Learn Section */}
      <section className="py-16 bg-gradient-to-b from-[#2B2A29] to-[#DC2626]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">What You Will Learn</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-[#DC2626] to-[#264174] mx-auto"></div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              'Complete Accounting Fundamentals',
              'Journal Entries to Trial Balance',
              'Tally Prime (Full Practical)',
              'Zoho Books',
              'GST Concepts & Return Filing (GSTR-1 & GSTR-3B)',
              'Income Tax Basics & TDS',
              'Payroll & Salary Accounting',
              'Profit & Loss, Balance Sheet, Cash Flow',
              'Advanced Excel + AI Tools',
              'Communication, Email Writing & Office Etiquette',
              'Realistic Mock Assignments'
            ].map((item, index) => (
              <div key={index} className="bg-gradient-to-br from-[#DC2626]/50 to-[#264174]/60 rounded-lg p-4 border border-white/10 hover:border-white/30 transition-all duration-300">
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                    <span className="text-[#264174] font-black text-xs">{index + 1}</span>
                  </div>
                  <p className="text-white font-semibold text-sm">{item}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Student Benefits Section */}
      <section className="py-16 bg-gradient-to-b from-[#DC2626]/30 to-[#264174]/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">Student Benefits</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-[#DC2626] to-[#264174] mx-auto"></div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {[
              'Daily assignments to build practical confidence',
              'Weekly quizzes for progress measurement',
              'Real-world scenarios from multiple industries',
              'Friendly and supportive environment',
              'Personal attention due to small batches',
              'Career counseling & CV preparation',
              'Placement assistance'
            ].map((item, index) => (
              <div key={index} className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <div className="flex items-center">
                  <div className="text-lg mr-3">✓</div>
                  <p className="text-white text-sm font-medium">{item}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Placement Partners Section */}
      <section className="py-16 bg-gradient-to-b from-[#264174]/20 to-[#2B2A29]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">Placement Partners</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-[#DC2626] to-[#264174] mx-auto mb-3"></div>
            <p className="text-base text-white/80">Trusted by leading companies for quality talent</p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 md:p-12 border-2 border-[#DC2626]/50">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 md:gap-8">
              {[
                'RBL BANK',
                'ConverseHR',
                'YES BANK',
                'Yogeshwar enterprises',
                'OUTLOOK HR SOLUTIONS',
                'edventure park',
                'MINISTRY OF Cheese',
                'IMPERIAL Multi-Cuisine Restaurant',
                'KGNXclusive',
                'The Nawaab\'s RESTAURANT',
                'Pista House',
                'ICICI Bank'
              ].map((company, index) => (
                <div 
                  key={index} 
                  className="bg-white/10 rounded-xl p-6 border border-white/20 hover:border-[#DC2626]/70 transition-all duration-300 hover:scale-105 flex items-center justify-center min-h-[120px]"
                >
                  <p className="text-white font-semibold text-center text-sm md:text-base">{company}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Fees Structure Section */}
      <section id="fees-structure" className="py-16 bg-gradient-to-br from-[#1e3a5f] via-[#264174] to-[#DC2626] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='50' cy='50' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">Fees Structure</h2>
          </div>

          <div className="bg-gradient-to-br from-[#264174]/95 via-[#DC2626]/90 to-[#264174]/95 p-6 md:p-8 rounded-2xl border-2 border-white/20 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 border-2 border-dashed border-white/30 rounded-2xl pointer-events-none"></div>
            
            <div className="grid md:grid-cols-2 gap-6 md:gap-8 relative z-10">
              <div className="text-center md:text-left">
                <h3 className="text-2xl md:text-3xl font-black text-white mb-4">Total Fees</h3>
                <div className="mb-3">
                  <div className="text-lg md:text-xl text-white/70 line-through mb-1">₹50,000/</div>
                  <div className="text-3xl md:text-4xl font-black text-white mb-1">₹24,999/-</div>
                  <div className="text-sm text-white/90">(Plus GST)</div>
                </div>
              </div>

              <div className="text-center md:text-left">
                <h3 className="text-2xl md:text-3xl font-black text-white mb-4">Instalment Schedule</h3>
                <div className="space-y-3">
                  <div className="text-base md:text-lg text-white">
                    Registration fee: <span className="font-bold">₹10,000</span>
                  </div>
                  <div className="text-base md:text-lg text-white">
                    1st Instalment: <span className="font-bold">₹14,999/-</span>
                  </div>
                  <div className="text-sm text-white/90 italic">plus GST</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-16 bg-[#2B2A29]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">Frequently Asked Questions</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-[#DC2626] to-[#264174] mx-auto"></div>
          </div>

          <div className="space-y-4">
            {[
              {
                q: 'Who can join this course?',
                a: 'Fresh graduates, commerce students, job seekers, and beginners who want practical accounting skills.'
              },
              {
                q: 'What is the course duration?',
                a: '45 Days (approx. 6–7 weeks).'
              },
              {
                q: 'Do I need prior accounting knowledge?',
                a: 'No. We start from basics and build up to advanced concepts.'
              },
              {
                q: 'Will I get practical training?',
                a: 'Yes. Our training is majorly practical with hands-on work in Tally, Excel, and GST.'
              },
              {
                q: 'Do you provide placement?',
                a: 'We provide placement assistance, interview preparation, CV support, and job referrals. (We do not guarantee jobs — performance-based support is provided.)'
              },
              {
                q: 'Will I get a certificate?',
                a: 'Yes. You will receive a certificate upon course completion.'
              },
              {
                q: 'Do students get assignments & quizzes?',
                a: 'Yes. Through our online portal, students get daily assignments and weekly quizzes to improve consistency.'
              },
              {
                q: 'Do you offer online batches?',
                a: 'Yes. Both online and offline batches are available.'
              },
              {
                q: 'Will I learn advanced Excel?',
                a: 'Yes — including formulas, pivot tables, and AI-powered tools for automation.'
              },
              {
                q: 'How can I enroll?',
                a: 'Call us or fill the registration form on the website.'
              }
            ].map((faq, index) => (
              <div key={index} className="bg-gradient-to-br from-[#264174]/50 to-[#DC2626]/40 rounded-xl p-5 md:p-6 border border-white/10 hover:border-white/30 transition-all duration-300">
                <h3 className="text-base md:text-lg font-black text-white mb-3">{faq.q}</h3>
                <p className="text-white/80 text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 bg-gradient-to-br from-[#1e3a5f] via-[#264174] to-[#DC2626]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-6">
            Ready to Start Your Accounting Career?
          </h2>
          <p className="text-lg text-white/90 mb-10">
            Join SuperAccountant and become job-ready in just 45 days
          </p>
          <button
            onClick={handleGetStarted}
            className="bg-[#DC2626] text-white px-12 py-4 rounded-lg text-lg font-semibold hover:bg-[#B91C1C] transition-colors"
          >
            Enroll Now
          </button>
        </div>
      </section>

    </div>
  )
}
