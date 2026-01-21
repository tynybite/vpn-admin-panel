import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getAdminFromRequest } from "@/lib/auth-helper"

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const admin = await getAdminFromRequest(request)
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    try {
        const { id } = await params

        if (!id) {
            return NextResponse.json({ error: "Notification ID is required" }, { status: 400 })
        }

        await prisma.notificationLog.delete({
            where: { id },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error deleting notification:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
