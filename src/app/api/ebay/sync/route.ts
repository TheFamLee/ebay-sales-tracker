import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { syncAllEbayData, syncOrders, syncListings, syncPayouts } from "@/lib/ebay/sync"
import { prisma } from "@/lib/db/prisma"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has eBay connected
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { ebayToken: true, ebayUsername: true },
    })

    if (!user?.ebayToken) {
      return NextResponse.json(
        { error: "eBay account not connected" },
        { status: 400 }
      )
    }

    // Get sync type from request body
    const body = await request.json().catch(() => ({}))
    const syncType = body.type || "all" // all, orders, listings, payouts

    let result

    switch (syncType) {
      case "orders":
        const ordersResult = await syncOrders(session.user.id, { daysBack: body.daysBack })
        result = {
          ordersImported: ordersResult.imported,
          ordersUpdated: ordersResult.updated,
          errors: [],
        }
        break

      case "listings":
        const listingsResult = await syncListings(session.user.id)
        result = {
          listingsImported: listingsResult.imported,
          listingsUpdated: listingsResult.updated,
          errors: [],
        }
        break

      case "payouts":
        const payoutsResult = await syncPayouts(session.user.id, { daysBack: body.daysBack })
        result = {
          payoutsImported: payoutsResult.imported,
          errors: [],
        }
        break

      default:
        result = await syncAllEbayData(session.user.id)
    }

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error) {
    console.error("eBay sync error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sync failed" },
      { status: 500 }
    )
  }
}

// GET endpoint to check sync status / get counts
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get counts
    const [salesCount, listingsCount, payoutsCount] = await Promise.all([
      prisma.ebaySale.count({ where: { userId: session.user.id } }),
      prisma.ebayListing.count({ where: { userId: session.user.id } }),
      prisma.ebayPayout.count({ where: { userId: session.user.id } }),
    ])

    // Get last sync time (most recent update)
    const lastSale = await prisma.ebaySale.findFirst({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
      select: { updatedAt: true },
    })

    return NextResponse.json({
      salesCount,
      listingsCount,
      payoutsCount,
      lastSync: lastSale?.updatedAt || null,
    })
  } catch (error) {
    console.error("eBay sync status error:", error)
    return NextResponse.json(
      { error: "Failed to get sync status" },
      { status: 500 }
    )
  }
}
