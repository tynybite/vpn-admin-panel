import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getAdminFromRequest } from "@/lib/auth-helper"

export async function GET(request: Request) {
    try {
        const admin = await getAdminFromRequest(request)
        if (!admin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { id: admin.uid as string },
            select: { bio: true, location: true, phone: true },
        })

        // Return preferences from user record
        return NextResponse.json({
            preferences: {
                bio: user?.bio,
                location: user?.location,
                phone: user?.phone,
            }
        })
    } catch (error) {
        console.error("Error fetching preferences:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const admin = await getAdminFromRequest(request)
        if (!admin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const { preferences } = body

        if (!preferences) {
            return NextResponse.json({ error: "Missing preferences data" }, { status: 400 })
        }

        await prisma.user.update({
            where: { id: admin.uid as string },
            data: {
                bio: preferences.bio,
                location: preferences.location,
                phone: preferences.phone,
            },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error saving preferences:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
