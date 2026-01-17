import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const search = searchParams.get("search") || ""
    const sortBy = searchParams.get("sortBy") || "saleDate"
    const sortOrder = searchParams.get("sortOrder") || "desc"

    const skip = (page - 1) * limit

    const where = {
      userId: session.user.id,
      ...(search && {
        OR: [
          { item: { description: { contains: search, mode: "insensitive" as const } } },
          { item: { itemNumber: { contains: search, mode: "insensitive" as const } } },
        ],
      }),
    }

    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        include: {
          item: true,
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
      prisma.sale.count({ where }),
    ])

    return NextResponse.json({
      sales,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching sales:", error)
    return NextResponse.json(
      { error: "Failed to fetch sales" },
      { status: 500 }
    )
  }
}
