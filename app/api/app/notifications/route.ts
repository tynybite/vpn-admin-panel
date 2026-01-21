import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"

export async function GET(request: Request) {
    try {
        // Query for the most recent notification
        const notification = await prisma.notificationLog.findFirst({
            orderBy: { sentAt: "desc" },
        })

        if (!notification) {
            return NextResponse.json({ notification: null })
        }

        // Parse body for metadata if stored as JSON
        const notificationData = {
            id: notification.id,
            title: notification.title,
            message: notification.body,
            dismissible: true,
            priority: "high",
        }

        return NextResponse.json({ notification: notificationData })
    } catch (error) {
        console.error("Error fetching latest notification:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
