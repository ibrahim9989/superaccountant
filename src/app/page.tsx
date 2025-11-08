'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [remainingSeconds, setRemainingSeconds] = useState<number>(300)

  // Simple 5-minute countdown to mimic limited-time offer visuals
  const minutes = useMemo(() => Math.floor(remainingSeconds / 60), [remainingSeconds])
  const seconds = useMemo(() => remainingSeconds % 60, [remainingSeconds])

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  useEffect(() => {
    const intervalId = setInterval(() => {
      setRemainingSeconds((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(intervalId)
  }, [])

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
    <div className="min-h-screen w-full bg-black relative overflow-hidden">
      {/* Decorative glow (right) */}
      <div className="pointer-events-none absolute inset-y-0 right-[-10%] w-[55%] hidden md:block">
        <div className="absolute right-24 top-1/4 h-80 w-40 rounded-md bg-azure-accent/40 blur-[40px]"></div>
        <div className="absolute right-20 top-1/4 h-80 w-40 rounded-md border border-azure-accent/60"></div>
      </div>

      {/* Navigation */}
      <nav className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-white rounded-sm flex items-center justify-center">
            <span className="text-black font-bold text-xs sm:text-sm">SA</span>
          </div>
          <span className="text-white text-sm sm:text-base lg:text-lg font-medium">Super Accountant</span>
        </div>
        <div className="hidden md:flex items-center gap-6">
          <Link href="#" className="text-sm text-gray-300 hover:text-white transition-colors">For Business</Link>
          <Link href="#" className="text-sm text-gray-300 hover:text-white transition-colors">Alumni</Link>
          <Link href="#" className="text-sm text-gray-300 hover:text-white transition-colors">Newsletter</Link>
          <Link href="#" className="text-sm text-gray-300 hover:text-white transition-colors">Contact Us</Link>
          <Link href="/login" className="text-sm text-white/90 border border-white/20 hover:border-white/40 rounded-lg px-3 py-2 transition-colors">Apply as Mentor</Link>
          <Link href="/login" className="text-sm bg-azure-accent hover:bg-blue-600 text-white rounded-lg px-4 py-2 transition-colors">Explore Courses</Link>
        </div>
        <div className="md:hidden">
          <Link href="/login" className="text-sm bg-azure-accent hover:bg-blue-600 text-white rounded-lg px-3 py-2 transition-colors">Explore</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex flex-col justify-center min-h-screen px-4 sm:px-6 lg:px-8 pt-24 pb-24">
        <div className="max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <div>
            {/* Main Heading - Outskill inspired */}
            <h1 className="font-light text-white leading-tight mb-6">
              <span className="block text-4xl sm:text-5xl md:text-6xl xl:text-7xl">Transform Your Career</span>
              <span className="block text-4xl sm:text-5xl md:text-6xl xl:text-7xl">with <span className="text-azure-accent">Accounting</span></span>
              <span className="block text-2xl sm:text-3xl md:text-4xl xl:text-5xl text-white/80 mt-2">in 45 Days</span>
            </h1>

            {/* Subheading */}
            <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-xl leading-relaxed mb-8 font-light">
              Join our immersive certification to become the professional everyone turns to for finance and accounting solutions.
            </p>

            {/* CTA Row */}
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/login"
                className="bg-azure-accent hover:bg-blue-600 text-white px-6 sm:px-8 py-3 rounded-lg font-semibold transition-colors"
              >
                Get Started
              </Link>
              <Link
                href="/login"
                className="text-white/90 hover:text-white border border-white/20 hover:border-white/40 px-6 sm:px-8 py-3 rounded-lg transition-colors"
              >
                Learn More
              </Link>
            </div>

            {/* Info bar */}
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <div className="text-gray-400">Start Date</div>
                <div className="text-white font-semibold">08 Nov 2025</div>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <div className="text-gray-400">Start Time</div>
                <div className="text-white font-semibold">10 AM IST</div>
              </div>
              <div className="rounded-lg border border-azure-accent/30 bg-azure-accent/10 p-4">
                <div className="text-azure-accent">Offer expires in</div>
                <div className="text-white font-semibold">
                  {String(minutes).padStart(2, '0')} min : {String(seconds).padStart(2, '0')} sec
                </div>
              </div>
            </div>
          </div>

          {/* Right visual */}
          <div className="hidden md:block relative h-[520px]">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-azure-accent/20 to-transparent rounded-3xl border border-white/10"></div>
            <div className="absolute left-1/2 top-1/4 -translate-x-1/2 h-80 w-40 rounded-md bg-azure-accent/40 blur-[30px]"></div>
            <div className="absolute left-1/2 top-1/4 -translate-x-1/2 h-80 w-40 rounded-md border border-azure-accent/70"></div>
            <div className="absolute bottom-6 left-6 text-gray-400 text-sm">AI-guided practice • Career-ready skills</div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section className="px-4 sm:px-6 lg:px-8 pb-8 sm:pb-12 md:pb-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Feature 1 */}
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-gray-800">
              <div className="w-8 h-8 sm:w-10 sm:h-10 mb-3 sm:mb-4">
                <svg className="w-full h-full text-azure-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-white text-base sm:text-lg font-semibold mb-2 sm:mb-3">45-Day Intensive</h3>
              <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
                Comprehensive curriculum designed by industry experts to master accounting fundamentals.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-gray-800">
              <div className="w-8 h-8 sm:w-10 sm:h-10 mb-3 sm:mb-4">
                <svg className="w-full h-full text-azure-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <h3 className="text-white text-base sm:text-lg font-semibold mb-2 sm:mb-3">Industry Certification</h3>
              <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
                Earn a recognized Super Accountant certification that validates your expertise.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-gray-800 sm:col-span-2 lg:col-span-1">
              <div className="w-8 h-8 sm:w-10 sm:h-10 mb-3 sm:mb-4">
                <svg className="w-full h-full text-azure-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-white text-base sm:text-lg font-semibold mb-2 sm:mb-3">AI-Powered</h3>
              <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
                Advanced AI interview system that evaluates your understanding and provides feedback.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
