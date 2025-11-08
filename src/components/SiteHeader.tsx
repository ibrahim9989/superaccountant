import Link from 'next/link'

export default function SiteHeader() {
  return (
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
            <Link href="/#features" className="text-gray-300 hover:text-white transition-colors">Features</Link>
            <Link href="/#how-it-works" className="text-gray-300 hover:text-white transition-colors">How It Works</Link>
            <Link href="/#testimonials" className="text-gray-300 hover:text-white transition-colors">Testimonials</Link>
            <Link href="/#pricing" className="text-gray-300 hover:text-white transition-colors">Pricing</Link>
            <Link
              href="/login"
              className="bg-white text-black px-6 py-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}


