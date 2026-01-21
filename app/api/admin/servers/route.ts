import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { saveOvpnFile, deleteOvpnFile } from "@/lib/storage/plesk"
import { getUserFromRequest } from "@/lib/internal/permissions"
import { logAdminAction } from "@/lib/logger"

// Middleware-like check for admin
async function checkAdmin(request: Request) {
    const user = await getUserFromRequest(request)
    if (!user || user.role !== "admin") {
        return null
    }
    return user
}

export async function GET(request: Request) {
    const admin = await checkAdmin(request)
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    try {
        const servers = await prisma.server.findMany({
            orderBy: { createdAt: "desc" },
        })

        // Transform dates to ISO strings for JSON serialization
        const serializedServers = servers.map((server: { createdAt: { toISOString: () => any }; updatedAt: { toISOString: () => any } }) => ({
            ...server,
            createdAt: server.createdAt.toISOString(),
            updatedAt: server.updatedAt.toISOString(),
        }))

        return NextResponse.json(serializedServers)
    } catch (error) {
        console.error("Admin Servers GET Error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

export async function POST(request: Request) {
    const admin = await checkAdmin(request)
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    try {
        const body = await request.json()
        const { ovpnFileContent, ovpnFileName, ...serverData } = body

        // 1. Handle OVPN File Upload first (to get path)
        let ovpnFilePath: string | undefined
        if (ovpnFileContent && ovpnFileName) {
            // Generate a temporary ID for file organization
            const tempId = `temp_${Date.now()}`
            ovpnFilePath = await saveOvpnFile(tempId, ovpnFileName, ovpnFileContent)
        }

        // 2. Create Server Record in PostgreSQL
        const server = await prisma.server.create({
            data: {
                name: serverData.name,
                country: serverData.country,
                flag: serverData.flag || "🌐",
                ip: serverData.ip,
                port: serverData.port || 1194,
                protocol: serverData.protocol || "udp",
                tier: serverData.tier || "free",
                maxCapacity: serverData.maxCapacity || 100,
                streaming: serverData.streaming || false,
                p2p: serverData.p2p || false,
                notes: serverData.notes || null,
                ovpnFilePath: ovpnFilePath || null,
                status: serverData.status || "online",
                isActive: serverData.isActive ?? true,
                username: serverData.username || null,
                password: serverData.password || null,
                load: serverData.load || 0,
                currentUsers: serverData.currentUsers || 0,
            },
        })

        // 3. If we created a temp file, rename directory to actual server ID
        if (ovpnFilePath && ovpnFileName) {
            // Move file to correct location with server ID
            const newPath = await saveOvpnFile(server.id, ovpnFileName, ovpnFileContent)
            await prisma.server.update({
                where: { id: server.id },
                data: { ovpnFilePath: newPath },
            })
            // Clean up temp file
            try {
                await deleteOvpnFile(ovpnFilePath)
            } catch {
                // Ignore cleanup errors
            }
        }

        await logAdminAction(
            admin.uid as string,
            admin.email as string,
            "CREATE",
            "SERVER",
            `Created server ${serverData.name}`,
            server.id
        )

        return NextResponse.json({ id: server.id }, { status: 201 })
    } catch (error) {
        console.error("Admin Servers POST Error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

export async function PUT(request: Request) {
    const admin = await checkAdmin(request)
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    try {
        const body = await request.json()
        const { id, ovpnFileContent, ovpnFileName, ...serverData } = body

        if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 })

        // Check if server exists
        const existingServer = await prisma.server.findUnique({
            where: { id },
        })

        if (!existingServer) {
            return NextResponse.json({ error: "Server not found" }, { status: 404 })
        }

        // Handle OVPN Update
        let ovpnFilePath = existingServer.ovpnFilePath
        if (ovpnFileContent && ovpnFileName) {
            // Delete old file if exists
            if (existingServer.ovpnFilePath) {
                try {
                    await deleteOvpnFile(existingServer.ovpnFilePath)
                } catch {
                    // Ignore delete errors
                }
            }
            // Save new file
            ovpnFilePath = await saveOvpnFile(id, ovpnFileName, ovpnFileContent)
        }

        // Update server record
        await prisma.server.update({
            where: { id },
            data: {
                ...serverData,
                ovpnFilePath,
            },
        })

        await logAdminAction(
            admin.uid as string,
            admin.email as string,
            "UPDATE",
            "SERVER",
            `Updated server ${id}`,
            id
        )

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Admin Servers PUT Error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
    const admin = await checkAdmin(request)
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get("id")
        if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 })

        // Find server to get file path
        const server = await prisma.server.findUnique({
            where: { id },
        })

        if (server?.ovpnFilePath) {
            try {
                await deleteOvpnFile(server.ovpnFilePath)
            } catch (e) {
                console.warn("Could not delete OVPN file during server deletion", e)
            }
        }

        // Delete server record
        await prisma.server.delete({
            where: { id },
        })

        await logAdminAction(
            admin.uid as string,
            admin.email as string,
            "DELETE",
            "SERVER",
            `Deleted server ${id}`,
            id
        )

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Admin Servers DELETE Error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
