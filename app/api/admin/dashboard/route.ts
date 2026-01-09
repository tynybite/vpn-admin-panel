import { NextResponse } from "next/server"
import { adminDb } from "@/lib/internal/firebase"
import { getUserFromRequest } from "@/lib/internal/permissions"

// Helper to check admin permission
async function checkAdmin(request: Request) {
    const user = await getUserFromRequest(request)
    if (!user || user.role !== "admin") return null
    return user
}

export async function GET(request: Request) {
    const admin = await checkAdmin(request)
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    try {
        // 1. User Counts
        const usersColl = adminDb.collection("users")
        const totalUsersSnapshot = await usersColl.count().get()
        const activeUsersSnapshot = await usersColl.where("status", "==", "active").count().get()
        const premiumUsersSnapshot = await usersColl.where("plan", "==", "premium").count().get()
        
        // 2. Server Counts
        const serversColl = adminDb.collection("servers")
        const totalServersSnapshot = await serversColl.count().get()
        const activeServersSnapshot = await serversColl.where("isActive", "==", true).count().get()

        // 3. Recent Activity (Logs)
        const logsSnapshot = await adminDb.collection("activity_logs")
            .orderBy("timestamp", "desc")
            .limit(5)
            .get()
        
        const recentActivity = logsSnapshot.docs.map(doc => {
            const data = doc.data()
            return {
                id: doc.id,
                action: data.action,
                user: data.targetId || data.adminEmail || "System", // Fallback for display
                status: (data.action || "").includes("FAIL") ? "failed" : "success", // Simple heuristic
                time: data.timestamp?.toDate().toISOString(),
                details: data.details
            }
        })

        // 4. Traffic/Performance (Mock for now as we don't have real metrics agent yet)
        const trafficData = [
             { name: "Mon", total: Math.floor(Math.random() * 5000) + 1000 },
             { name: "Tue", total: Math.floor(Math.random() * 5000) + 1000 },
             { name: "Wed", total: Math.floor(Math.random() * 5000) + 1000 },
             { name: "Thu", total: Math.floor(Math.random() * 5000) + 1000 },
             { name: "Fri", total: Math.floor(Math.random() * 5000) + 1000 },
             { name: "Sat", total: Math.floor(Math.random() * 5000) + 1000 },
             { name: "Sun", total: Math.floor(Math.random() * 5000) + 1000 },
        ]

        return NextResponse.json({
            stats: {
                totalUsers: totalUsersSnapshot.data().count,
                activeUsers: activeUsersSnapshot.data().count,
                premiumUsers: premiumUsersSnapshot.data().count,
                totalServers: totalServersSnapshot.data().count,
                activeServers: activeServersSnapshot.data().count,
            },
            recentActivity,
            trafficData
        })
    } catch (error) {
        console.error("Admin Dashboard Stats Error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
