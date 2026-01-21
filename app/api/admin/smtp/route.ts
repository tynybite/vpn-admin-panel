import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getAdminFromRequest } from "@/lib/auth-helper"

export async function GET(request: Request) {
    try {
        const isAdmin = await getAdminFromRequest(request)

        const setting = await prisma.appSetting.findUnique({
            where: { key: "smtp" },
        })

        if (!setting) {
            return NextResponse.json({})
        }

        const data = setting.value as any

        if (!isAdmin) {
            // Mask sensitive data for non-admins
            return NextResponse.json({
                host: data.host,
                port: data.port,
                username: data.username ? "********" : "",
                password: data.password ? "********" : "",
                encryption: data.encryption,
                fromEmail: data.fromEmail,
                fromName: data.fromName,
                isConfigured: true
            })
        }

        return NextResponse.json(data)
    } catch (error) {
        console.error("Error fetching SMTP config:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const isAdmin = await getAdminFromRequest(request)
        if (!isAdmin) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const body = await request.json()
        const { host, port, username, password, encryption, fromEmail, fromName } = body

        if (!host || !port || !fromEmail) {
            return NextResponse.json({ error: "Host, Port, and From Email are required" }, { status: 400 })
        }

        const dataToSave = {
            host,
            port,
            username: username || "",
            password: password || "",
            encryption: encryption || "none",
            fromEmail,
            fromName: fromName || "",
            updatedAt: new Date().toISOString(),
        }

        await prisma.appSetting.upsert({
            where: { key: "smtp" },
            update: { value: dataToSave, updatedBy: isAdmin.uid },
            create: { key: "smtp", value: dataToSave, updatedBy: isAdmin.uid },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error saving SMTP config:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
    try {
        const isAdmin = await getAdminFromRequest(request)
        if (!isAdmin) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        await prisma.appSetting.delete({
            where: { key: "smtp" },
        }).catch(() => {
            // Ignore if doesn't exist
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error deleting SMTP config:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
