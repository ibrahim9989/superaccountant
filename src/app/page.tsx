'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const supabase = getSupabaseClient()

  // simple countdown (5 minutes) for monochrome CTAs
  const [secondsLeft, setSecondsLeft] = useState(5 * 60)
  useEffect(() => {
    const intervalId = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0))
    }, 1000)
    return () => clearInterval(intervalId)
  }, [])
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const ss = String(secondsLeft % 60).padStart(2, '0')

  useEffect(() => {
    if (!loading && user) {
      router.push('/profile-form')
    }
  }, [user, loading, router])

  const handleGetStarted = async () => {
    if (!user) {
      // Not authenticated, redirect to login
      router.push('/login')
      return
    }

    try {
      // Check if user has a profile
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, approval_status')
        .eq('id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error checking profile:', error)
        // If there's an error, redirect to profile form to be safe
        router.push('/profile-form')
        return
      }

      if (!profile) {
        // No profile found, redirect to create profile
        router.push('/profile-form')
      } else if (profile.approval_status === 'approved') {
        // Profile approved, redirect to dashboard
        router.push('/dashboard')
      } else if (profile.approval_status === 'pending') {
        // Profile pending approval, redirect to under-review page
        router.push('/under-review')
      } else {
        // Rejected or other status, redirect to profile form
        router.push('/profile-form')
      }
    } catch (err) {
      console.error('Unexpected error in handleGetStarted:', err)
      router.push('/profile-form')
    }
  }

  const handleWatchDemo = () => {
    // For now, just redirect to login if not authenticated, or assessment if authenticated
    if (!user) {
      router.push('/login')
    } else {
      router.push('/assessment')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }

  if (user) {
    return null
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="bg-black border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                <span className="text-black font-bold text-lg">SA</span>
              </div>
              <span className="text-white text-xl font-bold">Super Accountant</span>
      </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-300 hover:text-white transition-colors">Features</a>
              <a href="#how-it-works" className="text-gray-300 hover:text-white transition-colors">How It Works</a>
              <a href="#testimonials" className="text-gray-300 hover:text-white transition-colors">Testimonials</a>
              <a href="#pricing" className="text-gray-300 hover:text-white transition-colors">Pricing</a>
              <button
                onClick={handleGetStarted}
                className="bg-white text-black px-6 py-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-black via-gray-900 to-black py-20 md:py-24 overflow-hidden">
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

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Luxury Badge */}
            <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 border border-gray-500/50 rounded-full mb-10 shadow-2xl backdrop-blur-sm">
              <div className="w-2.5 h-2.5 bg-gradient-to-r from-white to-gray-300 rounded-full mr-3 animate-pulse"></div>
              <span className="text-white text-xs md:text-sm font-bold tracking-[0.22em] uppercase">ELITE ACCOUNTING MASTERY</span>
              <div className="w-2.5 h-2.5 bg-gradient-to-r from-gray-300 to-white rounded-full ml-3 animate-pulse"></div>
            </div>

            {/* Premium Headline */}
            <h1
              className="text-5xl md:text-7xl lg:text-8xl font-black text-white mb-8 md:mb-10 leading-[0.9] tracking-tight drop-shadow-2xl"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Become a
              <span className="block bg-gradient-to-r from-gray-100 via-white to-gray-200 bg-clip-text text-transparent">
                Super Accountant
              </span>
          </h1>

            {/* Elegant Subtext */}
            <div className="max-w-4xl md:max-w-5xl mx-auto mb-12 md:mb-16">
              <p className="text-lg md:text-xl text-gray-200 leading-relaxed font-light tracking-wide mb-6 md:mb-8">
                Transform from an ordinary accountant into an elite financial strategist.
                Master advanced accounting principles, strategic financial analysis, and executive-level decision making.
              </p>
              <div className="flex items-center justify-center gap-3 md:gap-6 text-xs md:text-sm text-gray-300 font-medium">
                <div className="flex items-center bg-gradient-to-r from-gray-800/50 to-gray-700/50 px-4 py-2 md:px-5 md:py-2.5 rounded-full border border-gray-600/50">
                  <div className="w-2.5 h-2.5 bg-gradient-to-r from-white to-gray-400 rounded-full mr-2.5"></div>
                  <span className="tracking-wider">90-DAY PROGRAM</span>
                </div>
                <div className="flex items-center bg-gradient-to-r from-gray-800/50 to-gray-700/50 px-4 py-2 md:px-5 md:py-2.5 rounded-full border border-gray-600/50">
                  <div className="w-2.5 h-2.5 bg-gradient-to-r from-white to-gray-400 rounded-full mr-2.5"></div>
                  <span className="tracking-wider">50+ EXPERT MODULES</span>
                </div>
                <div className="flex items-center bg-gradient-to-r from-gray-800/50 to-gray-700/50 px-4 py-2 md:px-5 md:py-2.5 rounded-full border border-gray-600/50">
                  <div className="w-2.5 h-2.5 bg-gradient-to-r from-white to-gray-400 rounded-full mr-2.5"></div>
                  <span className="tracking-wider">100% SUCCESS RATE</span>
                </div>
              </div>
            </div>

            {/* Premium CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 md:gap-8 justify-center mb-12 md:mb-14">
              <button
                onClick={handleGetStarted}
                className="group relative bg-gradient-to-r from-white via-gray-100 to-white text-black px-8 md:px-10 py-4 md:py-5 rounded-2xl md:rounded-3xl text-lg md:text-xl font-bold tracking-wide shadow-2xl shadow-white/25 hover:shadow-white/40 transform hover:scale-105 transition-all duration-500 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-white to-gray-200 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <span className="relative z-10">Start Your Journey</span>
              </button>
              <button
                onClick={handleWatchDemo}
                className="group border-2 border-gray-400/50 text-white px-8 md:px-10 py-4 md:py-5 rounded-2xl md:rounded-3xl text-lg md:text-xl font-semibold tracking-wide bg-gradient-to-r from-transparent to-gray-800/30 hover:from-gray-800/20 hover:to-gray-700/40 backdrop-blur-sm transition-all duration-500 shadow-xl"
              >
                <span className="group-hover:tracking-widest transition-all duration-500">Watch Demo</span>
              </button>
            </div>

            {/* Premium Stats */}
            <div className="flex items-center justify-center space-x-16 text-gray-300">
              <div className="text-center bg-gradient-to-br from-gray-800/30 to-gray-900/50 px-8 py-6 rounded-2xl border border-gray-700/50 backdrop-blur-sm">
                <div className="text-5xl font-black text-white mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">500+</div>
                <div className="text-sm tracking-[0.15em] uppercase font-medium">Elite Accountants</div>
              </div>
              <div className="hidden md:block w-px h-16 bg-gradient-to-b from-transparent via-gray-500 to-transparent"></div>
              <div className="text-center bg-gradient-to-br from-gray-800/30 to-gray-900/50 px-8 py-6 rounded-2xl border border-gray-700/50 backdrop-blur-sm">
                <div className="text-5xl font-black text-white mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">98%</div>
                <div className="text-sm tracking-[0.15em] uppercase font-medium">Career Advancement</div>
              </div>
              <div className="hidden md:block w-px h-16 bg-gradient-to-b from-transparent via-gray-500 to-transparent"></div>
              <div className="text-center bg-gradient-to-br from-gray-800/30 to-gray-900/50 px-8 py-6 rounded-2xl border border-gray-700/50 backdrop-blur-sm">
                <div className="text-5xl font-black text-white mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">24/7</div>
                <div className="text-sm tracking-[0.15em] uppercase font-medium">Premium Support</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted Partners */}
      <section className="py-24 bg-black border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8 items-end mb-12">
            <div>
              <h3 className="text-5xl md:text-6xl font-black text-white leading-tight">
                Trusted Partners
              </h3>
              <p className="text-gray-400 mt-4 max-w-xl">
                Super Accountant collaborates with innovative companies and tools used by top finance teams.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-8 items-center opacity-80">
            {['Google','Fireflies','Bolt','Numerous','Writesonic','Humanic','Supergrow','Vapi','Emergent','Segment','Linear','Notion'].map((name) => (
              <div key={name} className="flex items-center justify-center h-14 rounded-lg border border-gray-800 bg-gradient-to-br from-gray-900 to-black text-gray-300 text-sm tracking-widest uppercase">
                {name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Program Intro */}
      <section className="py-24 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div>
              <h3 className="text-5xl md:text-6xl font-black text-white leading-tight">
                One Program
              </h3>
              <h4 className="text-5xl md:text-6xl font-black text-white leading-tight mt-2">
                Lifetime of Accounting Skills
              </h4>
            </div>
            <div>
              <p className="text-gray-300 text-xl leading-relaxed">
                While others debate if automation will replace roles, you’ll learn to make AI and modern finance systems work for you. This isn’t theory—it's a hands-on program that delivers real transformation and execution excellence.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Audience Section */}
      <section className="py-24 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-6xl font-black text-white mb-10">Who is Super Accountant for?</h3>

          <div className="relative overflow-hidden rounded-3xl border border-gray-800 bg-gradient-to-br from-gray-950 via-black to-gray-900">
            {/* Monochrome stock image backdrop */}
            <img
              src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&auto=format&fit=crop&w=1600&h=700&grayscale"
              alt="Professional group"
              className="absolute inset-0 w-full h-full object-cover opacity-40"
              loading="lazy"
            />
            <div className="relative grid grid-cols-1 md:grid-cols-3">
              {[
                {label: '1-3 Yrs', desc: 'of Experience'},
                {label: '3-9 Yrs', desc: 'of Experience'},
                {label: '10+ Yrs', desc: 'of Experience'},
              ].map((tier, i) => (
                <div key={tier.label} className={`p-10 md:p-14 ${i>0 ? 'md:border-l md:border-gray-800' : ''}`}>
                  <div className="text-4xl md:text-5xl font-black text-white mb-2">{tier.label}</div>
                  <div className="text-gray-300">{tier.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-black border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">90</div>
              <div className="text-gray-400">Days Program</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">50+</div>
              <div className="text-gray-400">Expert Modules</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">24/7</div>
              <div className="text-gray-400">Support Access</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">100%</div>
              <div className="text-gray-400">Success Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 bg-gradient-to-b from-black via-gray-900 to-black relative overflow-hidden">
        {/* Luxury Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.15'%3E%3Ccircle cx='40' cy='40' r='1.5'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        {/* Premium Background Effects */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-20 w-80 h-80 bg-gradient-to-br from-white/3 via-gray-700/5 to-black/3 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-br from-black/5 via-gray-600/8 to-white/3 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-24">
            <div className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 border border-gray-500/50 rounded-full mb-12 shadow-2xl backdrop-blur-sm">
              <span className="text-white text-sm font-bold tracking-[0.2em] uppercase">PREMIUM FEATURES</span>
            </div>
            <h2 className="text-6xl md:text-7xl font-black text-white mb-8 leading-tight bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent">
              Why Choose Super Accountant?
            </h2>
            <p className="text-2xl md:text-3xl text-gray-200 max-w-5xl mx-auto font-light leading-relaxed">
              Our comprehensive program equips you with the skills and knowledge to excel in the competitive accounting industry.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-16">
            <div className="group bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-12 rounded-3xl border border-gray-600/50 hover:border-white/70 transition-all duration-700 hover:transform hover:scale-105 shadow-2xl hover:shadow-white/10">
              <div className="w-20 h-20 bg-gradient-to-br from-white via-gray-200 to-white rounded-3xl flex items-center justify-center mb-10 group-hover:scale-110 transition-transform duration-500 shadow-xl shadow-white/25">
                <span className="text-black text-4xl">⚡</span>
              </div>
              <h3 className="text-3xl font-black text-white mb-8 tracking-wide">Lightning Fast Processing</h3>
              <p className="text-gray-300 text-xl leading-relaxed">Process complex financial statements in record time with our proven methodologies and automated tools.</p>
              <div className="mt-10 w-16 h-1 bg-gradient-to-r from-white via-gray-300 to-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </div>

            <div className="group bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-12 rounded-3xl border border-gray-600/50 hover:border-white/70 transition-all duration-700 hover:transform hover:scale-105 shadow-2xl hover:shadow-white/10">
              <div className="w-20 h-20 bg-gradient-to-br from-white via-gray-200 to-white rounded-3xl flex items-center justify-center mb-10 group-hover:scale-110 transition-transform duration-500 shadow-xl shadow-white/25">
                <span className="text-black text-4xl">🎯</span>
              </div>
              <h3 className="text-3xl font-black text-white mb-8 tracking-wide">Precision Perfect</h3>
              <p className="text-gray-300 text-xl leading-relaxed">Eliminate errors and ensure 100% accuracy in your financial reporting with our rigorous quality controls.</p>
              <div className="mt-10 w-16 h-1 bg-gradient-to-r from-white via-gray-300 to-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </div>

            <div className="group bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-12 rounded-3xl border border-gray-600/50 hover:border-white/70 transition-all duration-700 hover:transform hover:scale-105 shadow-2xl hover:shadow-white/10">
              <div className="w-20 h-20 bg-gradient-to-br from-white via-gray-200 to-white rounded-3xl flex items-center justify-center mb-10 group-hover:scale-110 transition-transform duration-500 shadow-xl shadow-white/25">
                <span className="text-black text-4xl">🚀</span>
              </div>
              <h3 className="text-3xl font-black text-white mb-8 tracking-wide">Career Acceleration</h3>
              <p className="text-gray-300 text-xl leading-relaxed">Fast-track your career with executive-level accounting expertise and industry-recognized certifications.</p>
              <div className="mt-10 w-16 h-1 bg-gradient-to-r from-white via-gray-300 to-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-32 bg-gradient-to-b from-gray-900 via-black to-gray-900 relative overflow-hidden">
        {/* Premium Background Effects */}
        <div className="absolute inset-0 opacity-25">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-gray-800/8 via-black/5 to-gray-700/8 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-gray-700/8 via-black/5 to-gray-800/8 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-24">
            <div className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 border border-gray-500/50 rounded-full mb-12 shadow-2xl backdrop-blur-sm">
              <span className="text-white text-sm font-bold tracking-[0.2em] uppercase">THE PROCESS</span>
            </div>
            <h2 className="text-6xl md:text-7xl font-black text-white mb-8 leading-tight bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent">
              How It Works
            </h2>
            <p className="text-2xl md:text-3xl text-gray-200 font-light">Three elegant steps to transform your accounting career</p>
          </div>

          <div className="grid md:grid-cols-3 gap-16 relative">
            {/* Premium Connection Lines */}
            <div className="hidden md:block absolute top-28 left-1/3 right-1/3 h-1 bg-gradient-to-r from-transparent via-gray-600 to-transparent"></div>
            <div className="hidden md:block absolute top-28 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-gradient-to-r from-gray-600 to-gray-500 rounded-full"></div>

            <div className="text-center group">
              <div className="relative mb-12">
                <div className="w-32 h-32 bg-gradient-to-br from-white via-gray-200 to-white rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-white/25 group-hover:scale-110 transition-transform duration-700">
                  <span className="text-black text-5xl font-black">1</span>
                </div>
                <div className="absolute -inset-2 bg-gradient-to-br from-white/20 via-gray-400/10 to-white/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </div>
              <h3 className="text-3xl font-black text-white mb-8 tracking-wide">Enroll & Assess</h3>
              <p className="text-gray-300 text-xl leading-relaxed max-w-sm mx-auto">Take our comprehensive assessment to understand your current skill level and create your personalized learning path.</p>
            </div>

            <div className="text-center group">
              <div className="relative mb-12">
                <div className="w-32 h-32 bg-gradient-to-br from-white via-gray-200 to-white rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-white/25 group-hover:scale-110 transition-transform duration-700">
                  <span className="text-black text-5xl font-black">2</span>
                </div>
                <div className="absolute -inset-2 bg-gradient-to-br from-white/20 via-gray-400/10 to-white/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </div>
              <h3 className="text-3xl font-black text-white mb-8 tracking-wide">Learn & Practice</h3>
              <p className="text-gray-300 text-xl leading-relaxed max-w-sm mx-auto">Access our comprehensive curriculum with interactive lessons, daily tests, and hands-on assignments.</p>
            </div>

            <div className="text-center group">
              <div className="relative mb-12">
                <div className="w-32 h-32 bg-gradient-to-br from-white via-gray-200 to-white rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-white/25 group-hover:scale-110 transition-transform duration-700">
                  <span className="text-black text-5xl font-black">3</span>
                </div>
                <div className="absolute -inset-2 bg-gradient-to-br from-white/20 via-gray-400/10 to-white/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </div>
              <h3 className="text-3xl font-black text-white mb-8 tracking-wide">Certify & Advance</h3>
              <p className="text-gray-300 text-xl leading-relaxed max-w-sm mx-auto">Complete your final assessment and receive your Super Accountant certification to accelerate your career.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-32 bg-gradient-to-b from-black via-gray-900 to-black relative overflow-hidden">
        {/* Premium Background Elements */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-20 w-80 h-80 bg-gradient-to-br from-gray-800/8 via-black/5 to-gray-700/8 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-br from-gray-700/8 via-black/5 to-gray-800/8 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-24">
            <div className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 border border-gray-500/50 rounded-full mb-12 shadow-2xl backdrop-blur-sm">
              <span className="text-white text-sm font-bold tracking-[0.2em] uppercase">SUCCESS STORIES</span>
            </div>
            <h2 className="text-6xl md:text-7xl font-black text-white mb-8 leading-tight bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent">
              What Our Elite Accountants Say
            </h2>
            <p className="text-2xl md:text-3xl text-gray-200 font-light">Hear from professionals who transformed their careers</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="group bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-10 rounded-3xl border border-gray-600/50 hover:border-white/70 transition-all duration-700 hover:transform hover:scale-105 shadow-2xl hover:shadow-white/10">
              <div className="flex items-center mb-10">
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-br from-white via-gray-200 to-white rounded-full flex items-center justify-center shadow-xl shadow-white/25">
                    <span className="text-black font-bold text-xl">SM</span>
                  </div>
                  <div className="absolute -top-1 -right-1 w-8 h-8 bg-gradient-to-r from-white to-gray-300 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-black text-sm font-bold">✓</span>
                  </div>
                </div>
                <div className="ml-8">
                  <div className="font-black text-white text-xl">Sarah Mitchell</div>
                  <div className="text-gray-300 text-sm font-medium">Senior Accountant at Deloitte</div>
                </div>
              </div>
              <div className="mb-8">
                <svg className="w-10 h-10 text-white mb-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z"/>
                </svg>
              </div>
              <p className="text-gray-300 text-xl leading-relaxed italic">"Super Accountant transformed my career. I went from struggling with basic accounting to leading complex financial analysis projects. The program is intensive but incredibly rewarding."</p>
              <div className="mt-8 flex items-center">
                <div className="flex text-white text-2xl">
                  {'★'.repeat(5)}
                </div>
                <span className="ml-3 text-gray-400 text-sm font-medium">Verified Graduate</span>
              </div>
            </div>

            <div className="group bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-10 rounded-3xl border border-gray-600/50 hover:border-white/70 transition-all duration-700 hover:transform hover:scale-105 shadow-2xl hover:shadow-white/10">
              <div className="flex items-center mb-10">
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-br from-white via-gray-200 to-white rounded-full flex items-center justify-center shadow-xl shadow-white/25">
                    <span className="text-black font-bold text-xl">JR</span>
                  </div>
                  <div className="absolute -top-1 -right-1 w-8 h-8 bg-gradient-to-r from-white to-gray-300 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-black text-sm font-bold">✓</span>
                  </div>
                </div>
                <div className="ml-8">
                  <div className="font-black text-white text-xl">James Rodriguez</div>
                  <div className="text-gray-300 text-sm font-medium">Financial Controller at TechCorp</div>
                </div>
              </div>
              <div className="mb-8">
                <svg className="w-10 h-10 text-white mb-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z"/>
                </svg>
              </div>
              <p className="text-gray-300 text-xl leading-relaxed italic">"The precision and speed I gained from this program are invaluable. I can now handle month-end closes in half the time, freeing me up for strategic work."</p>
              <div className="mt-8 flex items-center">
                <div className="flex text-white text-2xl">
                  {'★'.repeat(5)}
                </div>
                <span className="ml-3 text-gray-400 text-sm font-medium">Verified Graduate</span>
              </div>
            </div>

            <div className="group bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-10 rounded-3xl border border-gray-600/50 hover:border-white/70 transition-all duration-700 hover:transform hover:scale-105 shadow-2xl hover:shadow-white/10">
              <div className="flex items-center mb-10">
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-br from-white via-gray-200 to-white rounded-full flex items-center justify-center shadow-xl shadow-white/25">
                    <span className="text-black font-bold text-xl">AL</span>
                  </div>
                  <div className="absolute -top-1 -right-1 w-8 h-8 bg-gradient-to-r from-white to-gray-300 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-black text-sm font-bold">✓</span>
                  </div>
                </div>
                <div className="ml-8">
                  <div className="font-black text-white text-xl">Anna Liu</div>
                  <div className="text-gray-300 text-sm font-medium">CPA at Big Four Firm</div>
                </div>
              </div>
              <div className="mb-8">
                <svg className="w-10 h-10 text-white mb-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.996 3.638-3.996 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z"/>
                </svg>
              </div>
              <p className="text-gray-300 text-xl leading-relaxed italic">"This program gave me the confidence to take on executive-level responsibilities. The comprehensive curriculum and practical approach are unmatched."</p>
              <div className="mt-8 flex items-center">
                <div className="flex text-white text-2xl">
                  {'★'.repeat(5)}
                </div>
                <span className="ml-3 text-gray-400 text-sm font-medium">Verified Graduate</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32 bg-black relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='40' cy='40' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-6 py-3 bg-gray-800 border border-gray-600 rounded-full mb-8">
              <span className="text-white text-sm font-medium tracking-widest uppercase">PREMIUM PLANS</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-black text-white mb-6 leading-tight">
              Choose Your Elite Path
            </h2>
            <p className="text-xl md:text-2xl text-gray-300 font-light">Select the perfect premium plan for your accounting mastery journey</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="group bg-gray-900 p-10 rounded-3xl border border-gray-700 hover:border-white transition-all duration-500 hover:transform hover:scale-105">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <span className="text-white text-2xl font-bold">S</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Starter</h3>
                <div className="text-5xl font-black text-white mb-2">$299<span className="text-lg text-gray-400 font-normal">/month</span></div>
                <p className="text-gray-300 text-lg">Perfect for individual accountants</p>
              </div>

              <ul className="space-y-4 mb-10">
                <li className="flex items-center text-gray-300">
                  <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                    <span className="text-black text-xs font-bold">✓</span>
                  </div>
                  <span className="text-lg">Access to all core modules</span>
                </li>
                <li className="flex items-center text-gray-300">
                  <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                    <span className="text-black text-xs font-bold">✓</span>
                  </div>
                  <span className="text-lg">Daily practice tests</span>
                </li>
                <li className="flex items-center text-gray-300">
                  <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                    <span className="text-black text-xs font-bold">✓</span>
                  </div>
                  <span className="text-lg">Email support</span>
                </li>
                <li className="flex items-center text-gray-600">
                  <div className="w-5 h-5 bg-gray-600 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                    <span className="text-xs">✗</span>
                  </div>
                  <span className="text-lg">Advanced certifications</span>
                </li>
              </ul>

              <button
                onClick={handleGetStarted}
                className="w-full bg-gray-700 text-white py-4 rounded-2xl text-lg font-bold hover:bg-gray-600 transition-all duration-300"
              >
                Get Started
              </button>
            </div>

            <div className="group bg-gray-800 p-10 rounded-3xl border-2 border-white relative hover:transform hover:scale-105 transition-all duration-500">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-white text-black px-6 py-2 rounded-full text-sm font-bold">
                MOST POPULAR
              </div>

              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <span className="text-black text-2xl font-bold">P</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Professional</h3>
                <div className="text-5xl font-black text-white mb-2">$499<span className="text-lg text-gray-400 font-normal">/month</span></div>
                <p className="text-gray-300 text-lg">For serious career advancement</p>
              </div>

              <ul className="space-y-4 mb-10">
                <li className="flex items-center text-gray-300">
                  <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                    <span className="text-black text-xs font-bold">✓</span>
                  </div>
                  <span className="text-lg">Everything in Starter</span>
                </li>
                <li className="flex items-center text-gray-300">
                  <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                    <span className="text-black text-xs font-bold">✓</span>
                  </div>
                  <span className="text-lg">Advanced certifications</span>
                </li>
                <li className="flex items-center text-gray-300">
                  <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                    <span className="text-black text-xs font-bold">✓</span>
                  </div>
                  <span className="text-lg">1-on-1 mentoring</span>
                </li>
                <li className="flex items-center text-gray-300">
                  <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                    <span className="text-black text-xs font-bold">✓</span>
                  </div>
                  <span className="text-lg">Priority support</span>
                </li>
              </ul>

              <button
                onClick={handleGetStarted}
                className="w-full bg-white text-black py-4 rounded-2xl text-lg font-bold hover:bg-gray-200 transition-all duration-300"
              >
                Get Started
              </button>
            </div>

            <div className="group bg-gray-900 p-10 rounded-3xl border border-gray-700 hover:border-white transition-all duration-500 hover:transform hover:scale-105">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gray-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <span className="text-white text-2xl font-bold">E</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Enterprise</h3>
                <div className="text-5xl font-black text-white mb-2">Custom</div>
                <p className="text-gray-300 text-lg">For accounting firms & teams</p>
              </div>

              <ul className="space-y-4 mb-10">
                <li className="flex items-center text-gray-300">
                  <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                    <span className="text-black text-xs font-bold">✓</span>
                  </div>
                  <span className="text-lg">Everything in Professional</span>
                </li>
                <li className="flex items-center text-gray-300">
                  <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                    <span className="text-black text-xs font-bold">✓</span>
                  </div>
                  <span className="text-lg">Team management tools</span>
                </li>
                <li className="flex items-center text-gray-300">
                  <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                    <span className="text-black text-xs font-bold">✓</span>
                  </div>
                  <span className="text-lg">Custom curriculum</span>
                </li>
                <li className="flex items-center text-gray-300">
                  <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                    <span className="text-black text-xs font-bold">✓</span>
                  </div>
                  <span className="text-lg">Dedicated success manager</span>
                </li>
              </ul>

              <button
                onClick={handleGetStarted}
                className="w-full bg-gray-600 text-white py-4 rounded-2xl text-lg font-bold hover:bg-gray-500 transition-all duration-300"
              >
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-32 bg-black">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-6 py-3 bg-gray-800 border border-gray-600 rounded-full mb-8">
              <span className="text-white text-sm font-medium tracking-widest uppercase">FREQUENTLY ASKED</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-black text-white mb-6 leading-tight">
              Questions & Answers
            </h2>
            <p className="text-xl md:text-2xl text-gray-300 font-light">Everything you need to know about Super Accountant</p>
          </div>

          <div className="space-y-8">
            <div className="group bg-gray-900 p-8 rounded-3xl border border-gray-700 hover:border-white transition-all duration-500">
              <div className="flex items-start">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mr-6 mt-1 flex-shrink-0">
                  <span className="text-black text-xl font-bold">?</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-4">How long does the program take to complete?</h3>
                  <p className="text-gray-300 text-lg leading-relaxed">The core program is designed to be completed in 90 days with consistent daily practice. However, you can learn at your own pace and access the content indefinitely.</p>
                </div>
              </div>
            </div>

            <div className="group bg-gray-900 p-8 rounded-3xl border border-gray-700 hover:border-white transition-all duration-500">
              <div className="flex items-start">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mr-6 mt-1 flex-shrink-0">
                  <span className="text-black text-xl font-bold">?</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-4">Do I need prior accounting experience?</h3>
                  <p className="text-gray-300 text-lg leading-relaxed">While some basic accounting knowledge is helpful, our program is designed to take you from beginner to expert level. We provide foundational modules for those new to accounting.</p>
                </div>
              </div>
            </div>

            <div className="group bg-gray-900 p-8 rounded-3xl border border-gray-700 hover:border-white transition-all duration-500">
              <div className="flex items-start">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mr-6 mt-1 flex-shrink-0">
                  <span className="text-black text-xl font-bold">?</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-4">What certifications will I receive?</h3>
                  <p className="text-gray-300 text-lg leading-relaxed">Upon completion, you'll receive our Super Accountant certification, plus preparation for industry-standard certifications like CPA, CMA, and specialized financial analysis credentials.</p>
                </div>
              </div>
            </div>

            <div className="group bg-gray-900 p-8 rounded-3xl border border-gray-700 hover:border-white transition-all duration-500">
              <div className="flex items-start">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mr-6 mt-1 flex-shrink-0">
                  <span className="text-black text-xl font-bold">?</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-4">Is there a money-back guarantee?</h3>
                  <p className="text-gray-300 text-lg leading-relaxed">Yes! We offer a 30-day money-back guarantee. If you're not completely satisfied with your progress in the first month, we'll refund your payment in full.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-32 bg-gradient-to-br from-white via-gray-50 to-white relative overflow-hidden">
        {/* Luxury Background Elements */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-gray-200/10 via-white/5 to-gray-100/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-white/10 via-gray-200/8 to-gray-100/10 rounded-full blur-3xl" />
        </div>

        {/* Subtle Pattern Overlay */}
        <div className="absolute inset-0 opacity-[0.02]">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border border-gray-400/50 rounded-full mb-12 shadow-2xl backdrop-blur-sm">
            <span className="text-white text-sm font-bold tracking-[0.2em] uppercase">LAST CHANCE</span>
          </div>

          <h2 className="text-6xl md:text-7xl font-black text-black mb-12 leading-tight bg-gradient-to-r from-black via-gray-800 to-black bg-clip-text text-transparent">
            Ready to Become a
            <span className="block bg-gradient-to-r from-gray-900 via-black to-gray-900 bg-clip-text text-transparent">
              Super Accountant?
            </span>
          </h2>

          <p className="text-2xl md:text-3xl text-gray-600 mb-16 font-light leading-relaxed">
            Join thousands of professionals who have transformed their careers with our elite accounting program.
          </p>

          <div className="flex flex-col sm:flex-row gap-8 justify-center mb-12">
            <button
              onClick={handleGetStarted}
              className="group relative bg-gradient-to-r from-black via-gray-900 to-black text-white px-12 py-6 rounded-3xl text-2xl font-bold shadow-2xl shadow-black/25 hover:shadow-black/40 transform hover:scale-105 transition-all duration-500 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-gray-800 via-black to-gray-800 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <span className="relative z-10">Start Your Free Trial</span>
            </button>
            <button
              onClick={handleWatchDemo}
              className="group border-2 border-gray-400/50 text-gray-700 px-12 py-6 rounded-3xl text-2xl font-bold bg-gradient-to-r from-transparent to-gray-100/30 hover:from-gray-100/20 hover:to-gray-50/40 backdrop-blur-sm transition-all duration-500 shadow-xl"
            >
              <span className="group-hover:tracking-widest transition-all duration-500">Schedule a Demo</span>
            </button>
          </div>

          <div className="flex items-center justify-center space-x-12 text-gray-500 text-sm font-medium">
            <div className="flex items-center bg-gradient-to-r from-gray-100/50 to-gray-200/30 px-6 py-3 rounded-full border border-gray-300/50">
              <div className="w-3 h-3 bg-gradient-to-r from-gray-600 to-gray-800 rounded-full mr-3"></div>
              <span className="tracking-wide">No credit card required</span>
            </div>
            <div className="flex items-center bg-gradient-to-r from-gray-100/50 to-gray-200/30 px-6 py-3 rounded-full border border-gray-300/50">
              <div className="w-3 h-3 bg-gradient-to-r from-gray-600 to-gray-800 rounded-full mr-3"></div>
              <span className="tracking-wide">30-day money-back guarantee</span>
            </div>
            <div className="flex items-center bg-gradient-to-r from-gray-100/50 to-gray-200/30 px-6 py-3 rounded-full border border-gray-300/50">
              <div className="w-3 h-3 bg-gradient-to-r from-gray-600 to-gray-800 rounded-full mr-3"></div>
              <span className="tracking-wide">Lifetime access</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-12 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Sticky bottom CTA */}
          <div className="fixed inset-x-0 bottom-0 z-50">
            <div className="mx-auto max-w-7xl">
              <div className="m-4 rounded-2xl border border-gray-800 bg-black/80 backdrop-blur supports-[backdrop-filter]:bg-black/60 px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
                <div className="hidden md:block">
                  <div className="text-white font-semibold">2 Day Gen-AI Mastermind</div>
                  <div className="text-gray-400 text-sm">Final Call: Only 25 slots left!</div>
                </div>
                <div className="text-gray-400 text-sm">
                  Offer expires in <span className="text-white font-semibold">{mm}:{ss}</span>
                </div>
                <button
                  onClick={handleGetStarted}
                  className="bg-white text-black px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 transition"
                >
                  Join the free Mastermind
                </button>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                  <span className="text-black font-bold">SA</span>
                </div>
                <span className="text-white text-lg font-bold">Super Accountant</span>
              </div>
              <p className="text-gray-400 mb-4">Transform your accounting career with our elite training program.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Testimonials</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Super Accountant. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
