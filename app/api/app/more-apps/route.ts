import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"

export async function GET() {
    try {
        const setting = await prisma.appSetting.findUnique({
            where: { key: "more_apps" },
        })

        const data = (setting?.value as any) || { apps: [] }

        return NextResponse.json(data)
    } catch (error) {
        console.error("More Apps API Error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
