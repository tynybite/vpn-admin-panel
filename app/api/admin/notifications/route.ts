import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { adminMessaging } from "@/lib/internal/firebase"
import { getAdminFromRequest } from "@/lib/auth-helper"

export async function GET(request: Request) {
    const adminPerm = await getAdminFromRequest(request)
    if (!adminPerm) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    try {
        const notifications = await prisma.notificationLog.findMany({
            orderBy: { sentAt: "desc" },
        })

        const formatted = notifications.map((n: { id: any; type: any; title: any; body: any; targetUsers: any; sentBy: any; sentAt: { toLocaleString: () => any }; success: any; failed: any }) => ({
            id: n.id,
            type: n.type,
            title: n.title,
            body: n.body,
            targetUsers: n.targetUsers,
            sentBy: n.sentBy,
            sentAt: n.sentAt.toLocaleString(),
            success: n.success,
            failed: n.failed,
        }))

        return NextResponse.json({ notifications: formatted })
    } catch (error) {
        console.error("Error fetching notifications:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

export async function POST(request: Request) {
    const adminPerm = await getAdminFromRequest(request)
    if (!adminPerm) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    try {
        const {
            title,
            message,
            target,
            scheduleDate,
            scheduleTime,
            image_url,
            cta_text,
            cta_url,
            dismissible = true,
            min_version,
            max_version,
            priority = "high"
        } = await request.json()

        if (!title || !message) {
            return NextResponse.json({ error: "Title and message are required" }, { status: 400 })
        }

        // Determine target topic
        let topic = "all"
        switch (target) {
            case "premium": topic = "premium"; break
            case "free": topic = "free"; break
            default: topic = "all"
        }

        // Construct FCM message
        const fcmMessage = {
            notification: { title, body: message },
            android: {
                priority: (priority === "high" ? "high" : "normal") as "high" | "normal",
            },
            apns: {
                payload: { aps: { contentAvailable: true } },
                headers: { "apns-priority": priority === "high" ? "10" : "5" },
            },
            topic: topic,
            data: {
                click_action: "FLUTTER_NOTIFICATION_CLICK",
                target: target,
                ...(image_url && { image_url }),
                ...(cta_text && { cta_text }),
                ...(cta_url && { cta_url }),
                dismissible: String(dismissible),
                ...(min_version && { min_version }),
                ...(max_version && { max_version }),
                priority
            }
        }

        let messageId = ""
        let status = "sent"

        if (!scheduleDate) {
            messageId = await adminMessaging.send(fcmMessage)
        } else {
            status = "scheduled"
        }

        // Save to PostgreSQL
        const notification = await prisma.notificationLog.create({
            data: {
                type: scheduleDate ? "scheduled" : "broadcast",
                title,
                body: message,
                targetUsers: [target],
                sentBy: adminPerm.email || adminPerm.uid,
                sentAt: scheduleDate
                    ? new Date(`${scheduleDate} ${scheduleTime}`)
                    : new Date(),
                success: status === "sent" ? 1 : 0,
                failed: 0,
            },
        })

        return NextResponse.json({
            success: true,
            id: notification.id,
            messageId
        })
    } catch (error) {
        console.error("Error sending notification:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
