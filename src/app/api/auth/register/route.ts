import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/db/prisma"
import { z } from "zod"

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().optional(),
  inviteCode: z.string().min(1, "Invite code is required"),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name, inviteCode } = registerSchema.parse(body)

    // Validate invite code
    const invite = await prisma.inviteCode.findUnique({
      where: { code: inviteCode },
    })

    if (!invite) {
      return NextResponse.json(
        { error: "Invalid invite code" },
        { status: 400 }
      )
    }

    // Check if invite has expired
    if (invite.expiresAt && invite.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Invite code has expired" },
        { status: 400 }
      )
    }

    // Check if invite has been used up
    if (invite.uses >= invite.maxUses) {
      return NextResponse.json(
        { error: "Invite code has already been used" },
        { status: 400 }
      )
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 10)

    // Create user and update invite in a transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          passwordHash,
          name,
          role: "USER",
          twoFactorEnabled: false,
        },
      })

      // Update invite code usage
      await tx.inviteCode.update({
        where: { id: invite.id },
        data: {
          uses: { increment: 1 },
          usedById: invite.maxUses === 1 ? newUser.id : undefined,
        },
      })

      return newUser
    })

    return NextResponse.json({
      message: "User registered successfully",
      userId: user.id,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }

    console.error("Registration error:", error)
    return NextResponse.json(
      { error: "An error occurred during registration" },
      { status: 500 }
    )
  }
}
