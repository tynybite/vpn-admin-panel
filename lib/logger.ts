import { prisma } from "@/lib/db/prisma"

export interface LogEntry {
    adminId: string
    adminEmail: string
    action: string
    targetId?: string | null
    targetName?: string | null
    targetType: string
    details: string
    metadata?: any
}

export async function logAdminAction(
    adminId: string,
    adminEmail: string,
    action: string,
    targetType: string,
    details: string,
    targetId?: string,
    targetName?: string,
    metadata?: any
) {
    try {
        await prisma.activityLog.create({
            data: {
                adminId,
                adminEmail,
                action,
                targetType,
                targetId: targetId || null,
                targetName: targetName || null,
                details,
                metadata: metadata || null,
            },
        })
        console.log(`[Admin Log] ${action} on ${targetType}: ${details}`)
    } catch (error) {
        console.error("Failed to write admin log:", error)
        // Don't throw - logging failures shouldn't break the main operation
    }
}
