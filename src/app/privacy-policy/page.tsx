'use client'

import Link from 'next/link'

export default function PrivacyPolicy() {
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
              Privacy Policy
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-white/90 mb-6 max-w-4xl mx-auto font-medium">
              Your privacy is important to us. Learn how we collect, use, and protect your information.
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
              <h2 className="text-2xl md:text-3xl font-black text-white mb-4">1. Introduction</h2>
              <p className="text-white/90 leading-relaxed mb-4">
                Super Accountant ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform and services.
              </p>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-black text-white mb-4">2. Information We Collect</h2>
              <p className="text-white/90 leading-relaxed mb-4">
                We collect information that you provide directly to us, including:
              </p>
              <ul className="list-disc list-inside text-white/90 space-y-2 ml-4">
                <li><strong>Personal Information:</strong> Name, email address, phone number, date of birth, address</li>
                <li><strong>Account Information:</strong> Username, password, profile information</li>
                <li><strong>Educational Information:</strong> Educational background, work experience, assessment results</li>
                <li><strong>Payment Information:</strong> Billing address, payment method details (processed through secure third-party payment processors)</li>
                <li><strong>Usage Data:</strong> Course progress, assignment submissions, quiz results, login history</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-black text-white mb-4">3. How We Use Your Information</h2>
              <p className="text-white/90 leading-relaxed mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc list-inside text-white/90 space-y-2 ml-4">
                <li>Provide, maintain, and improve our services</li>
                <li>Process your enrollment and manage your account</li>
                <li>Track your course progress and performance</li>
                <li>Send you course updates, assignments, and important notifications</li>
                <li>Provide placement assistance and career counseling</li>
                <li>Process payments and send transaction receipts</li>
                <li>Respond to your inquiries and provide customer support</li>
                <li>Send marketing communications (with your consent)</li>
                <li>Comply with legal obligations and enforce our terms</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-black text-white mb-4">4. Information Sharing and Disclosure</h2>
              <p className="text-white/90 leading-relaxed mb-4">
                We do not sell your personal information. We may share your information only in the following circumstances:
              </p>
              <ul className="list-disc list-inside text-white/90 space-y-2 ml-4">
                <li><strong>Service Providers:</strong> With third-party service providers who perform services on our behalf (payment processing, email delivery, hosting)</li>
                <li><strong>Placement Partners:</strong> With potential employers and placement partners (with your explicit consent) for job placement assistance</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights and safety</li>
                <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
                <li><strong>With Your Consent:</strong> For any other purpose disclosed to you with your permission</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-black text-white mb-4">5. Data Security</h2>
              <p className="text-white/90 leading-relaxed mb-4">
                We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet or electronic storage is 100% secure.
              </p>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-black text-white mb-4">6. Third-Party Services</h2>
              <p className="text-white/90 leading-relaxed mb-4">
                Our platform may contain links to third-party websites or services. We are not responsible for the privacy practices of these third parties. We encourage you to read their privacy policies.
              </p>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-black text-white mb-4">7. Cookies and Tracking Technologies</h2>
              <p className="text-white/90 leading-relaxed mb-4">
                We use cookies and similar tracking technologies to track activity on our platform and store certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our service.
              </p>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-black text-white mb-4">8. Your Rights and Choices</h2>
              <p className="text-white/90 leading-relaxed mb-4">
                You have the right to:
              </p>
              <ul className="list-disc list-inside text-white/90 space-y-2 ml-4">
                <li>Access and receive a copy of your personal information</li>
                <li>Rectify inaccurate or incomplete information</li>
                <li>Request deletion of your personal information</li>
                <li>Object to processing of your personal information</li>
                <li>Request restriction of processing your personal information</li>
                <li>Data portability (receive your data in a structured format)</li>
                <li>Withdraw consent at any time where we rely on consent</li>
                <li>Opt-out of marketing communications</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-black text-white mb-4">9. Data Retention</h2>
              <p className="text-white/90 leading-relaxed mb-4">
                We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law. Course records and certificates may be retained for archival purposes.
              </p>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-black text-white mb-4">10. Children's Privacy</h2>
              <p className="text-white/90 leading-relaxed mb-4">
                Our services are not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If you are a parent or guardian and believe your child has provided us with personal information, please contact us.
              </p>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-black text-white mb-4">11. International Data Transfers</h2>
              <p className="text-white/90 leading-relaxed mb-4">
                Your information may be transferred to and maintained on computers located outside of your state, province, country, or other governmental jurisdiction where data protection laws may differ. By using our service, you consent to the transfer of your information.
              </p>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-black text-white mb-4">12. Changes to This Privacy Policy</h2>
              <p className="text-white/90 leading-relaxed mb-4">
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes.
              </p>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-black text-white mb-4">13. Contact Us</h2>
              <p className="text-white/90 leading-relaxed mb-4">
                If you have any questions about this Privacy Policy or wish to exercise your rights, please contact us through our website or email.
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

