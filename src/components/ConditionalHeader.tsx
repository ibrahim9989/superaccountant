'use client'

import { usePathname } from 'next/navigation'
import SiteHeader from './SiteHeader'

export default function ConditionalHeader() {
  const pathname = usePathname()
  
  // Hide global header on learn pages (they have their own unified header)
  if (pathname?.startsWith('/learn/')) {
    return null
  }
  
  return <SiteHeader />
}

