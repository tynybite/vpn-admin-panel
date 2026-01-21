import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getAdminFromRequest } from "@/lib/auth-helper"

export async function GET(request: Request) {
    try {
        const admin = await getAdminFromRequest(request)
        if (!admin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const plans = await prisma.plan.findMany({
            orderBy: { createdAt: "desc" },
        })

        const formatted = plans.map((p: { id: any; name: any; description: any; price: any; currency: any; duration: any; googleProductId: any; appleProductId: any; features: any; isActive: any; createdAt: { toISOString: () => any }; updatedAt: { toISOString: () => any } }) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            price: p.price,
            currency: p.currency,
            duration: p.duration,
            googleProductId: p.googleProductId,
            appleProductId: p.appleProductId,
            features: p.features,
            isActive: p.isActive,
            createdAt: p.createdAt.toISOString(),
            updatedAt: p.updatedAt.toISOString(),
        }))

        return NextResponse.json({ plans: formatted })
    } catch (error) {
        console.error("Error fetching subscriptions:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const admin = await getAdminFromRequest(request)
        if (!admin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const data = await request.json()

        if (!data.name || !data.googleProductId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        const plan = await prisma.plan.create({
            data: {
                name: data.name,
                description: data.description || null,
                price: data.price || null,
                currency: data.currency || "USD",
                duration: data.duration || null,
                googleProductId: data.googleProductId,
                appleProductId: data.appleProductId || null,
                features: data.features || null,
                isActive: data.isActive ?? true,
            },
        })

        return NextResponse.json({
            id: plan.id,
            ...plan,
            createdAt: plan.createdAt.toISOString(),
            updatedAt: plan.updatedAt.toISOString(),
        })
    } catch (error) {
        console.error("Error creating subscription:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

export async function PUT(request: Request) {
    try {
        const admin = await getAdminFromRequest(request)
        if (!admin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const data = await request.json()
        const { id, ...updateData } = data

        if (!id) {
            return NextResponse.json({ error: "Missing Plan ID" }, { status: 400 })
        }

        await prisma.plan.update({
            where: { id },
            data: updateData,
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error updating subscription:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
    try {
        const admin = await getAdminFromRequest(request)
        if (!admin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const id = searchParams.get("id")

        if (!id) {
            return NextResponse.json({ error: "Missing Plan ID" }, { status: 400 })
        }

        await prisma.plan.delete({ where: { id } })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error deleting subscription:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
