import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"

export async function GET() {
    try {
        const adsSetting = await prisma.appSetting.findUnique({
            where: { key: "config_ads" },
        })

        // Return default empty config if not found
        const adsConfig = adsSetting?.value || {
            profiles: [
                {
                    id: "default",
                    name: "Default Profile",
                    provider: "none",
                    admob: { appId: "", bannerId: "", interstitialId: "", nativeId: "", openAppId: "", rewardedId: "" },
                    facebook: { appId: "", bannerId: "", interstitialId: "", nativeId: "", rewardedId: "" }
                }
            ],
            settings: {
                adFrequency: 3,
                bannerPosition: "bottom",
                rewardedVideoReward: "24h"
            }
        }

        return NextResponse.json(adsConfig)
    } catch (error) {
        console.error("Ads Config API Error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
