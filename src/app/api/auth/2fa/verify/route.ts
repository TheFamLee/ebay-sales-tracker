import { NextRequest, NextResponse } from "next/server"
import speakeasy from "speakeasy"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import { z } from "zod"

const verifySchema = z.object({
  code: z.string().length(6, "Code must be 6 digits"),
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { code } = verifySchema.parse(body)

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user?.twoFactorSecret) {
      return NextResponse.json(
        { error: "2FA not set up" },
        { status: 400 }
      )
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token: code,
      window: 1,
    })

    if (!verified) {
      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 400 }
      )
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { twoFactorEnabled: true },
    })

    return NextResponse.json({
      message: "2FA enabled successfully",
      verified: true,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }

    console.error("2FA verification error:", error)
    return NextResponse.json(
      { error: "Failed to verify 2FA" },
      { status: 500 }
    )
  }
}
