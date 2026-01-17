import type { NextAuthConfig } from "next-auth"

// This is the Edge-compatible auth config used by middleware
// It does NOT include the Credentials provider (which needs Prisma/bcrypt)
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard")
      const isOnAuth = nextUrl.pathname.startsWith("/auth")
      const isOnApi = nextUrl.pathname.startsWith("/api")
      const isRoot = nextUrl.pathname === "/"

      // API routes handle their own auth
      if (isOnApi) {
        return true
      }

      // Redirect logged-in users away from auth pages
      if (isLoggedIn && isOnAuth) {
        return Response.redirect(new URL("/dashboard", nextUrl))
      }

      // Redirect root based on auth status
      if (isRoot) {
        if (isLoggedIn) {
          return Response.redirect(new URL("/dashboard", nextUrl))
        }
        return Response.redirect(new URL("/auth/login", nextUrl))
      }

      // Protect dashboard routes
      if (isOnDashboard) {
        if (isLoggedIn) {
          // Check 2FA if enabled
          const user = auth?.user as { twoFactorEnabled?: boolean; twoFactorVerified?: boolean } | undefined
          if (user?.twoFactorEnabled && !user?.twoFactorVerified) {
            return Response.redirect(new URL("/auth/2fa", nextUrl))
          }
          return true
        }
        return false // Redirect to login
      }

      // Allow auth pages for non-logged-in users
      if (isOnAuth) {
        return true
      }

      return true
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.email = user.email as string
        token.role = (user as { role?: string }).role || "user"
        token.twoFactorEnabled = (user as { twoFactorEnabled?: boolean }).twoFactorEnabled || false
        token.twoFactorVerified = !(user as { twoFactorEnabled?: boolean }).twoFactorEnabled
      }

      if (trigger === "update" && session) {
        token.twoFactorVerified = session.twoFactorVerified
        if (session.twoFactorEnabled !== undefined) {
          token.twoFactorEnabled = session.twoFactorEnabled
        }
      }

      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.role = token.role as string
        session.user.twoFactorEnabled = token.twoFactorEnabled as boolean
        session.user.twoFactorVerified = token.twoFactorVerified as boolean
      }
      return session
    },
  },
  providers: [], // Providers are added in the full config
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  trustHost: true,
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
}
