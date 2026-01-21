import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"

export async function GET(request: Request) {
    try {
        // Fetch only active plans for the mobile app
        const plans = await prisma.plan.findMany({
            where: { isActive: true },
        })

        const formatted = plans.map((plan: { id: any; name: any; price: any; currency: any; duration: any; googleProductId: any; features: any }) => ({
            id: plan.id,
            name: plan.name,
            price: plan.price,
            currency: plan.currency,
            interval: plan.duration,
            googleProductId: plan.googleProductId,
            features: plan.features,
            popular: false, // Default, could be added to schema if needed
        }))

        return NextResponse.json({ plans: formatted })
    } catch (error) {
        console.error("Error fetching app plans:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
