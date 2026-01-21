import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getAdminFromRequest } from "@/lib/auth-helper"
import { logAdminAction } from "@/lib/logger"

export async function POST(request: Request) {
    const admin = await getAdminFromRequest(request)
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    try {
        const body = await request.json()
        const { app } = body

        if (!app || !app.id) {
            return NextResponse.json({ error: "Invalid app data" }, { status: 400 })
        }

        // Get current apps from settings
        const setting = await prisma.appSetting.findUnique({
            where: { key: "more_apps" },
        })
        const currentApps = ((setting?.value as any)?.apps || []) as any[]
        const updatedApps = [...currentApps, app]

        await prisma.appSetting.upsert({
            where: { key: "more_apps" },
            update: { value: { apps: updatedApps } },
            create: { key: "more_apps", value: { apps: updatedApps } },
        })

        await logAdminAction(
            admin.uid as string,
            admin.email as string,
            "CREATE",
            "MORE_APPS",
            `Added ${app.name} to More Apps`,
            app.id
        )

        return NextResponse.json({ success: true, apps: updatedApps })
    } catch (error) {
        console.error("Error adding app:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

export async function PUT(request: Request) {
    const admin = await getAdminFromRequest(request)
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    try {
        const body = await request.json()
        const { app } = body

        if (!app || !app.id) {
            return NextResponse.json({ error: "Invalid app data" }, { status: 400 })
        }

        const setting = await prisma.appSetting.findUnique({
            where: { key: "more_apps" },
        })
        const currentApps = ((setting?.value as any)?.apps || []) as any[]
        const updatedApps = currentApps.map((a: any) => a.id === app.id ? app : a)

        await prisma.appSetting.upsert({
            where: { key: "more_apps" },
            update: { value: { apps: updatedApps } },
            create: { key: "more_apps", value: { apps: updatedApps } },
        })

        await logAdminAction(
            admin.uid as string,
            admin.email as string,
            "UPDATE",
            "MORE_APPS",
            `Updated info for ${app.name}`,
            app.id
        )

        return NextResponse.json({ success: true, apps: updatedApps })
    } catch (error) {
        console.error("Error updating app:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
    const admin = await getAdminFromRequest(request)
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get("id")

        if (!id) {
            return NextResponse.json({ error: "Missing ID" }, { status: 400 })
        }

        const setting = await prisma.appSetting.findUnique({
            where: { key: "more_apps" },
        })
        const currentApps = ((setting?.value as any)?.apps || []) as any[]
        const updatedApps = currentApps.filter((a: any) => a.id !== id)

        await prisma.appSetting.upsert({
            where: { key: "more_apps" },
            update: { value: { apps: updatedApps } },
            create: { key: "more_apps", value: { apps: updatedApps } },
        })

        await logAdminAction(
            admin.uid as string,
            admin.email as string,
            "DELETE",
            "MORE_APPS",
            `Removed app ID ${id}`,
            id
        )

        return NextResponse.json({ success: true, apps: updatedApps })
    } catch (error) {
        console.error("Error deleting app:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
