import Link from 'next/link'
import Image from 'next/image'

export default function SiteFooter() {
  return (
    <footer className="bg-[#2B2A29] text-white py-12 border-t border-[#DC2626]/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="mb-4">
              <Image
                src="/logosa.png"
                alt="Super Accountant Logo"
                width={180}
                height={60}
                className="h-12 md:h-14 w-auto object-contain"
              />
            </div>
            <p className="text-gray-200 mb-4">Practical accounting training to make you job-ready in 45 days.</p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-gray-200">
                <li className="flex items-center">
                  <span className="mr-2 text-[#DC2626]">📞</span>
                  <a href="tel:+918106138866" className="hover:text-white transition-colors">+91 810 613 8866</a>
                </li>
                <li className="flex items-center">
                  <span className="mr-2 text-[#DC2626]">✉️</span>
                  <a href="mailto:info@superaccountant.in" className="hover:text-white transition-colors">info@superaccountant.in</a>
                </li>
              </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Address</h4>
            <ul className="space-y-2 text-gray-200">
              <li>Unit 422, 4th floor</li>
              <li>Downtown Mall</li>
              <li>Lakdikapul</li>
              <li>Hyderabad</li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-gray-200">
              <li><Link href="/#fees-structure" className="hover:text-white transition-colors">Fees Structure</Link></li>
              <li><Link href="/#faq" className="hover:text-white transition-colors">FAQs</Link></li>
              <li><Link href="/login" className="hover:text-white transition-colors">Login</Link></li>
              <li><Link href="/courses" className="hover:text-white transition-colors">Courses</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/20 mt-8 pt-8 text-center text-gray-200">
          <p>&copy; 2024 Super Accountant. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}


