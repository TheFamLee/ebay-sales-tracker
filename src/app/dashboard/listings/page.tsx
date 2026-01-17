"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ShoppingCart, RefreshCw, Link2 } from "lucide-react"

export default function ListingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Active Listings</h2>
        <p className="text-muted-foreground">
          View and manage your current eBay listings.
        </p>
      </div>

      <Alert>
        <Link2 className="h-4 w-4" />
        <AlertTitle>eBay Connection Required</AlertTitle>
        <AlertDescription>
          Connect your eBay account to sync your active listings. This feature will be available in Phase 3 of development.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Your Listings</span>
            <Button disabled variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Sync from eBay
            </Button>
          </CardTitle>
          <CardDescription>
            0 active listings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <ShoppingCart className="h-16 w-16 mb-4 opacity-30" />
            <p className="text-lg font-medium">No listings yet</p>
            <p className="text-sm text-center max-w-md mt-2">
              Connect your eBay account to automatically sync your active listings,
              or they will appear here after you mark imported sales as still active.
            </p>
            <Button className="mt-4" disabled>
              Connect eBay Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
