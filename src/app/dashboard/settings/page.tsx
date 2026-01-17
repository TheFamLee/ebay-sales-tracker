"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { useSession } from "next-auth/react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, Link2, User, Bell, Ticket, Copy, Trash2, Loader2, RefreshCw, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"

interface InviteCode {
  id: string
  code: string
  maxUses: number
  uses: number
  expiresAt: string | null
  createdAt: string
  usedBy: { email: string; name: string | null } | null
}

interface EbayStatus {
  configured: boolean
  connected: boolean
  tokenExpired: boolean
  username: string | null
  connectedAt: string | null
}

interface SyncStatus {
  salesCount: number
  listingsCount: number
  payoutsCount: number
  lastSync: string | null
}

// Separate component that uses useSearchParams
function EbayCallbackAlerts() {
  const searchParams = useSearchParams()
  const ebayConnected = searchParams.get("ebay_connected")
  const ebayError = searchParams.get("ebay_error")

  if (!ebayConnected && !ebayError) return null

  return (
    <>
      {ebayConnected && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Successfully connected to eBay! You can now sync your sales data.
          </AlertDescription>
        </Alert>
      )}

      {ebayError && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            eBay connection failed: {decodeURIComponent(ebayError)}
          </AlertDescription>
        </Alert>
      )}
    </>
  )
}

export default function SettingsPage() {
  const { data: session } = useSession()

  const [invites, setInvites] = useState<InviteCode[]>([])
  const [loadingInvites, setLoadingInvites] = useState(true)
  const [creatingInvite, setCreatingInvite] = useState(false)
  const [maxUses, setMaxUses] = useState(1)
  const [expiresInDays, setExpiresInDays] = useState<number | undefined>(undefined)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  // eBay state
  const [ebayStatus, setEbayStatus] = useState<EbayStatus | null>(null)
  const [loadingEbay, setLoadingEbay] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null)
  const [disconnecting, setDisconnecting] = useState(false)

  const fetchInvites = useCallback(async () => {
    try {
      const response = await fetch("/api/invites")
      const data = await response.json()
      if (data.invites) {
        setInvites(data.invites)
      }
    } catch (error) {
      console.error("Failed to fetch invites:", error)
    } finally {
      setLoadingInvites(false)
    }
  }, [])

  const fetchEbayStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/ebay/status")
      const data = await response.json()
      setEbayStatus(data)

      if (data.connected) {
        const syncResponse = await fetch("/api/ebay/sync")
        const syncData = await syncResponse.json()
        setSyncStatus(syncData)
      }
    } catch (error) {
      console.error("Failed to fetch eBay status:", error)
    } finally {
      setLoadingEbay(false)
    }
  }, [])

  useEffect(() => {
    fetchInvites()
    fetchEbayStatus()
  }, [fetchInvites, fetchEbayStatus])

  const createInvite = async () => {
    setCreatingInvite(true)
    try {
      const response = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maxUses, expiresInDays }),
      })
      const data = await response.json()
      if (data.invite) {
        setInvites([data.invite, ...invites])
        setMaxUses(1)
        setExpiresInDays(undefined)
      }
    } catch (error) {
      console.error("Failed to create invite:", error)
    } finally {
      setCreatingInvite(false)
    }
  }

  const deleteInvite = async (id: string) => {
    try {
      await fetch(`/api/invites?id=${id}`, { method: "DELETE" })
      setInvites(invites.filter((invite) => invite.id !== id))
    } catch (error) {
      console.error("Failed to delete invite:", error)
    }
  }

  const copyInviteLink = (code: string) => {
    const url = `${window.location.origin}/auth/register?code=${code}`
    navigator.clipboard.writeText(url)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const connectEbay = () => {
    window.location.href = "/api/ebay/connect"
  }

  const disconnectEbay = async () => {
    setDisconnecting(true)
    try {
      await fetch("/api/ebay/disconnect", { method: "POST" })
      setEbayStatus({ ...ebayStatus!, connected: false, username: null })
      setSyncStatus(null)
    } catch (error) {
      console.error("Failed to disconnect eBay:", error)
    } finally {
      setDisconnecting(false)
    }
  }

  const syncEbay = async () => {
    setSyncing(true)
    try {
      const response = await fetch("/api/ebay/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "all" }),
      })
      const data = await response.json()

      if (data.success) {
        // Refresh sync status
        const statusResponse = await fetch("/api/ebay/sync")
        const statusData = await statusResponse.json()
        setSyncStatus(statusData)
      }
    } catch (error) {
      console.error("Failed to sync eBay:", error)
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage your account and preferences.
        </p>
      </div>

      {/* eBay OAuth callback alerts - wrapped in Suspense for useSearchParams */}
      <Suspense fallback={null}>
        <EbayCallbackAlerts />
      </Suspense>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account Information
            </CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-1">
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p>{session?.user?.email}</p>
            </div>
            <div className="grid gap-1">
              <p className="text-sm font-medium text-muted-foreground">Name</p>
              <p>{session?.user?.name || "Not set"}</p>
            </div>
            <div className="grid gap-1">
              <p className="text-sm font-medium text-muted-foreground">Role</p>
              <Badge variant="outline" className="w-fit">
                {session?.user?.role || "USER"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              eBay Integration
            </CardTitle>
            <CardDescription>Connect your eBay seller account to sync sales data automatically</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingEbay ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !ebayStatus?.configured ? (
              <Alert>
                <AlertDescription>
                  eBay API is not configured. Add <code className="bg-muted px-1 rounded">EBAY_CLIENT_ID</code> and{" "}
                  <code className="bg-muted px-1 rounded">EBAY_CLIENT_SECRET</code> to your environment variables.
                </AlertDescription>
              </Alert>
            ) : ebayStatus?.connected ? (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">eBay Account</p>
                      <Badge className="bg-green-100 text-green-800">Connected</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {ebayStatus.username || "Connected"} · Connected{" "}
                      {ebayStatus.connectedAt
                        ? new Date(ebayStatus.connectedAt).toLocaleDateString()
                        : ""}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={syncEbay}
                      disabled={syncing}
                    >
                      {syncing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Syncing...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Sync Now
                        </>
                      )}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={disconnectEbay}
                      disabled={disconnecting}
                    >
                      {disconnecting ? "..." : "Disconnect"}
                    </Button>
                  </div>
                </div>

                {syncStatus && (
                  <>
                    <Separator />
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold">{syncStatus.salesCount}</p>
                        <p className="text-sm text-muted-foreground">Orders</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{syncStatus.listingsCount}</p>
                        <p className="text-sm text-muted-foreground">Listings</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{syncStatus.payoutsCount}</p>
                        <p className="text-sm text-muted-foreground">Payouts</p>
                      </div>
                    </div>
                    {syncStatus.lastSync && (
                      <p className="text-xs text-muted-foreground text-center">
                        Last synced: {new Date(syncStatus.lastSync).toLocaleString()}
                      </p>
                    )}
                  </>
                )}
              </>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">eBay Account</p>
                  <p className="text-sm text-muted-foreground">
                    Connect your eBay seller account to import orders, listings, and payouts automatically.
                  </p>
                </div>
                <Button onClick={connectEbay}>
                  <Link2 className="mr-2 h-4 w-4" />
                  Connect eBay
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security
            </CardTitle>
            <CardDescription>Manage your security settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Two-Factor Authentication</p>
                <p className="text-sm text-muted-foreground">
                  Add an extra layer of security to your account
                </p>
              </div>
              {session?.user?.twoFactorEnabled ? (
                <Badge className="bg-green-100 text-green-800">Enabled</Badge>
              ) : (
                <Link href="/auth/setup-2fa">
                  <Button variant="outline">Enable 2FA</Button>
                </Link>
              )}
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Change Password</p>
                <p className="text-sm text-muted-foreground">
                  Update your account password
                </p>
              </div>
              <Button variant="outline" disabled>
                Change
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="h-5 w-5" />
              Invite Codes
            </CardTitle>
            <CardDescription>Create and manage invite codes for new users</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="maxUses">Max Uses</Label>
                <Input
                  id="maxUses"
                  type="number"
                  min={1}
                  value={maxUses}
                  onChange={(e) => setMaxUses(parseInt(e.target.value) || 1)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiresInDays">Expires In (days)</Label>
                <Input
                  id="expiresInDays"
                  type="number"
                  min={1}
                  placeholder="Never"
                  value={expiresInDays || ""}
                  onChange={(e) => setExpiresInDays(e.target.value ? parseInt(e.target.value) : undefined)}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={createInvite} disabled={creatingInvite} className="w-full">
                  {creatingInvite ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Invite"
                  )}
                </Button>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <p className="text-sm font-medium">Your Invite Codes</p>
              {loadingInvites ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : invites.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No invite codes created yet
                </p>
              ) : (
                <div className="space-y-2">
                  {invites.map((invite) => (
                    <div
                      key={invite.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                            {invite.code}
                          </code>
                          {invite.usedBy ? (
                            <Badge variant="secondary">
                              Used by {invite.usedBy.email}
                            </Badge>
                          ) : invite.uses >= invite.maxUses ? (
                            <Badge variant="secondary">Max uses reached</Badge>
                          ) : invite.expiresAt && new Date(invite.expiresAt) < new Date() ? (
                            <Badge variant="destructive">Expired</Badge>
                          ) : (
                            <Badge variant="outline">
                              {invite.uses}/{invite.maxUses} uses
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Created {new Date(invite.createdAt).toLocaleDateString()}
                          {invite.expiresAt && (
                            <> · Expires {new Date(invite.expiresAt).toLocaleDateString()}</>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyInviteLink(invite.code)}
                        >
                          {copiedCode === invite.code ? (
                            <span className="text-green-600 text-xs">Copied!</span>
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteInvite(invite.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Preferences
            </CardTitle>
            <CardDescription>Choose what you want to be notified about</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Stale Listing Alerts</p>
                <p className="text-sm text-muted-foreground">
                  Notify when items haven&apos;t sold after 30 days
                </p>
              </div>
              <Badge variant="outline">Coming Soon</Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Price Change Alerts</p>
                <p className="text-sm text-muted-foreground">
                  Notify when competitor prices change significantly
                </p>
              </div>
              <Badge variant="outline">Coming Soon</Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Price Recommendations</p>
                <p className="text-sm text-muted-foreground">
                  Notify when we suggest price adjustments
                </p>
              </div>
              <Badge variant="outline">Coming Soon</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Danger Zone</CardTitle>
            <CardDescription>Irreversible actions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Delete All Data</p>
                <p className="text-sm text-muted-foreground">
                  Permanently delete all your sales and listing data
                </p>
              </div>
              <Button variant="destructive" disabled>
                Delete Data
              </Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Delete Account</p>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all associated data
                </p>
              </div>
              <Button variant="destructive" disabled>
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
