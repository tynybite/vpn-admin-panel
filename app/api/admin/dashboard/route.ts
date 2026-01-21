import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getUserFromRequest } from "@/lib/internal/permissions"

// Helper to check admin permission
async function checkAdmin(request: Request) {
    const user = await getUserFromRequest(request)
    if (!user || user.role !== "admin") return null
    return user
}

export async function GET(request: Request) {
    const admin = await checkAdmin(request)
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    try {
        // 1. User Counts
        const [totalUsers, activeUsers, premiumUsers] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { status: "active" } }),
            prisma.user.count({ where: { plan: "premium" } }),
        ])

        // 2. Server Counts
        const [totalServers, activeServers] = await Promise.all([
            prisma.server.count(),
            prisma.server.count({ where: { isActive: true } }),
        ])

        // 3. Recent Activity (Logs)
        const recentLogs = await prisma.activityLog.findMany({
            orderBy: { timestamp: "desc" },
            take: 5,
        })

        const recentActivity = recentLogs.map((log: { id: any; action: any; targetId: any; adminEmail: any; timestamp: { toISOString: () => any }; details: any }) => ({
            id: log.id,
            action: log.action,
            user: log.targetId || log.adminEmail || "System",
            status: (log.action || "").includes("FAIL") ? "failed" : "success",
            time: log.timestamp.toISOString(),
            details: log.details,
        }))

        // 4. Traffic/Performance (Mock for now - would come from real metrics)
        const trafficData = [
            { name: "Mon", total: Math.floor(Math.random() * 5000) + 1000 },
            { name: "Tue", total: Math.floor(Math.random() * 5000) + 1000 },
            { name: "Wed", total: Math.floor(Math.random() * 5000) + 1000 },
            { name: "Thu", total: Math.floor(Math.random() * 5000) + 1000 },
            { name: "Fri", total: Math.floor(Math.random() * 5000) + 1000 },
            { name: "Sat", total: Math.floor(Math.random() * 5000) + 1000 },
            { name: "Sun", total: Math.floor(Math.random() * 5000) + 1000 },
        ]

        return NextResponse.json({
            stats: {
                totalUsers,
                activeUsers,
                premiumUsers,
                totalServers,
                activeServers,
            },
            recentActivity,
            trafficData,
        })
    } catch (error) {
        console.error("Admin Dashboard Stats Error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
