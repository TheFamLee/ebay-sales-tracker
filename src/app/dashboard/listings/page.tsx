"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, RefreshCw, Link2, Loader2, ExternalLink } from "lucide-react"
import Link from "next/link"

interface EbayListing {
  id: string
  listingId: string
  title: string
  price: number
  quantity: number
  quantityAvailable: number
  status: string
  listingUrl: string | null
  imageUrl: string | null
  categoryName: string | null
  createdAt: string
}

interface EbayStatus {
  configured: boolean
  connected: boolean
}

export default function ListingsPage() {
  const [ebayStatus, setEbayStatus] = useState<EbayStatus | null>(null)
  const [listings, setListings] = useState<EbayListing[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  const fetchEbayStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/ebay/status")
      const data = await response.json()
      setEbayStatus(data)
      return data
    } catch (error) {
      console.error("Failed to fetch eBay status:", error)
      return null
    }
  }, [])

  const fetchListings = useCallback(async () => {
    try {
      const response = await fetch("/api/listings")
      const data = await response.json()
      if (data.listings) {
        setListings(data.listings)
      }
    } catch (error) {
      console.error("Failed to fetch listings:", error)
    }
  }, [])

  useEffect(() => {
    const init = async () => {
      const status = await fetchEbayStatus()
      if (status?.connected) {
        await fetchListings()
      }
      setLoading(false)
    }
    init()
  }, [fetchEbayStatus, fetchListings])

  const syncListings = async () => {
    setSyncing(true)
    try {
      await fetch("/api/ebay/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "listings" }),
      })
      await fetchListings()
    } catch (error) {
      console.error("Failed to sync listings:", error)
    } finally {
      setSyncing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Active Listings</h2>
        <p className="text-muted-foreground">
          View and manage your current eBay listings.
        </p>
      </div>

      {!ebayStatus?.configured && (
        <Alert>
          <Link2 className="h-4 w-4" />
          <AlertTitle>eBay API Not Configured</AlertTitle>
          <AlertDescription>
            Add your eBay API credentials to enable listing sync. Go to{" "}
            <Link href="/dashboard/settings" className="underline font-medium">
              Settings
            </Link>{" "}
            to configure the integration.
          </AlertDescription>
        </Alert>
      )}

      {ebayStatus?.configured && !ebayStatus?.connected && (
        <Alert>
          <Link2 className="h-4 w-4" />
          <AlertTitle>Connect Your eBay Account</AlertTitle>
          <AlertDescription>
            Connect your eBay seller account to sync your active listings automatically.{" "}
            <Link href="/dashboard/settings" className="underline font-medium">
              Connect in Settings
            </Link>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Your Listings</span>
            <Button
              variant="outline"
              size="sm"
              disabled={!ebayStatus?.connected || syncing}
              onClick={syncListings}
            >
              {syncing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Sync from eBay
                </>
              )}
            </Button>
          </CardTitle>
          <CardDescription>
            {listings.length} active listing{listings.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {listings.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <ShoppingCart className="h-16 w-16 mb-4 opacity-30" />
              <p className="text-lg font-medium">No listings yet</p>
              <p className="text-sm text-center max-w-md mt-2">
                {ebayStatus?.connected
                  ? "Click 'Sync from eBay' to import your active listings."
                  : "Connect your eBay account to automatically sync your active listings."}
              </p>
              {!ebayStatus?.connected && (
                <Link href="/dashboard/settings">
                  <Button className="mt-4">
                    <Link2 className="mr-2 h-4 w-4" />
                    Connect eBay Account
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {listings.map((listing) => (
                <div
                  key={listing.id}
                  className="flex items-center gap-4 p-4 border rounded-lg"
                >
                  {listing.imageUrl ? (
                    <img
                      src={listing.imageUrl}
                      alt={listing.title}
                      className="w-16 h-16 object-cover rounded"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                      <ShoppingCart className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{listing.title}</p>
                      <Badge
                        variant={listing.status === "ACTIVE" ? "default" : "secondary"}
                      >
                        {listing.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {listing.categoryName || "Uncategorized"} · {listing.quantityAvailable} available
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">${listing.price.toFixed(2)}</p>
                    {listing.listingUrl && (
                      <a
                        href={listing.listingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1"
                      >
                        View on eBay
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
