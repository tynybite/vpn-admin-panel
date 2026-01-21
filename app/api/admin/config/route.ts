import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getUserFromRequest } from "@/lib/internal/permissions"
import { logAdminAction } from "@/lib/logger"

async function checkAdmin(request: Request) {
    const user = await getUserFromRequest(request)
    if (!user || user.role !== "admin") return null
    return user
}

const CONFIG_KEYS = ["features", "vpn", "ui", "ads", "version"]

export async function GET(request: Request) {
    const admin = await checkAdmin(request)
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    try {
        const settings = await prisma.appSetting.findMany({
            where: {
                key: { in: CONFIG_KEYS.map(k => `config_${k}`) }
            }
        })

        const fullConfig: Record<string, any> = {}
        settings.forEach((setting: { key: string; value: any }) => {
            const key = setting.key.replace("config_", "")
            fullConfig[key] = setting.value
        })

        return NextResponse.json(fullConfig)
    } catch (error) {
        console.error("Admin Config GET Error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

export async function POST(request: Request) {
    const admin = await checkAdmin(request)
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    try {
        const body = await request.json()

        // Upsert each config key
        for (const key of Object.keys(body)) {
            if (CONFIG_KEYS.includes(key)) {
                await prisma.appSetting.upsert({
                    where: { key: `config_${key}` },
                    update: {
                        value: {
                            ...body[key],
                            updatedAt: new Date().toISOString(),
                        },
                        updatedBy: admin.uid as string,
                    },
                    create: {
                        key: `config_${key}`,
                        value: {
                            ...body[key],
                            updatedAt: new Date().toISOString(),
                        },
                        updatedBy: admin.uid as string,
                    },
                })
            }
        }

        await logAdminAction(admin.uid as string, admin.email as string, "UPDATE", "CONFIG", "Updated system configuration")

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Admin Config POST Error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
