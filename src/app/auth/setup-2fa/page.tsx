"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function Setup2FAPage() {
  const router = useRouter()
  const { data: session, status, update } = useSession()

  const [qrCode, setQrCode] = useState("")
  const [secret, setSecret] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [setupComplete, setSetupComplete] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login")
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user && !qrCode) {
      generateQRCode()
    }
  }, [session])

  const generateQRCode = async () => {
    try {
      const response = await fetch("/api/auth/2fa/setup", {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to generate QR code")
        return
      }

      setQrCode(data.qrCode)
      setSecret(data.secret)
    } catch {
      setError("Failed to generate QR code")
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: verificationCode }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Verification failed")
        setLoading(false)
        return
      }

      setSetupComplete(true)
      await update({ twoFactorEnabled: true, twoFactorVerified: true })
    } catch {
      setError("Verification failed")
      setLoading(false)
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  if (setupComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center text-green-600">
              2FA Enabled Successfully
            </CardTitle>
            <CardDescription className="text-center">
              Your account is now protected with two-factor authentication
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4 bg-green-50 border-green-200">
              <AlertDescription className="text-green-800">
                Make sure to save your backup codes in a secure location. You&apos;ll need them if you lose access to your authenticator app.
              </AlertDescription>
            </Alert>
            <Button className="w-full" onClick={() => router.push("/dashboard")}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Set Up Two-Factor Authentication
          </CardTitle>
          <CardDescription className="text-center">
            Scan the QR code with your authenticator app
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-6">
            <div className="text-sm text-gray-600 space-y-2">
              <p>1. Download an authenticator app like:</p>
              <ul className="list-disc list-inside ml-2">
                <li>Google Authenticator</li>
                <li>Authy</li>
                <li>Microsoft Authenticator</li>
              </ul>
            </div>

            {qrCode && (
              <div className="flex justify-center">
                <div className="p-4 bg-white rounded-lg shadow-inner">
                  <Image
                    src={qrCode}
                    alt="QR Code for 2FA"
                    width={200}
                    height={200}
                    unoptimized
                  />
                </div>
              </div>
            )}

            {secret && (
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">
                  Or enter this code manually:
                </p>
                <code className="bg-gray-100 px-3 py-1 rounded text-sm font-mono">
                  {secret}
                </code>
              </div>
            )}

            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="verificationCode">
                  2. Enter the 6-digit code from your app
                </Label>
                <Input
                  id="verificationCode"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                  className="text-center text-2xl tracking-widest"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading || verificationCode.length !== 6}
              >
                {loading ? "Verifying..." : "Enable 2FA"}
              </Button>
            </form>

            <div className="text-center">
              <Button variant="ghost" onClick={() => router.push("/dashboard")}>
                Skip for now
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
