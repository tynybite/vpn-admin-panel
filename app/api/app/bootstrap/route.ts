import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"

export async function GET() {
    try {
        // Fetch config from AppSettings
        const [featuresSetting, versionSetting] = await Promise.all([
            prisma.appSetting.findUnique({ where: { key: "config_features" } }),
            prisma.appSetting.findUnique({ where: { key: "config_version" } }),
        ])

        const featuresData = (featuresSetting?.value as any) || { freeVpn: true, premiumVpn: false }
        const version = (versionSetting?.value as any) || { forceUpdate: false, message: null }

        // Remove ads from features as it has its own endpoint
        const { ads, ...features } = featuresData

        return NextResponse.json({
            features,
            min_version: version?.minVersion || "1.0.0",
            cache_version: version?.cacheVersion || 1,
            maintenance_mode: version?.maintenanceMode || false,
            timestamp: new Date().toISOString(),
        })
    } catch (error) {
        console.error("Bootstrap API Error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
