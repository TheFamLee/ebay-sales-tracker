import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import { isEbayConfigured } from "@/lib/ebay/config"

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if eBay API is configured
    const configured = isEbayConfigured()

    // Get user's eBay connection status
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        ebayUsername: true,
        ebayConnectedAt: true,
        ebayTokenExpiry: true,
      },
    })

    const connected = !!(user?.ebayUsername || user?.ebayConnectedAt)
    const tokenExpired = user?.ebayTokenExpiry
      ? new Date(user.ebayTokenExpiry) < new Date()
      : false

    return NextResponse.json({
      configured,
      connected,
      tokenExpired,
      username: user?.ebayUsername || null,
      connectedAt: user?.ebayConnectedAt || null,
    })
  } catch (error) {
    console.error("eBay status error:", error)
    return NextResponse.json(
      { error: "Failed to get eBay status" },
      { status: 500 }
    )
  }
}
