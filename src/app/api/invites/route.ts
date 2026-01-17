import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import { nanoid } from "nanoid"

// GET - List all invite codes created by the user
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const invites = await prisma.inviteCode.findMany({
      where: { createdById: session.user.id },
      include: {
        usedBy: {
          select: { email: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ invites })
  } catch (error) {
    console.error("Error fetching invites:", error)
    return NextResponse.json(
      { error: "Failed to fetch invites" },
      { status: 500 }
    )
  }
}

// POST - Create a new invite code
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { maxUses = 1, expiresInDays } = body

    const code = nanoid(12) // Generate a 12-character unique code

    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null

    const invite = await prisma.inviteCode.create({
      data: {
        code,
        createdById: session.user.id,
        maxUses,
        expiresAt,
      },
    })

    return NextResponse.json({
      invite,
      inviteUrl: `${process.env.NEXTAUTH_URL}/auth/register?code=${code}`,
    })
  } catch (error) {
    console.error("Error creating invite:", error)
    return NextResponse.json(
      { error: "Failed to create invite" },
      { status: 500 }
    )
  }
}

// DELETE - Delete an invite code
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Invite ID required" }, { status: 400 })
    }

    // Verify the invite belongs to the user
    const invite = await prisma.inviteCode.findUnique({
      where: { id },
    })

    if (!invite || invite.createdById !== session.user.id) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 })
    }

    await prisma.inviteCode.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Invite deleted" })
  } catch (error) {
    console.error("Error deleting invite:", error)
    return NextResponse.json(
      { error: "Failed to delete invite" },
      { status: 500 }
    )
  }
}
