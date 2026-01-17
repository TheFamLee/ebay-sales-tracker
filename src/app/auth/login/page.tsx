"use client"

import { Suspense } from "react"
import { useState, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

function LoginForm() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard"
  const errorParam = searchParams.get("error")

  const [csrfToken, setCsrfToken] = useState("")
  const [loading, setLoading] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  // Fetch CSRF token on mount
  useEffect(() => {
    fetch("/api/auth/csrf", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setCsrfToken(data.csrfToken))
      .catch(console.error)
  }, [])

  const handleSubmit = () => {
    setLoading(true)
    // Form will submit natively
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          eBay Sales Tracker
        </CardTitle>
        <CardDescription className="text-center">
          Sign in to your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Native form submission to NextAuth */}
        <form
          ref={formRef}
          method="POST"
          action="/api/auth/callback/credentials"
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          {errorParam && (
            <Alert variant="destructive">
              <AlertDescription>
                {errorParam === "CredentialsSignin"
                  ? "Invalid email or password"
                  : "An error occurred during login"}
              </AlertDescription>
            </Alert>
          )}

          {/* Hidden fields for NextAuth */}
          <input type="hidden" name="csrfToken" value={csrfToken} />
          <input type="hidden" name="callbackUrl" value={callbackUrl} />

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading || !csrfToken}>
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Suspense fallback={
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <p>Loading...</p>
          </CardContent>
        </Card>
      }>
        <LoginForm />
      </Suspense>
    </div>
  )
}
