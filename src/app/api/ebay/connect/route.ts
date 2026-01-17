import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getEbayAuthUrl } from "@/lib/ebay/auth"
import { isEbayConfigured } from "@/lib/ebay/config"
import { nanoid } from "nanoid"

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!isEbayConfigured()) {
      return NextResponse.json(
        { error: "eBay API not configured. Please add EBAY_CLIENT_ID and EBAY_CLIENT_SECRET to environment variables." },
        { status: 500 }
      )
    }

    // Create state parameter with user ID and CSRF token
    const state = `${session.user.id}:${nanoid()}`

    // Store state in a cookie for verification on callback
    const authUrl = getEbayAuthUrl(state)

    const response = NextResponse.redirect(authUrl)

    // Set state cookie for CSRF protection
    response.cookies.set("ebay_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600, // 10 minutes
    })

    return response
  } catch (error) {
    console.error("eBay connect error:", error)
    return NextResponse.json(
      { error: "Failed to initiate eBay connection" },
      { status: 500 }
    )
  }
}
