'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'

export default function SiteHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <nav className="bg-white border-b border-[#DC2626]/50 sticky top-0 z-50 h-16 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex justify-between items-center h-full">
          <Link href="/" className="flex items-center h-full overflow-visible">
            <Image
              src="/logosa.png"
              alt="Super Accountant Logo"
              width={300}
              height={100}
              className="h-[150%] sm:h-[160%] md:h-[180%] w-auto object-contain object-center"
              priority
            />
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            <Link href="/#features" className="text-gray-700 hover:text-[#DC2626] transition-colors text-sm font-medium">
              Features
            </Link>
            <Link href="/#how-it-works" className="text-gray-700 hover:text-[#DC2626] transition-colors text-sm font-medium">
              How It Works
            </Link>
            <Link href="/#testimonials" className="text-gray-700 hover:text-[#DC2626] transition-colors text-sm font-medium">
              Testimonials
            </Link>
            <Link href="/#pricing" className="text-gray-700 hover:text-[#DC2626] transition-colors text-sm font-medium">
              Pricing
            </Link>
            <Link
              href="/login"
              className="bg-[#DC2626] text-white px-4 py-2 sm:px-6 sm:py-2 rounded-lg hover:bg-[#B91C1C] transition-colors text-sm font-semibold"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden text-gray-700 hover:text-[#DC2626] transition-colors p-2"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 py-4 animate-fade-in">
            <div className="flex flex-col space-y-4">
              <Link 
                href="/#features" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-gray-700 hover:text-[#DC2626] transition-colors px-4 py-2 text-base font-medium"
              >
                Features
              </Link>
              <Link 
                href="/#how-it-works" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-gray-700 hover:text-[#DC2626] transition-colors px-4 py-2 text-base font-medium"
              >
                How It Works
              </Link>
              <Link 
                href="/#testimonials" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-gray-700 hover:text-[#DC2626] transition-colors px-4 py-2 text-base font-medium"
              >
                Testimonials
              </Link>
              <Link 
                href="/#pricing" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-gray-700 hover:text-[#DC2626] transition-colors px-4 py-2 text-base font-medium"
              >
                Pricing
              </Link>
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="bg-[#DC2626] text-white px-6 py-3 rounded-lg hover:bg-[#B91C1C] transition-colors text-base font-semibold mx-4 text-center"
              >
                Get Started
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
