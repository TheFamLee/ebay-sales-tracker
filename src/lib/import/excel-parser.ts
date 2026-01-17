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

function findColumnIndex(headers: string[], possibleNames: string[]): number {
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

export function parseEbaySalesSheet(worksheet: XLSX.WorkSheet): ParsedSale[] {
  const sales: ParsedSale[] = []
  const data = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1 })

  if (data.length < 2) return sales

  const headers = (data[0] || []).map((h) => String(h || ""))

  const itemNumIdx = findColumnIndex(headers, ["item #", "item number", "item"])
  const descIdx = findColumnIndex(headers, ["description", "desc", "item description"])
  const listedPriceIdx = findColumnIndex(headers, ["listed price", "list price", "asking"])
  const salePriceIdx = findColumnIndex(headers, ["sale price", "sold price", "sold for", "price"])
  const shippingIdx = findColumnIndex(headers, ["shipping", "ship cost", "shipping cost"])
  const suppliesIdx = findColumnIndex(headers, ["supplies", "supplies cost", "cost"])
  const netIdx = findColumnIndex(headers, ["net", "net sales", "net profit", "profit"])
  const listedDateIdx = findColumnIndex(headers, ["date listed", "listed date", "list date"])
  const saleDateIdx = findColumnIndex(headers, ["date sold", "sold date", "sale date"])
  const offerStartIdx = findColumnIndex(headers, ["offer start", "offer begins"])
  const offerExpIdx = findColumnIndex(headers, ["offer exp", "offer expiration", "offer ends"])

  for (let i = 1; i < data.length; i++) {
    const row = data[i]
    if (!row || row.length === 0) continue

    const itemNumber = itemNumIdx >= 0 ? String(row[itemNumIdx] || "").trim() : ""
    const description = descIdx >= 0 ? String(row[descIdx] || "").trim() : ""

    if (!itemNumber && !description) continue

    const listedPrice = listedPriceIdx >= 0 ? parseNumber(row[listedPriceIdx]) : 0
    const salePrice = salePriceIdx >= 0 ? parseNumber(row[salePriceIdx]) : 0

    if (listedPrice === 0 && salePrice === 0) continue

    sales.push({
      itemNumber: itemNumber || `ITEM-${i}`,
      description: description || "Unknown Item",
      listedPrice,
      salePrice,
      shippingCost: shippingIdx >= 0 ? parseNumber(row[shippingIdx]) : 0,
      suppliesCost: suppliesIdx >= 0 ? parseNumber(row[suppliesIdx]) : 0,
      netProfit: netIdx >= 0 ? parseNumber(row[netIdx]) : salePrice - parseNumber(row[suppliesIdx] || 0),
      listedDate: listedDateIdx >= 0 ? parseDate(row[listedDateIdx]) : null,
      saleDate: saleDateIdx >= 0 ? parseDate(row[saleDateIdx]) : new Date(),
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

  const headers = (data[0] || []).map((h) => String(h || ""))

  const itemNumIdx = findColumnIndex(headers, ["item #", "item number", "item"])
  const descIdx = findColumnIndex(headers, ["description", "desc"])
  const minPriceIdx = findColumnIndex(headers, ["minimum", "min price", "internet price"])
  const costIdx = findColumnIndex(headers, ["cost"])
  const dateIdx = findColumnIndex(headers, ["date"])

  for (let i = 1; i < data.length; i++) {
    const row = data[i]
    if (!row || row.length === 0) continue

    const description = descIdx >= 0 ? String(row[descIdx] || "").trim() : ""
    if (!description) continue

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

  const headers = (data[0] || []).map((h) => String(h || ""))

  const dateIdx = findColumnIndex(headers, ["sold date", "date"])
  const descIdx = findColumnIndex(headers, ["description", "desc"])
  const totalIdx = findColumnIndex(headers, ["total"])
  const netIdx = findColumnIndex(headers, ["net profit", "net"])

  for (let i = 1; i < data.length; i++) {
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
      if (lowerName.includes("ebay") || lowerName.includes("202") || lowerName.includes("sold")) {
        if (!lowerName.includes("sold by me") && !lowerName.includes("usb")) {
          const sales = parseEbaySalesSheet(worksheet)
          result.sales.push(...sales)
        }
      }

      if (lowerName.includes("items to sell") || lowerName.includes("inventory")) {
        const items = parseInventorySheet(worksheet)
        result.inventoryItems.push(...items)
      }

      if (lowerName.includes("sold by me")) {
        const sales = parseEbaySalesSheet(worksheet)
        result.sales.push(...sales)
      }

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
