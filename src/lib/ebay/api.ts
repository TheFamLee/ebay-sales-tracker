import { EBAY_CONFIG } from "./config"
import { getValidAccessToken } from "./auth"

/**
 * Make an authenticated request to the eBay API
 */
async function ebayFetch(
  userId: string,
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getValidAccessToken(userId)

  if (!token) {
    throw new Error("eBay account not connected or token expired")
  }

  const url = `${EBAY_CONFIG.apiBaseUrl}${endpoint}`

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-EBAY-C-MARKETPLACE-ID": "EBAY_US",
      ...options.headers,
    },
  })

  return response
}

// ============================================
// ORDERS / SALES (Fulfillment API)
// ============================================

export interface EbayOrder {
  orderId: string
  legacyOrderId: string
  creationDate: string
  buyer: {
    username: string
  }
  orderFulfillmentStatus: string
  orderPaymentStatus: string
  pricingSummary: {
    total: { value: string; currency: string }
    deliveryCost?: { value: string; currency: string }
    tax?: { value: string; currency: string }
  }
  lineItems: Array<{
    lineItemId: string
    legacyItemId: string
    title: string
    sku?: string
    quantity: number
    lineItemCost: { value: string; currency: string }
    deliveryCost?: { value: string; currency: string }
    lineItemFulfillmentStatus: string
  }>
  fulfillmentStartInstructions?: Array<{
    shippingStep?: {
      shipTo?: {
        fullName?: string
        contactAddress?: {
          city?: string
          stateOrProvince?: string
          postalCode?: string
          countryCode?: string
        }
      }
    }
  }>
}

export interface GetOrdersResponse {
  orders: EbayOrder[]
  total: number
  offset: number
  limit: number
  next?: string
}

/**
 * Get orders/sales from eBay
 * @param userId - The user's ID
 * @param options - Filter options
 */
export async function getOrders(
  userId: string,
  options: {
    limit?: number
    offset?: number
    filter?: string // e.g., "creationdate:[2024-01-01T00:00:00.000Z..]"
  } = {}
): Promise<GetOrdersResponse> {
  const params = new URLSearchParams()
  if (options.limit) params.set("limit", options.limit.toString())
  if (options.offset) params.set("offset", options.offset.toString())
  if (options.filter) params.set("filter", options.filter)

  const response = await ebayFetch(
    userId,
    `/sell/fulfillment/v1/order?${params.toString()}`
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to get orders: ${error}`)
  }

  return response.json()
}

/**
 * Get a single order by ID
 */
export async function getOrder(userId: string, orderId: string): Promise<EbayOrder> {
  const response = await ebayFetch(
    userId,
    `/sell/fulfillment/v1/order/${orderId}`
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to get order: ${error}`)
  }

  return response.json()
}

// ============================================
// ACTIVE LISTINGS (Inventory API)
// ============================================

export interface EbayInventoryItem {
  sku: string
  product?: {
    title: string
    description?: string
    imageUrls?: string[]
  }
  condition?: string
  availability?: {
    shipToLocationAvailability?: {
      quantity: number
    }
  }
}

export interface EbayOffer {
  offerId: string
  sku: string
  marketplaceId: string
  format: string
  listingDescription?: string
  availableQuantity: number
  pricingSummary: {
    price: { value: string; currency: string }
    originalRetailPrice?: { value: string; currency: string }
  }
  listing?: {
    listingId: string
  }
  status: string
}

export interface GetOffersResponse {
  offers: EbayOffer[]
  total: number
  size: number
  offset: number
  limit: number
}

/**
 * Get active offers/listings
 */
export async function getOffers(
  userId: string,
  options: {
    limit?: number
    offset?: number
    format?: string // "FIXED_PRICE" or "AUCTION"
  } = {}
): Promise<GetOffersResponse> {
  const params = new URLSearchParams()
  if (options.limit) params.set("limit", options.limit.toString())
  if (options.offset) params.set("offset", options.offset.toString())
  if (options.format) params.set("format", options.format)

  const response = await ebayFetch(
    userId,
    `/sell/inventory/v1/offer?${params.toString()}`
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to get offers: ${error}`)
  }

  return response.json()
}

/**
 * Get inventory item by SKU
 */
export async function getInventoryItem(
  userId: string,
  sku: string
): Promise<EbayInventoryItem> {
  const response = await ebayFetch(
    userId,
    `/sell/inventory/v1/inventory_item/${encodeURIComponent(sku)}`
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to get inventory item: ${error}`)
  }

  return response.json()
}

// ============================================
// FINANCES (Sell Finances API)
// ============================================

export interface EbayTransaction {
  transactionId: string
  transactionType: string
  transactionStatus: string
  amount: { value: string; currency: string }
  transactionDate: string
  orderId?: string
  references?: Array<{
    referenceId: string
    referenceType: string
  }>
  feeType?: string
}

export interface GetTransactionsResponse {
  transactions: EbayTransaction[]
  total: number
  offset: number
  limit: number
}

export interface EbayPayoutSummary {
  payoutId: string
  payoutStatus: string
  payoutStatusDescription?: string
  amount: { value: string; currency: string }
  payoutDate: string
  payoutInstrument?: {
    instrumentType: string
    nickname?: string
    accountLastFourDigits?: string
  }
}

export interface GetPayoutsResponse {
  payouts: EbayPayoutSummary[]
  total: number
  offset: number
  limit: number
}

/**
 * Get transaction history
 */
export async function getTransactions(
  userId: string,
  options: {
    limit?: number
    offset?: number
    filter?: string
  } = {}
): Promise<GetTransactionsResponse> {
  const params = new URLSearchParams()
  if (options.limit) params.set("limit", options.limit.toString())
  if (options.offset) params.set("offset", options.offset.toString())
  if (options.filter) params.set("filter", options.filter)

  const response = await ebayFetch(
    userId,
    `/sell/finances/v1/transaction?${params.toString()}`
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to get transactions: ${error}`)
  }

  return response.json()
}

/**
 * Get payout history
 */
export async function getPayouts(
  userId: string,
  options: {
    limit?: number
    offset?: number
    filter?: string
  } = {}
): Promise<GetPayoutsResponse> {
  const params = new URLSearchParams()
  if (options.limit) params.set("limit", options.limit.toString())
  if (options.offset) params.set("offset", options.offset.toString())
  if (options.filter) params.set("filter", options.filter)

  const response = await ebayFetch(
    userId,
    `/sell/finances/v1/payout?${params.toString()}`
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to get payouts: ${error}`)
  }

  return response.json()
}

// ============================================
// SELLER INFO
// ============================================

/**
 * Get the authenticated user's eBay profile
 */
export async function getSellerProfile(userId: string): Promise<{ userId: string; username?: string }> {
  // Use the Identity API to get user info
  const response = await ebayFetch(userId, "/commerce/identity/v1/user/")

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to get seller profile: ${error}`)
  }

  const data = await response.json()
  return {
    userId: data.userId,
    username: data.username,
  }
}
