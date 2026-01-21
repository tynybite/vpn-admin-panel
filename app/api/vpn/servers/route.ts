import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getUserFromRequest } from "@/lib/internal/permissions"

export async function GET(request: Request) {
    try {
        const user = await getUserFromRequest(request)
        const userPlan = (user?.plan as string) || "free"

        // Fetch active servers from PostgreSQL
        const servers = await prisma.server.findMany({
            where: { isActive: true },
            select: {
                id: true,
                country: true,
                name: true,
                tier: true,
                load: true,
                streaming: true,
                p2p: true,
            },
        })

        // Transform for mobile app - never expose sensitive data
        const response = servers.map((server: { id: any; country: any; name: any; tier: any; streaming: any; p2p: any; load: any }) => ({
            id: server.id,
            country: server.country || "Unknown",
            city: server.name || "Unknown",
            tier: server.tier || "free",
            features: [
                "basic",
                ...(server.streaming ? ["streaming"] : []),
                ...(server.p2p ? ["p2p"] : []),
            ],
            load: server.load || 0,
            latency: 100, // Placeholder - would be calculated dynamically
        }))

        return NextResponse.json(response)
    } catch (error) {
        console.error("Servers API Error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
