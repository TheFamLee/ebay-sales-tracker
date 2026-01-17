import { prisma } from "@/lib/db/prisma"
import { getOrders, getOffers, getPayouts, getTransactions, EbayOrder } from "./api"

interface SyncResult {
  ordersImported: number
  ordersUpdated: number
  listingsImported: number
  listingsUpdated: number
  payoutsImported: number
  errors: string[]
}

/**
 * Sync all eBay data for a user
 */
export async function syncAllEbayData(userId: string): Promise<SyncResult> {
  const result: SyncResult = {
    ordersImported: 0,
    ordersUpdated: 0,
    listingsImported: 0,
    listingsUpdated: 0,
    payoutsImported: 0,
    errors: [],
  }

  // Sync orders
  try {
    const orderResult = await syncOrders(userId)
    result.ordersImported = orderResult.imported
    result.ordersUpdated = orderResult.updated
  } catch (error) {
    result.errors.push(`Orders sync failed: ${error instanceof Error ? error.message : "Unknown error"}`)
  }

  // Sync active listings
  try {
    const listingResult = await syncListings(userId)
    result.listingsImported = listingResult.imported
    result.listingsUpdated = listingResult.updated
  } catch (error) {
    result.errors.push(`Listings sync failed: ${error instanceof Error ? error.message : "Unknown error"}`)
  }

  // Sync payouts
  try {
    const payoutResult = await syncPayouts(userId)
    result.payoutsImported = payoutResult.imported
  } catch (error) {
    result.errors.push(`Payouts sync failed: ${error instanceof Error ? error.message : "Unknown error"}`)
  }

  return result
}

/**
 * Sync orders from eBay
 */
export async function syncOrders(
  userId: string,
  options: { daysBack?: number } = {}
): Promise<{ imported: number; updated: number }> {
  const daysBack = options.daysBack || 90 // Default to last 90 days
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - daysBack)

  let imported = 0
  let updated = 0
  let offset = 0
  const limit = 50
  let hasMore = true

  while (hasMore) {
    const filter = `creationdate:[${startDate.toISOString()}..]`
    const response = await getOrders(userId, { limit, offset, filter })

    for (const order of response.orders) {
      const result = await upsertEbayOrder(userId, order)
      if (result.created) imported++
      else updated++
    }

    offset += limit
    hasMore = response.orders.length === limit
  }

  return { imported, updated }
}

/**
 * Upsert a single eBay order
 */
async function upsertEbayOrder(
  userId: string,
  order: EbayOrder
): Promise<{ created: boolean }> {
  // Calculate fees from transactions (if available)
  const ebayFees = 0 // Would need to match with transactions

  // Get the first line item for main item details
  const mainItem = order.lineItems[0]

  const orderData = {
    userId,
    orderId: order.orderId,
    legacyOrderId: order.legacyOrderId,
    buyerUsername: order.buyer?.username,
    itemId: mainItem?.legacyItemId,
    title: mainItem?.title || "Unknown Item",
    sku: mainItem?.sku,
    quantity: mainItem?.quantity || 1,
    itemPrice: parseFloat(mainItem?.lineItemCost?.value || "0"),
    shippingCost: parseFloat(order.pricingSummary?.deliveryCost?.value || "0"),
    salesTax: parseFloat(order.pricingSummary?.tax?.value || "0"),
    ebayFees,
    totalAmount: parseFloat(order.pricingSummary?.total?.value || "0"),
    orderDate: new Date(order.creationDate),
    orderStatus: mapOrderStatus(order.orderFulfillmentStatus, order.orderPaymentStatus),
    rawOrderData: JSON.stringify(order),
  }

  const existing = await prisma.ebaySale.findUnique({
    where: { orderId: order.orderId },
  })

  if (existing) {
    await prisma.ebaySale.update({
      where: { orderId: order.orderId },
      data: orderData,
    })
    return { created: false }
  } else {
    await prisma.ebaySale.create({
      data: orderData,
    })
    return { created: true }
  }
}

/**
 * Map eBay order status to our simplified status
 */
function mapOrderStatus(fulfillmentStatus: string, paymentStatus: string): string {
  if (fulfillmentStatus === "FULFILLED") return "DELIVERED"
  if (fulfillmentStatus === "IN_PROGRESS") return "SHIPPED"
  if (paymentStatus === "PAID") return "PAID"
  if (paymentStatus === "PENDING") return "PENDING"
  return "PENDING"
}

/**
 * Sync active listings from eBay
 */
export async function syncListings(
  userId: string
): Promise<{ imported: number; updated: number }> {
  let imported = 0
  let updated = 0
  let offset = 0
  const limit = 50
  let hasMore = true

  while (hasMore) {
    const response = await getOffers(userId, { limit, offset })

    for (const offer of response.offers) {
      const listingData = {
        userId,
        listingId: offer.listing?.listingId || offer.offerId,
        title: offer.listingDescription || `SKU: ${offer.sku}`,
        sku: offer.sku,
        currentPrice: parseFloat(offer.pricingSummary?.price?.value || "0"),
        originalPrice: offer.pricingSummary?.originalRetailPrice
          ? parseFloat(offer.pricingSummary.originalRetailPrice.value)
          : null,
        quantityAvailable: offer.availableQuantity,
        status: offer.status === "ACTIVE" ? "ACTIVE" : "ENDED",
        startDate: new Date(), // Would need actual start date from listing details
      }

      const existing = await prisma.ebayListing.findUnique({
        where: { listingId: listingData.listingId },
      })

      if (existing) {
        await prisma.ebayListing.update({
          where: { listingId: listingData.listingId },
          data: listingData,
        })
        updated++
      } else {
        await prisma.ebayListing.create({
          data: listingData,
        })
        imported++
      }
    }

    offset += limit
    hasMore = response.offers.length === limit
  }

  return { imported, updated }
}

/**
 * Sync payouts from eBay
 */
export async function syncPayouts(
  userId: string,
  options: { daysBack?: number } = {}
): Promise<{ imported: number }> {
  const daysBack = options.daysBack || 90
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - daysBack)

  let imported = 0
  let offset = 0
  const limit = 50
  let hasMore = true

  while (hasMore) {
    const filter = `payoutDate:[${startDate.toISOString()}..]`
    const response = await getPayouts(userId, { limit, offset, filter })

    for (const payout of response.payouts) {
      const existing = await prisma.ebayPayout.findUnique({
        where: { payoutId: payout.payoutId },
      })

      if (!existing) {
        await prisma.ebayPayout.create({
          data: {
            userId,
            payoutId: payout.payoutId,
            amount: parseFloat(payout.amount?.value || "0"),
            payoutDate: new Date(payout.payoutDate),
            payoutStatus: payout.payoutStatus,
            bankAccountLast4: payout.payoutInstrument?.accountLastFourDigits,
          },
        })
        imported++
      }
    }

    offset += limit
    hasMore = response.payouts.length === limit
  }

  return { imported }
}

/**
 * Update eBay fees for orders by matching with transactions
 */
export async function syncFeesForOrders(userId: string): Promise<number> {
  let updated = 0

  // Get orders without fees
  const ordersWithoutFees = await prisma.ebaySale.findMany({
    where: {
      userId,
      ebayFees: 0,
    },
    select: {
      id: true,
      orderId: true,
    },
  })

  // Get transactions
  const transactions = await getTransactions(userId, { limit: 200 })

  // Match transactions to orders
  for (const order of ordersWithoutFees) {
    const orderTransactions = transactions.transactions.filter(
      (t) => t.orderId === order.orderId && t.transactionType === "SALE"
    )

    if (orderTransactions.length > 0) {
      // Sum up fees
      const fees = transactions.transactions
        .filter(
          (t) =>
            t.references?.some((r) => r.referenceId === order.orderId) &&
            (t.transactionType === "NON_SALE_CHARGE" || t.feeType)
        )
        .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount?.value || "0")), 0)

      if (fees > 0) {
        await prisma.ebaySale.update({
          where: { id: order.id },
          data: { ebayFees: fees },
        })
        updated++
      }
    }
  }

  return updated
}
