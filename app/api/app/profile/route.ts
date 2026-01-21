import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getUserFromRequest } from "@/lib/internal/permissions"

export async function GET(request: Request) {
    try {
        const user = await getUserFromRequest(request)
        if (!user || !user.uid) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const userData = await prisma.user.findUnique({
            where: { id: user.uid as string },
        })

        if (!userData) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        // Filter and return only safe public profile data
        const profile = {
            uid: userData.id,
            email: userData.email,
            displayName: userData.displayName,
            plan: userData.plan || "free",
            status: userData.status || "active",
            createdAt: userData.createdAt?.toISOString(),
        }

        return NextResponse.json(profile)
    } catch (error) {
        console.error("Error fetching profile:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

export async function PUT(request: Request) {
    try {
        const user = await getUserFromRequest(request)
        if (!user || !user.uid) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const { bio, location, phone, displayName, photoURL } = body

        // Validate if needed

        const updatedUser = await prisma.user.update({
            where: { id: user.uid as string },
            data: {
                bio: bio !== undefined ? bio : undefined,
                location: location !== undefined ? location : undefined,
                phone: phone !== undefined ? phone : undefined,
                displayName: displayName !== undefined ? displayName : undefined,
                photoURL: photoURL !== undefined ? photoURL : undefined,
            },
        })

        return NextResponse.json({ success: true, user: updatedUser })
    } catch (error) {
        console.error("Error updating profile:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
    try {
        const user = await getUserFromRequest(request)
        if (!user || !user.uid) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Soft delete: Update status to 'deleted'
        await prisma.user.update({
            where: { id: user.uid as string },
            data: { status: "deleted" },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error deleting profile:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
