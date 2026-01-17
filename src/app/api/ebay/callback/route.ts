import { NextRequest, NextResponse } from "next/server"
import { exchangeCodeForToken, saveEbayTokens } from "@/lib/ebay/auth"
import { getSellerProfile } from "@/lib/ebay/api"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get("code")
    const state = searchParams.get("state")
    const error = searchParams.get("error")
    const errorDescription = searchParams.get("error_description")

    // Check for OAuth errors
    if (error) {
      console.error("eBay OAuth error:", error, errorDescription)
      return NextResponse.redirect(
        new URL(`/dashboard/settings?ebay_error=${encodeURIComponent(errorDescription || error)}`, request.url)
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL("/dashboard/settings?ebay_error=Missing authorization code", request.url)
      )
    }

    // Verify state matches cookie (CSRF protection)
    const storedState = request.cookies.get("ebay_oauth_state")?.value
    if (!storedState || storedState !== state) {
      return NextResponse.redirect(
        new URL("/dashboard/settings?ebay_error=Invalid state parameter", request.url)
      )
    }

    // Extract user ID from state
    const [userId] = state.split(":")

    if (!userId) {
      return NextResponse.redirect(
        new URL("/dashboard/settings?ebay_error=Invalid user session", request.url)
      )
    }

    // Exchange code for tokens
    const tokenData = await exchangeCodeForToken(code)

    // Save tokens to database
    await saveEbayTokens(userId, tokenData)

    // Try to get the eBay username
    try {
      const profile = await getSellerProfile(userId)
      if (profile.username) {
        // Update with username
        await saveEbayTokens(userId, tokenData, profile.username)
      }
    } catch (profileError) {
      // Non-critical, continue anyway
      console.warn("Could not fetch eBay profile:", profileError)
    }

    // Clear the state cookie
    const response = NextResponse.redirect(
      new URL("/dashboard/settings?ebay_connected=true", request.url)
    )
    response.cookies.delete("ebay_oauth_state")

    return response
  } catch (error) {
    console.error("eBay callback error:", error)
    return NextResponse.redirect(
      new URL(
        `/dashboard/settings?ebay_error=${encodeURIComponent(error instanceof Error ? error.message : "Connection failed")}`,
        request.url
      )
    )
  }
}
