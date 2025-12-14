import { type NextRequest, NextResponse } from 'next/server'

// Minimal middleware for Next.js 16 compatibility
// Middleware functionality is disabled but file must export a function
export async function middleware(request: NextRequest) {
  // Pass through all requests without modification
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|auth|debug|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
