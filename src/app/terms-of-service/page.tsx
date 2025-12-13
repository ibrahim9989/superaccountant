'use client'

import Link from 'next/link'

export default function TermsOfService() {
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
              Terms of Service
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-white/90 mb-6 max-w-4xl mx-auto font-medium">
              Please read these terms carefully before using our services
            </p>
            <p className="text-sm text-white/80">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16 bg-gradient-to-b from-[#2B2A29] to-[#264174]/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-[#264174]/50 to-[#DC2626]/40 rounded-2xl p-6 md:p-10 border border-white/10 space-y-8">
            
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-white mb-4">1. Acceptance of Terms</h2>
              <p className="text-white/90 leading-relaxed mb-4">
                By accessing and using the Super Accountant platform, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-black text-white mb-4">2. Description of Service</h2>
              <p className="text-white/90 leading-relaxed mb-4">
                Super Accountant provides practical accounting training, including but not limited to:
              </p>
              <ul className="list-disc list-inside text-white/90 space-y-2 ml-4">
                <li>45-day comprehensive accounting course</li>
                <li>Training in Tally, GST, Income Tax, and Advanced Excel</li>
                <li>Daily assignments and weekly quizzes</li>
                <li>Placement assistance services</li>
                <li>Certificate upon course completion</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-black text-white mb-4">3. Enrollment and Payment</h2>
              <p className="text-white/90 leading-relaxed mb-4">
                By enrolling in our course, you agree to:
              </p>
              <ul className="list-disc list-inside text-white/90 space-y-2 ml-4">
                <li>Pay the total course fee of ₹24,999/- (plus GST) as per the installment schedule</li>
                <li>Complete the registration fee of ₹10,000/- and first installment of ₹14,999/- (plus GST)</li>
                <li>Understand that fees are non-refundable after course commencement</li>
                <li>Provide accurate information during enrollment</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-black text-white mb-4">4. User Responsibilities</h2>
              <p className="text-white/90 leading-relaxed mb-4">
                You are responsible for:
              </p>
              <ul className="list-disc list-inside text-white/90 space-y-2 ml-4">
                <li>Maintaining the confidentiality of your account credentials</li>
                <li>Completing assignments and quizzes as required</li>
                <li>Following all course guidelines and instructions</li>
                <li>Not sharing course materials with unauthorized parties</li>
                <li>Providing accurate and truthful information</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-black text-white mb-4">5. Intellectual Property</h2>
              <p className="text-white/90 leading-relaxed mb-4">
                All course materials, including but not limited to videos, documents, quizzes, and assessments, are the intellectual property of Super Accountant. You may not:
              </p>
              <ul className="list-disc list-inside text-white/90 space-y-2 ml-4">
                <li>Reproduce, distribute, or share course materials without authorization</li>
                <li>Use course content for commercial purposes</li>
                <li>Create derivative works based on our materials</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-black text-white mb-4">6. Placement Assistance</h2>
              <p className="text-white/90 leading-relaxed mb-4">
                Super Accountant provides placement assistance including interview preparation, CV support, and job referrals. However:
              </p>
              <ul className="list-disc list-inside text-white/90 space-y-2 ml-4">
                <li>We do not guarantee job placement</li>
                <li>Placement assistance is performance-based</li>
                <li>Final hiring decisions rest with employers</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-black text-white mb-4">7. Refund Policy</h2>
              <p className="text-white/90 leading-relaxed mb-4">
                Course fees are non-refundable after the course has commenced. Refund requests before course start date will be evaluated on a case-by-case basis and may be subject to administrative charges.
              </p>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-black text-white mb-4">8. Limitation of Liability</h2>
              <p className="text-white/90 leading-relaxed mb-4">
                Super Accountant shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the service. Our total liability shall not exceed the amount you paid for the course.
              </p>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-black text-white mb-4">9. Modifications to Terms</h2>
              <p className="text-white/90 leading-relaxed mb-4">
                We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting. Your continued use of the service constitutes acceptance of the modified terms.
              </p>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-black text-white mb-4">10. Termination</h2>
              <p className="text-white/90 leading-relaxed mb-4">
                We reserve the right to terminate or suspend your account and access to the service at our sole discretion, without prior notice, for conduct that we believe violates these Terms of Service or is harmful to other users, us, or third parties.
              </p>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-black text-white mb-4">11. Governing Law</h2>
              <p className="text-white/90 leading-relaxed mb-4">
                These Terms of Service shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law provisions.
              </p>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-black text-white mb-4">12. Contact Information</h2>
              <p className="text-white/90 leading-relaxed mb-4">
                If you have any questions about these Terms of Service, please contact us through our website or email.
              </p>
            </div>

          </div>

          <div className="text-center mt-8">
            <Link
              href="/"
              className="inline-flex items-center text-white/80 hover:text-white transition-colors text-sm font-medium group"
            >
              <svg className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Home
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

