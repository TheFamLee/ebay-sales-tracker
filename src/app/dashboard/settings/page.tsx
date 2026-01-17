"use client"

import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Shield, Link2, User, Bell } from "lucide-react"
import Link from "next/link"

export default function SettingsPage() {
  const { data: session } = useSession()

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
