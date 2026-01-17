// eBay API Configuration
// You'll need to set these in your .env.local file after getting your eBay Developer credentials

export const EBAY_CONFIG = {
  // OAuth endpoints
  authUrl: process.env.EBAY_SANDBOX === "true"
    ? "https://auth.sandbox.ebay.com/oauth2/authorize"
    : "https://auth.ebay.com/oauth2/authorize",

  tokenUrl: process.env.EBAY_SANDBOX === "true"
    ? "https://api.sandbox.ebay.com/identity/v1/oauth2/token"
    : "https://api.ebay.com/identity/v1/oauth2/token",

  // API endpoints
  apiBaseUrl: process.env.EBAY_SANDBOX === "true"
    ? "https://api.sandbox.ebay.com"
    : "https://api.ebay.com",

  // Credentials from environment
  clientId: process.env.EBAY_CLIENT_ID || "",
  clientSecret: process.env.EBAY_CLIENT_SECRET || "",

  // Redirect URI - must match what's configured in eBay Developer Portal
  redirectUri: process.env.EBAY_REDIRECT_URI || `${process.env.NEXTAUTH_URL}/api/ebay/callback`,

  // Scopes needed for seller data
  scopes: [
    "https://api.ebay.com/oauth/api_scope",
    "https://api.ebay.com/oauth/api_scope/sell.fulfillment.readonly", // Read orders
    "https://api.ebay.com/oauth/api_scope/sell.fulfillment", // Manage orders
    "https://api.ebay.com/oauth/api_scope/sell.inventory.readonly", // Read inventory
    "https://api.ebay.com/oauth/api_scope/sell.inventory", // Manage inventory
    "https://api.ebay.com/oauth/api_scope/sell.finances", // Financial data
    "https://api.ebay.com/oauth/api_scope/sell.analytics.readonly", // Analytics
  ].join(" "),
}

export function isEbayConfigured(): boolean {
  return !!(EBAY_CONFIG.clientId && EBAY_CONFIG.clientSecret)
}
