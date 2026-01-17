import * as XLSX from "xlsx"

export interface ParsedSale {
  itemNumber: string
  description: string
  listedPrice: number
  salePrice: number
  shippingCost: number
  suppliesCost: number
  netProfit: number
  listedDate: Date | null
  saleDate: Date | null
  offerStartDate: Date | null
  offerExpirationDate: Date | null
}

export interface ParsedInventoryItem {
  itemNumber: string | null
  description: string
  minimumPrice: number | null
  cost: number | null
  dateAdded: Date | null
}

export interface ParsedDeposit {
  soldDate: Date
  description: string
  total: number
  netProfit: number | null
}

export interface ParseResult {
  sales: ParsedSale[]
  inventoryItems: ParsedInventoryItem[]
  deposits: ParsedDeposit[]
  errors: string[]
}

function parseDate(value: unknown): Date | null {
  if (!value) return null

  if (value instanceof Date) return value

  if (typeof value === "number") {
    const excelDate = XLSX.SSF.parse_date_code(value)
    if (excelDate) {
      return new Date(excelDate.y, excelDate.m - 1, excelDate.d)
    }
  }

  if (typeof value === "string") {
    const date = new Date(value)
    if (!isNaN(date.getTime())) return date
  }

  return null
}

function parseNumber(value: unknown): number {
  if (typeof value === "number") return value
  if (typeof value === "string") {
    const cleaned = value.replace(/[$,]/g, "").trim()
    const num = parseFloat(cleaned)
    return isNaN(num) ? 0 : num
  }
  return 0
}

function findColumnIndex(headers: unknown[], possibleNames: string[]): number {
  for (let i = 0; i < headers.length; i++) {
    const header = (headers[i] || "").toString().toLowerCase().trim()
    for (const name of possibleNames) {
      if (header.includes(name.toLowerCase())) {
        return i
      }
    }
  }
  return -1
}

function findHeaderRow(data: unknown[][]): number {
  // Look for a row that contains typical header names
  const headerKeywords = ["item #", "description", "date", "price", "sold"]

  for (let i = 0; i < Math.min(10, data.length); i++) {
    const row = data[i]
    if (!row) continue

    const rowText = row.map(cell => String(cell || "").toLowerCase()).join(" ")
    let matchCount = 0
    for (const keyword of headerKeywords) {
      if (rowText.includes(keyword)) matchCount++
    }
    if (matchCount >= 2) return i
  }
  return 0
}

// Parse the Ebay sales sheets with your specific format
export function parseEbaySalesSheet(worksheet: XLSX.WorkSheet): ParsedSale[] {
  const sales: ParsedSale[] = []
  const data = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1 })

  if (data.length < 2) return sales

  // Find header row (in your spreadsheet it's row 3)
  const headerRowIdx = findHeaderRow(data)
  const headers = data[headerRowIdx] || []

  // Column mappings for your specific format
  // Your spreadsheet has: item #, Description, 90 Day Total, ..., Date, Sale, Discounted, Shipping, Sale Tax, ...
  const itemNumIdx = findColumnIndex(headers, ["item #", "item number"])
  const descIdx = findColumnIndex(headers, ["description"])
  const listedDateIdx = findColumnIndex(headers, ["dated listed", "date listed"])
  const priceIdx = findColumnIndex(headers, ["price"])

  // The sale data is in columns starting around index 21
  // Find the "Date" column that's after "Date Offer Expires" - it's the sale date
  let saleDateIdx = -1
  let salePriceIdx = -1
  let shippingIdx = -1
  let netSalesIdx = -1
  let suppliesIdx = -1

  // Find columns by position after "Date Offer Expires"
  for (let i = 0; i < headers.length; i++) {
    const h = String(headers[i] || "").toLowerCase().trim()
    if (h === "date" && i > 15) {
      saleDateIdx = i
    }
    if (h === "sale" && i > 15) {
      salePriceIdx = i
    }
    if (h === "shipping" && i > 15) {
      shippingIdx = i
    }
    if (h === "net sales" || h === "net profit") {
      netSalesIdx = i
    }
    if (h === "supplies") {
      suppliesIdx = i
    }
  }

  // Parse data rows (starting after headers)
  for (let i = headerRowIdx + 1; i < data.length; i++) {
    const row = data[i]
    if (!row || row.length === 0) continue

    const itemNumber = itemNumIdx >= 0 ? String(row[itemNumIdx] || "").trim() : ""
    const description = descIdx >= 0 ? String(row[descIdx] || "").trim() : ""

    // Skip rows without item number/description or non-sale rows
    if (!itemNumber && !description) continue

    // Check if this is a sold item (has "Sold" in status column or has sale data)
    const statusIdx = findColumnIndex(headers, ["active", "description"])
    const status = statusIdx >= 4 ? String(row[statusIdx] || "").toLowerCase() : ""

    // Get the sub-total or 90 day total which indicates a sale
    const subTotalIdx = findColumnIndex(headers, ["sub total", "90 day total"])
    const subTotal = subTotalIdx >= 0 ? parseNumber(row[subTotalIdx]) : 0

    // Skip if not a sold item (no sale amount)
    if (subTotal === 0 && status !== "sold") continue

    // Skip cancelled, payment, error, or purchase rows
    if (status === "cancel" || status === "error") continue
    if (description.toLowerCase().includes("payment")) continue
    if (description.toLowerCase().includes("purchase")) continue
    if (description.toLowerCase().includes("refund")) continue
    if (description.toLowerCase().includes("shipping label error")) continue
    if (description.toLowerCase().includes("ups shipping")) continue

    const listedPrice = priceIdx >= 0 ? parseNumber(row[priceIdx]) : 0
    const salePrice = salePriceIdx >= 0 ? parseNumber(row[salePriceIdx]) : listedPrice
    const shippingCost = shippingIdx >= 0 ? parseNumber(row[shippingIdx]) : 0
    const suppliesCost = suppliesIdx >= 0 ? parseNumber(row[suppliesIdx]) : 0
    const netProfit = netSalesIdx >= 0 ? parseNumber(row[netSalesIdx]) : subTotal

    const listedDate = listedDateIdx >= 0 ? parseDate(row[listedDateIdx]) : null
    const saleDate = saleDateIdx >= 0 ? parseDate(row[saleDateIdx]) : new Date()

    // Get offer dates
    const offerStartIdx = findColumnIndex(headers, ["date offer starts"])
    const offerExpIdx = findColumnIndex(headers, ["date offer expires"])

    sales.push({
      itemNumber: itemNumber || `ITEM-${i}`,
      description: description || "Unknown Item",
      listedPrice,
      salePrice: salePrice || listedPrice,
      shippingCost,
      suppliesCost,
      netProfit: netProfit || subTotal,
      listedDate,
      saleDate,
      offerStartDate: offerStartIdx >= 0 ? parseDate(row[offerStartIdx]) : null,
      offerExpirationDate: offerExpIdx >= 0 ? parseDate(row[offerExpIdx]) : null,
    })
  }

  return sales
}

export function parseInventorySheet(worksheet: XLSX.WorkSheet): ParsedInventoryItem[] {
  const items: ParsedInventoryItem[] = []
  const data = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1 })

  if (data.length < 2) return items

  const headerRowIdx = findHeaderRow(data)
  const headers = data[headerRowIdx] || []

  const itemNumIdx = findColumnIndex(headers, ["item #", "item number"])
  const descIdx = findColumnIndex(headers, ["description"])
  const minPriceIdx = findColumnIndex(headers, ["minimum internet price", "minimum", "min price"])
  const costIdx = findColumnIndex(headers, ["cost"])
  const dateIdx = findColumnIndex(headers, ["date"])
  const soldIdx = findColumnIndex(headers, ["sold"])

  for (let i = headerRowIdx + 1; i < data.length; i++) {
    const row = data[i]
    if (!row || row.length === 0) continue

    const description = descIdx >= 0 ? String(row[descIdx] || "").trim() : ""
    if (!description) continue

    // Skip if already sold
    const sold = soldIdx >= 0 ? String(row[soldIdx] || "").trim().toLowerCase() : ""
    if (sold === "yes" || sold === "sold" || sold === "x") continue

    items.push({
      itemNumber: itemNumIdx >= 0 ? String(row[itemNumIdx] || "").trim() || null : null,
      description,
      minimumPrice: minPriceIdx >= 0 ? parseNumber(row[minPriceIdx]) || null : null,
      cost: costIdx >= 0 ? parseNumber(row[costIdx]) || null : null,
      dateAdded: dateIdx >= 0 ? parseDate(row[dateIdx]) : new Date(),
    })
  }

  return items
}

export function parseDepositSheet(worksheet: XLSX.WorkSheet): ParsedDeposit[] {
  const deposits: ParsedDeposit[] = []
  const data = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1 })

  if (data.length < 2) return deposits

  const headerRowIdx = findHeaderRow(data)
  const headers = data[headerRowIdx] || []

  const dateIdx = findColumnIndex(headers, ["sold date", "date"])
  const descIdx = findColumnIndex(headers, ["description"])
  const totalIdx = findColumnIndex(headers, ["total"])
  const netIdx = findColumnIndex(headers, ["net profit", "net"])

  for (let i = headerRowIdx + 1; i < data.length; i++) {
    const row = data[i]
    if (!row || row.length === 0) continue

    const description = descIdx >= 0 ? String(row[descIdx] || "").trim() : ""
    const total = totalIdx >= 0 ? parseNumber(row[totalIdx]) : 0

    if (!description || total === 0) continue

    deposits.push({
      soldDate: dateIdx >= 0 && parseDate(row[dateIdx]) ? parseDate(row[dateIdx])! : new Date(),
      description,
      total,
      netProfit: netIdx >= 0 ? parseNumber(row[netIdx]) || null : null,
    })
  }

  return deposits
}

// Parse "Sold by me" sheet format
export function parseSoldByMeSheet(worksheet: XLSX.WorkSheet): ParsedSale[] {
  const sales: ParsedSale[] = []
  const data = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1 })

  if (data.length < 2) return sales

  const headerRowIdx = findHeaderRow(data)
  const headers = data[headerRowIdx] || []

  const itemNumIdx = findColumnIndex(headers, ["item #", "item number"])
  const descIdx = findColumnIndex(headers, ["description"])
  const costIdx = findColumnIndex(headers, ["cost"])
  const soldIdx = findColumnIndex(headers, ["sold"])
  const dateIdx = findColumnIndex(headers, ["date"])

  for (let i = headerRowIdx + 1; i < data.length; i++) {
    const row = data[i]
    if (!row || row.length === 0) continue

    const description = descIdx >= 0 ? String(row[descIdx] || "").trim() : ""
    if (!description) continue

    // Check if sold
    const soldValue = soldIdx >= 0 ? parseNumber(row[soldIdx]) : 0
    if (soldValue === 0) continue

    const cost = costIdx >= 0 ? parseNumber(row[costIdx]) : 0

    sales.push({
      itemNumber: itemNumIdx >= 0 ? String(row[itemNumIdx] || "").trim() : `ITEM-${i}`,
      description,
      listedPrice: soldValue,
      salePrice: soldValue,
      shippingCost: 0,
      suppliesCost: cost,
      netProfit: soldValue - cost,
      listedDate: dateIdx >= 0 ? parseDate(row[dateIdx]) : null,
      saleDate: dateIdx >= 0 ? parseDate(row[dateIdx]) : new Date(),
      offerStartDate: null,
      offerExpirationDate: null,
    })
  }

  return sales
}

export function parseExcelFile(buffer: ArrayBuffer): ParseResult {
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true })
  const result: ParseResult = {
    sales: [],
    inventoryItems: [],
    deposits: [],
    errors: [],
  }

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName]
    const lowerName = sheetName.toLowerCase()

    try {
      // Parse eBay sales sheets (Ebay 2025, Ebay 2026, etc.)
      if (lowerName.includes("ebay") && lowerName.includes("202")) {
        const sales = parseEbaySalesSheet(worksheet)
        result.sales.push(...sales)
      }

      // Parse "Sold by me" sheet
      if (lowerName.includes("sold by me")) {
        const sales = parseSoldByMeSheet(worksheet)
        result.sales.push(...sales)
      }

      // Parse inventory sheet
      if (lowerName.includes("items to sell") || lowerName.includes("inventory")) {
        const items = parseInventorySheet(worksheet)
        result.inventoryItems.push(...items)
      }

      // Parse USB/deposit sheet
      if (lowerName.includes("usb") || lowerName.includes("deposit")) {
        const deposits = parseDepositSheet(worksheet)
        result.deposits.push(...deposits)
      }
    } catch (error) {
      result.errors.push(`Error parsing sheet "${sheetName}": ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  return result
}
