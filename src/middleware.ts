import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { nextUrl, auth: session } = req
  const { pathname } = nextUrl

  // Public routes that don't require authentication
  const publicRoutes = ["/auth/login", "/auth/register", "/api/auth"]
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route))

  // If user is not authenticated and trying to access protected route
  if (!session && !isPublicRoute && pathname !== "/") {
    const loginUrl = new URL("/auth/login", req.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // If user is authenticated but hasn't verified 2FA and trying to access protected route
  if (
    session?.user?.twoFactorEnabled &&
    !session?.user?.twoFactorVerified &&
    !pathname.startsWith("/auth/") &&
    !pathname.startsWith("/api/auth")
  ) {
    return NextResponse.redirect(new URL("/auth/2fa", req.url))
  }

  // If user is authenticated and trying to access auth pages, redirect to dashboard
  if (session && (pathname === "/auth/login" || pathname === "/auth/register")) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  // Redirect root to dashboard if authenticated, login if not
  if (pathname === "/") {
    if (session) {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    } else {
      return NextResponse.redirect(new URL("/auth/login", req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
}
