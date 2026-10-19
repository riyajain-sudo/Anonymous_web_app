import { NextRequest, NextResponse } from 'next/server'
export {default} from "next-auth/middleware"
import { getToken } from 'next-auth/jwt'

 
// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {

    const token = await getToken({req: request})
    const url = request.nextUrl

    if(token && (
        url.pathname.startsWith('/sign-in') ||
        url.pathname.startsWith('/sign-up') ||
        // url.pathname.startsWith('/verify') ||
        url.pathname === ('/')
    )) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  // return NextResponse.redirect(new URL('/home', request.url))

  // If user is NOT logged in and tries to access protected routes → send to sign-in
  if (!token && (
    url.pathname.startsWith('/dashboard')
    // url.pathname.startsWith('/verify')
  )) {
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }

  // Otherwise, allow the request
  return NextResponse.next()
}
 
// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    '/sign-in',
    '/sign-up',
    '/',
    '/dashboard/:path*',
    '/verify/:path*'
  ]
}