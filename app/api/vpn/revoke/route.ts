import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getUserFromRequest } from "@/lib/internal/permissions"

export async function POST(request: Request) {
    try {
        const user = await getUserFromRequest(request)
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { sessionId } = await request.json()
        if (!sessionId) {
            return NextResponse.json({ error: "Missing Session ID" }, { status: 400 })
        }

        const session = await prisma.vpnSession.findUnique({
            where: { sessionId },
        })

        if (!session) {
            return NextResponse.json({ error: "Session NOT found" }, { status: 404 })
        }

        // Only owner or admin can revoke
        if (session.userId !== user.uid && user.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        await prisma.vpnSession.update({
            where: { sessionId },
            data: { revoked: true },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("VPN Revoke Error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
