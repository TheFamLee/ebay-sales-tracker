"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Shield, Link2, User, Bell, Ticket, Copy, Trash2, Loader2 } from "lucide-react"
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

export default function SettingsPage() {
  const { data: session } = useSession()
  const [invites, setInvites] = useState<InviteCode[]>([])
  const [loadingInvites, setLoadingInvites] = useState(true)
  const [creatingInvite, setCreatingInvite] = useState(false)
  const [maxUses, setMaxUses] = useState(1)
  const [expiresInDays, setExpiresInDays] = useState<number | undefined>(undefined)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

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

  useEffect(() => {
    fetchInvites()
  }, [fetchInvites])

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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage your account and preferences.
        </p>
      </div>

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
              <Link2 className="h-5 w-5" />
              eBay Integration
            </CardTitle>
            <CardDescription>Connect your eBay seller account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">eBay Account</p>
                <p className="text-sm text-muted-foreground">
                  {session?.user ? "Not connected" : "Loading..."}
                </p>
              </div>
              <Button disabled>Connect eBay</Button>
            </div>
            <p className="text-xs text-muted-foreground">
              eBay integration will be available in Phase 3. This will allow you to sync your
              active listings and sales data automatically.
            </p>
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
