import { EBAY_CONFIG } from "./config"
import { prisma } from "@/lib/db/prisma"

interface TokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
}

/**
 * Generate the eBay OAuth authorization URL
 */
export function getEbayAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: EBAY_CONFIG.clientId,
    redirect_uri: EBAY_CONFIG.redirectUri,
    response_type: "code",
    scope: EBAY_CONFIG.scopes,
    state: state, // CSRF protection - should include user ID
  })

  return `${EBAY_CONFIG.authUrl}?${params.toString()}`
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(code: string): Promise<TokenResponse> {
  const credentials = Buffer.from(
    `${EBAY_CONFIG.clientId}:${EBAY_CONFIG.clientSecret}`
  ).toString("base64")

  const response = await fetch(EBAY_CONFIG.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: code,
      redirect_uri: EBAY_CONFIG.redirectUri,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to exchange code for token: ${error}`)
  }

  return response.json()
}

/**
 * Refresh an expired access token
 */
export async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const credentials = Buffer.from(
    `${EBAY_CONFIG.clientId}:${EBAY_CONFIG.clientSecret}`
  ).toString("base64")

  const response = await fetch(EBAY_CONFIG.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      scope: EBAY_CONFIG.scopes,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to refresh token: ${error}`)
  }

  return response.json()
}

/**
 * Get a valid access token for a user, refreshing if necessary
 */
export async function getValidAccessToken(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      ebayToken: true,
      ebayRefreshToken: true,
      ebayTokenExpiry: true,
    },
  })

  if (!user?.ebayToken || !user?.ebayRefreshToken) {
    return null
  }

  // Check if token is expired (with 5 min buffer)
  const isExpired = user.ebayTokenExpiry
    ? new Date(user.ebayTokenExpiry).getTime() < Date.now() + 5 * 60 * 1000
    : true

  if (!isExpired) {
    return user.ebayToken
  }

  // Token is expired, refresh it
  try {
    const tokenData = await refreshAccessToken(user.ebayRefreshToken)

    // Update user with new token
    await prisma.user.update({
      where: { id: userId },
      data: {
        ebayToken: tokenData.access_token,
        ebayRefreshToken: tokenData.refresh_token,
        ebayTokenExpiry: new Date(Date.now() + tokenData.expires_in * 1000),
      },
    })

    return tokenData.access_token
  } catch (error) {
    console.error("Failed to refresh eBay token:", error)
    // Clear invalid tokens
    await prisma.user.update({
      where: { id: userId },
      data: {
        ebayToken: null,
        ebayRefreshToken: null,
        ebayTokenExpiry: null,
      },
    })
    return null
  }
}

/**
 * Save eBay tokens to user record
 */
export async function saveEbayTokens(
  userId: string,
  tokenData: TokenResponse,
  ebayUsername?: string
): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      ebayToken: tokenData.access_token,
      ebayRefreshToken: tokenData.refresh_token,
      ebayTokenExpiry: new Date(Date.now() + tokenData.expires_in * 1000),
      ebayUsername: ebayUsername,
      ebayConnectedAt: new Date(),
    },
  })
}

/**
 * Disconnect eBay account
 */
export async function disconnectEbay(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      ebayUserId: null,
      ebayUsername: null,
      ebayToken: null,
      ebayRefreshToken: null,
      ebayTokenExpiry: null,
      ebayConnectedAt: null,
    },
  })
}
