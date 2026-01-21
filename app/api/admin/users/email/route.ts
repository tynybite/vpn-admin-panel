import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getAdminFromRequest } from "@/lib/auth-helper"
import { sendCustomEmail } from "@/lib/email-service"

export async function POST(request: Request) {
    try {
        const isAdmin = await getAdminFromRequest(request)
        if (!isAdmin) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const body = await request.json()
        const { uid, subject, message } = body

        if (!uid || !subject || !message) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        const user = await prisma.user.findUnique({
            where: { id: uid },
        })

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        const email = user.email

        if (!email) {
            return NextResponse.json({ error: "User does not have an email address" }, { status: 400 })
        }

        await sendCustomEmail(email, subject, message)

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error("Error sending custom email:", error)
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
    }
}
