// Middleware temporarily disabled to fix auth issues
// import { type NextRequest } from 'next/server'
// import { updateSession } from '@/lib/supabase/middleware'

// export async function middleware(request: NextRequest) {
//   return await updateSession(request)
// }

// export const config = {
//   matcher: [
//     '/((?!_next/static|_next/image|favicon.ico|auth|debug|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
//   ],
// }
