import { NextRequest, NextResponse } from "next/server"
import speakeasy from "speakeasy"
import QRCode from "qrcode"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const secret = speakeasy.generateSecret({
      name: `eBay Sales Tracker (${session.user.email})`,
      issuer: "eBay Sales Tracker",
    })

    await prisma.user.update({
      where: { id: session.user.id },
      data: { twoFactorSecret: secret.base32 },
    })

    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url || "")

    return NextResponse.json({
      secret: secret.base32,
      qrCode: qrCodeUrl,
    })
  } catch (error) {
    console.error("2FA setup error:", error)
    return NextResponse.json(
      { error: "Failed to setup 2FA" },
      { status: 500 }
    )
  }
}
