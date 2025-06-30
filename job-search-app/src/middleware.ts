import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const pathname = req.nextUrl.pathname

  // Allow access to auth pages without authentication
  if (pathname.startsWith('/auth/')) {
    return NextResponse.next()
  }

  // Require authentication for dashboard and API routes
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/api/')) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL('/auth/signin', req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ]
}