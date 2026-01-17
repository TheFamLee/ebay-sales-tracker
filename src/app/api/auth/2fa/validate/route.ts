import { NextRequest, NextResponse } from "next/server"
import speakeasy from "speakeasy"
import { prisma } from "@/lib/db/prisma"
import { z } from "zod"

const validateSchema = z.object({
  userId: z.string(),
  code: z.string().length(6, "Code must be 6 digits"),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, code } = validateSchema.parse(body)

    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user?.twoFactorSecret) {
      return NextResponse.json(
        { error: "2FA not enabled for this user" },
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

    return NextResponse.json({
      verified: true,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }

    console.error("2FA validation error:", error)
    return NextResponse.json(
      { error: "Failed to validate 2FA" },
      { status: 500 }
    )
  }
}
