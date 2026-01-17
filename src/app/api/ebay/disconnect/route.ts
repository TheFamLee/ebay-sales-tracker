import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { disconnectEbay } from "@/lib/ebay/auth"

export async function POST() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await disconnectEbay(session.user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("eBay disconnect error:", error)
    return NextResponse.json(
      { error: "Failed to disconnect eBay account" },
      { status: 500 }
    )
  }
}
