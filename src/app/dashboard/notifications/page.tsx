"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bell, Check, Trash2 } from "lucide-react"

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Notifications</h2>
          <p className="text-muted-foreground">
            Stay updated on your listings and sales.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled>
            <Check className="mr-2 h-4 w-4" />
            Mark All Read
          </Button>
          <Button variant="outline" size="sm" disabled>
            <Trash2 className="mr-2 h-4 w-4" />
            Clear All
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Notifications</CardTitle>
          <CardDescription>0 unread notifications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Bell className="h-16 w-16 mb-4 opacity-30" />
            <p className="text-lg font-medium">No notifications</p>
            <p className="text-sm text-center max-w-md mt-2">
              Notifications will appear here when you have items that need attention,
              such as listings that haven&apos;t sold or price changes from competitors.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notification Types</CardTitle>
          <CardDescription>What you&apos;ll be notified about</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                <p className="font-medium">Stale Listings</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Items listed for more than 30 days without selling
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <p className="font-medium">Price Changes</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Significant competitor price changes for items you&apos;re tracking
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <p className="font-medium">Price Suggestions</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Recommended price adjustments based on market data
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
