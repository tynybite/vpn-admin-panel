import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { adminAuth } from "@/lib/internal/firebase"
import crypto from "crypto"

// AdMob Public Keys URL
const ADMOB_KEYS_URL = "https://www.gstatic.com/admob/reward/verifier-keys.json"

interface AdMobKeys {
    keys: {
        keyId: number
        pem: string
        base64: string
    }[]
}

let cachedKeys: AdMobKeys | null = null

async function getAdMobPublicKeys(): Promise<AdMobKeys> {
    if (cachedKeys) return cachedKeys

    try {
        const response = await fetch(ADMOB_KEYS_URL)
        if (!response.ok) {
            throw new Error(`Failed to fetch AdMob keys: ${response.statusText}`)
        }
        const data = await response.json()
        cachedKeys = data as AdMobKeys
        return cachedKeys
    } catch (error) {
        console.error("Error fetching AdMob keys:", error)
        throw error
    }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)

    const signature = searchParams.get("signature")
    const key_id = searchParams.get("key_id")
    const custom_data = searchParams.get("custom_data")
    const transaction_id = searchParams.get("transaction_id")

    if (!signature || !key_id) {
        return NextResponse.json({ error: "Missing signature or key_id" }, { status: 400 })
    }

    const params = new URLSearchParams(searchParams)
    params.delete("signature")
    params.delete("key_id")
    const message = params.toString()

    // Verify Signature
    try {
        const keys = await getAdMobPublicKeys()
        const key = keys.keys.find((k) => k.keyId.toString() === key_id)

        if (!key) {
            console.error(`PublicKey not found for key_id: ${key_id}`)
            return NextResponse.json({ error: "Public key not found" }, { status: 400 })
        }

        const verifier = crypto.createVerify("SHA256")
        verifier.update(message)

        const cleanSignature = signature.replace(/-/g, "+").replace(/_/g, "/")
        const isValid = verifier.verify(key.pem, cleanSignature, "base64")

        if (!isValid) {
            console.warn("Invalid AdMob SSV signature")
            return NextResponse.json({ error: "Invalid signature" }, { status: 403 })
        }
    } catch (err) {
        console.error("Verification error:", err)
        return NextResponse.json({ error: "Verification failed" }, { status: 500 })
    }

    // Parse custom_data
    let userId = ""
    let rewardType = ""

    try {
        if (custom_data) {
            const jsonStr = decodeURIComponent(custom_data)
            let data
            try {
                data = JSON.parse(jsonStr)
            } catch {
                data = JSON.parse(custom_data)
            }
            userId = data.userId || data.uid
            rewardType = data.reward || data.rewardedVideoReward || "1h"
        }
    } catch (e) {
        console.log("Error parsing custom_data:", e)
    }

    if (!userId) {
        console.warn("No userId found in SSV callback")
        return NextResponse.json({ message: "Verification successful, but no user identified (no-op)" }, { status: 200 })
    }

    // Idempotency Check via AppSetting
    if (transaction_id) {
        const existing = await prisma.appSetting.findUnique({
            where: { key: `admob_tx_${transaction_id}` },
        })
        if (existing) {
            return NextResponse.json({ message: "Already processed" })
        }
    }

    // Grant Reward
    if (rewardType === "1h") {
        try {
            const now = new Date()
            const expiresAt = new Date(now.getTime() + 60 * 60 * 1000) // +1 Hour

            // Update User
            await prisma.user.upsert({
                where: { id: userId },
                update: {
                    plan: "premium",
                    status: "active",
                },
                create: {
                    id: userId,
                    plan: "premium",
                    status: "active",
                },
            })

            // Log Transaction
            if (transaction_id) {
                await prisma.appSetting.create({
                    data: {
                        key: `admob_tx_${transaction_id}`,
                        value: {
                            userId,
                            rewardType,
                            timestamp: now.toISOString(),
                            rawParams: Object.fromEntries(searchParams)
                        },
                    },
                })
            }

            // Update Custom Claims
            await adminAuth.setCustomUserClaims(userId, {
                plan: "premium",
                premium: true
            })

            console.log(`Granted 1h premium to ${userId} via AdMob SSV`)
            return NextResponse.json({ success: true })

        } catch (error) {
            console.error("Error granting reward:", error)
            return NextResponse.json({ error: "Internal Error" }, { status: 500 })
        }
    }

    return NextResponse.json({ message: "No action taken (unknown reward)" })
}
