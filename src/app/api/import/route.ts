import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import { parseExcelFile } from "@/lib/import/excel-parser"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const allowedTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ]

    if (!allowedTypes.includes(file.type) && !file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload an Excel file (.xlsx or .xls)" },
        { status: 400 }
      )
    }

    const buffer = await file.arrayBuffer()
    const parseResult = parseExcelFile(buffer)

    let salesCreated = 0
    let inventoryCreated = 0
    let depositsCreated = 0

    for (const sale of parseResult.sales) {
      let item = await prisma.item.findUnique({
        where: { itemNumber: sale.itemNumber },
      })

      if (!item) {
        item = await prisma.item.create({
          data: {
            itemNumber: sale.itemNumber,
            description: sale.description,
          },
        })
      }

      await prisma.sale.create({
        data: {
          userId: session.user.id,
          itemId: item.id,
          listedDate: sale.listedDate,
          saleDate: sale.saleDate || new Date(),
          listedPrice: sale.listedPrice,
          salePrice: sale.salePrice,
          shippingCost: sale.shippingCost,
          suppliesCost: sale.suppliesCost,
          netProfit: sale.netProfit,
          offerStartDate: sale.offerStartDate,
          offerExpirationDate: sale.offerExpirationDate,
        },
      })
      salesCreated++
    }

    for (const inventoryItem of parseResult.inventoryItems) {
      await prisma.inventoryItem.create({
        data: {
          itemNumber: inventoryItem.itemNumber,
          description: inventoryItem.description,
          minimumPrice: inventoryItem.minimumPrice,
          cost: inventoryItem.cost,
          dateAdded: inventoryItem.dateAdded || new Date(),
          userId: session.user.id,
        },
      })
      inventoryCreated++
    }

    for (const deposit of parseResult.deposits) {
      await prisma.deposit.create({
        data: {
          soldDate: deposit.soldDate,
          description: deposit.description,
          total: deposit.total,
          netProfit: deposit.netProfit,
          userId: session.user.id,
        },
      })
      depositsCreated++
    }

    return NextResponse.json({
      message: "Import completed successfully",
      results: {
        salesCreated,
        inventoryCreated,
        depositsCreated,
        errors: parseResult.errors,
      },
    })
  } catch (error) {
    console.error("Import error:", error)
    return NextResponse.json(
      { error: "Failed to import file" },
      { status: 500 }
    )
  }
}
