import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getAdminFromRequest } from "@/lib/auth-helper"

export async function GET(request: Request) {
    const admin = await getAdminFromRequest(request)
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    try {
        const { searchParams } = new URL(request.url)
        const limit = parseInt(searchParams.get("limit") || "50")
        const action = searchParams.get("action")
        const adminEmail = searchParams.get("admin")
        const fromDate = searchParams.get("from")
        const toDate = searchParams.get("to")
        const cursor = searchParams.get("cursor")

        // Build WHERE clause
        const where: any = {}

        if (action && action !== "all") {
            where.action = action
        }

        if (adminEmail && adminEmail !== "all") {
            where.adminEmail = adminEmail
        }

        if (fromDate) {
            where.timestamp = { ...where.timestamp, gte: new Date(fromDate) }
        }

        if (toDate) {
            const end = new Date(toDate)
            end.setDate(end.getDate() + 1)
            where.timestamp = { ...where.timestamp, lte: end }
        }

        // Cursor-based pagination
        let cursorObj: any = undefined
        if (cursor) {
            cursorObj = { id: cursor }
        }

        // Fetch limit + 1 to check if there are more
        const logs = await prisma.activityLog.findMany({
            where,
            orderBy: { timestamp: "desc" },
            take: limit + 1,
            ...(cursorObj ? { cursor: cursorObj, skip: 1 } : {}),
        })

        const hasMore = logs.length > limit
        const resultLogs = hasMore ? logs.slice(0, limit) : logs

        // Transform for response
        const formattedLogs = resultLogs.map((log: { id: any; adminId: any; adminEmail: any; action: any; targetType: any; targetId: any; targetName: any; details: any; metadata: any; timestamp: { toISOString: () => any } }) => ({
            id: log.id,
            adminId: log.adminId,
            adminEmail: log.adminEmail,
            action: log.action,
            targetType: log.targetType,
            targetId: log.targetId,
            targetName: log.targetName,
            details: log.details,
            metadata: log.metadata,
            timestamp: log.timestamp.toISOString(),
        }))

        const lastLog = resultLogs[resultLogs.length - 1]
        const nextCursor = hasMore && lastLog ? lastLog.id : null

        return NextResponse.json({ logs: formattedLogs, nextCursor, hasMore })
    } catch (error) {
        console.error("Error fetching logs:", error)
        return NextResponse.json({
            error: error instanceof Error ? error.message : "Internal Server Error"
        }, { status: 500 })
    }
}
