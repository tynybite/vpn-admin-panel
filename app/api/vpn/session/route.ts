import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { readOvpnFile } from "@/lib/storage/plesk"
import { getUserFromRequest } from "@/lib/internal/permissions"
import { checkRateLimit, rateLimitResponse } from "@/lib/internal/rateLimit"
import { v4 as uuidv4 } from "uuid"

export async function POST(request: Request) {
    try {
        const user = await getUserFromRequest(request)
        const { serverId } = await request.json()

        if (!user || !user.uid) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        if (!serverId) {
            return NextResponse.json({ error: "Missing Server ID" }, { status: 400 })
        }

        // 1. Mandatory Rate Limit Check
        const isAllowed = await checkRateLimit(request)
        if (!isAllowed) {
            return rateLimitResponse()
        }

        // 2. Fetch User Data from PostgreSQL
        const userData = await prisma.user.findUnique({
            where: { id: user.uid as string },
        })

        if (!userData) {
            return NextResponse.json({ error: "User profile NOT found" }, { status: 404 })
        }

        const currentPlan = userData.plan || "free"

        // 3. Fetch server data from PostgreSQL
        const serverData = await prisma.server.findUnique({
            where: { id: serverId },
        })

        if (!serverData) {
            return NextResponse.json({ error: "Server NOT found" }, { status: 404 })
        }

        if (!serverData.isActive) {
            return NextResponse.json({ error: "Server is disabled" }, { status: 403 })
        }

        // 4. Validate tier (DB Re-check)
        if (serverData.tier === "premium" && currentPlan !== "premium") {
            let hasTempAccess = false

            // Check for specific server access
            const specificAccess = await prisma.temporaryAccess.findFirst({
                where: {
                    userId: user.uid as string,
                    serverId: serverId,
                    expiresAt: { gt: new Date() },
                },
            })

            if (specificAccess) {
                hasTempAccess = true
            }

            // Check for universal access (serverId = null means ALL servers)
            if (!hasTempAccess) {
                const allAccess = await prisma.temporaryAccess.findFirst({
                    where: {
                        userId: user.uid as string,
                        serverId: null,
                        expiresAt: { gt: new Date() },
                    },
                })

                if (allAccess) {
                    hasTempAccess = true
                }
            }

            if (!hasTempAccess) {
                return NextResponse.json({ error: "Premium subscription required" }, { status: 403 })
            }
        }

        // 5. Fetch OVPN config from Plesk filesystem
        let ovpnConfig = ""
        if (serverData.ovpnFilePath) {
            try {
                ovpnConfig = await readOvpnFile(serverData.ovpnFilePath)
            } catch (e) {
                console.error("Error reading OVPN file:", e)
                return NextResponse.json({ error: "Could NOT fetch OVPN config" }, { status: 500 })
            }
        }

        if (!ovpnConfig) {
            return NextResponse.json({ error: "OVPN config NOT found for this server" }, { status: 500 })
        }

        // 6. Create Session in PostgreSQL
        const sessionId = `sess_${uuidv4().substring(0, 12)}`
        const userId = user.uid as string
        const expiresAt = Math.floor(Date.now() / 1000) + 3600 // 1 hour session
        const temporaryToken = uuidv4().substring(0, 16)

        await prisma.vpnSession.create({
            data: {
                sessionId,
                userId,
                serverId,
                expiresAt,
                revoked: false,
            },
        })

        // 7. Output
        return NextResponse.json({
            ovpnConfig,
            username: serverData.username || `u_${userId}_${sessionId}`,
            password: serverData.password || temporaryToken,
            expiresAt,
        })
    } catch (error) {
        console.error("VPN Session Error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
