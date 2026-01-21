import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { adminAuth } from "@/lib/internal/firebase"
import { getUserFromRequest } from "@/lib/internal/permissions"
import { logAdminAction } from "@/lib/logger"
import { sendUserStatusEmail } from "@/lib/email-service"

async function checkAdmin(request: Request) {
    const user = await getUserFromRequest(request)
    if (!user || user.role !== "admin") return null
    return user
}

// Helper to get user details for email
async function getUserDetails(uid: string) {
    try {
        const user = await adminAuth.getUser(uid)
        return {
            email: user.email,
            displayName: user.displayName || "User"
        }
    } catch (e) {
        // Fallback to PostgreSQL if Auth fails
        const dbUser = await prisma.user.findUnique({
            where: { id: uid },
            select: { email: true, displayName: true },
        })
        return {
            email: dbUser?.email,
            displayName: dbUser?.displayName || "User"
        }
    }
}

export async function GET(request: Request) {
    const admin = await checkAdmin(request)
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    try {
        // Get users from Firebase Auth
        const listUsersResult = await adminAuth.listUsers(1000)
        const authUsers = listUsersResult.users

        // Get users from PostgreSQL
        const dbUsers = await prisma.user.findMany()
        const dbUsersMap: Record<string, any> = {}
        dbUsers.forEach((u: { id: string | number }) => {
            dbUsersMap[u.id] = u
        })

        // Create map of auth users
        const authUsersMap: Record<string, any> = {}
        authUsers.forEach((u) => {
            authUsersMap[u.uid] = u
        })

        // Combine all UIDs
        const allUids = new Set([...Object.keys(dbUsersMap), ...Object.keys(authUsersMap)])

        const users = Array.from(allUids).map((uid) => {
            const authUser = authUsersMap[uid]
            const dbUser = dbUsersMap[uid] || {}

            let status = dbUser.status || "active"
            if (status === "trial") status = "deleted"
            if (authUser?.disabled) status = "suspended"
            // If user exists in DB but not in Auth, they are likely deleted from Auth
            if (!authUser && status !== "deleted") {
                status = "deleted"
            }

            return {
                id: uid,
                uid: uid,
                name: authUser?.displayName || dbUser.displayName || dbUser.name || "Guest User",
                email: authUser?.email || dbUser.email || "No Email",
                avatar: authUser?.photoURL || dbUser.photoURL || "",
                role: dbUser.role || "user",
                status: status,
                plan: dbUser.plan || "free",
                registrationDate: authUser?.metadata.creationTime
                    ? new Date(authUser.metadata.creationTime).toISOString()
                    : dbUser.createdAt?.toISOString() || null,
                lastLogin: authUser?.metadata.lastSignInTime
                    ? new Date(authUser.metadata.lastSignInTime).toISOString()
                    : null,
                provider: authUser?.providerData[0]?.providerId || dbUser.provider || "anonymous",
            }
        })

        return NextResponse.json({ users })
    } catch (error) {
        console.error("Admin Users GET Error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

export async function PUT(request: Request) {
    const admin = await checkAdmin(request)
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    try {
        const body = await request.json()
        const { uid, action, payload } = body

        if (!uid) return NextResponse.json({ error: "Missing UID" }, { status: 400 })

        // Ensure user exists in PostgreSQL
        const existingUser = await prisma.user.findUnique({ where: { id: uid } })
        if (!existingUser) {
            // Create user record if doesn't exist
            await prisma.user.create({
                data: {
                    id: uid,
                    status: "active",
                    role: "user",
                    plan: "free",
                },
            })
        }

        // Handle different action types
        if (action === "ban") {
            await prisma.user.update({
                where: { id: uid },
                data: { status: "suspended" },
            })
            await adminAuth.updateUser(uid, { disabled: true })
            await logAdminAction(admin.uid as string, admin.email as string, "BAN", "USER", `Banned user ${uid}`, uid)

            const targetUser = await getUserDetails(uid)
            if (targetUser.email) {
                await sendUserStatusEmail(targetUser.email, {
                    username: targetUser.displayName,
                    scenario: 'account_banned'
                })
            }
        }
        else if (action === "unban") {
            await prisma.user.update({
                where: { id: uid },
                data: { status: "active" },
            })
            await adminAuth.updateUser(uid, { disabled: false })
            await logAdminAction(admin.uid as string, admin.email as string, "UNBAN", "USER", `Unbanned user ${uid}`, uid)

            const targetUser = await getUserDetails(uid)
            if (targetUser.email) {
                await sendUserStatusEmail(targetUser.email, {
                    username: targetUser.displayName,
                    scenario: 'account_reactivated'
                })
            }
        }
        else if (action === "set_plan") {
            const plan = payload?.plan || "free"
            await prisma.user.update({
                where: { id: uid },
                data: { plan },
            })
            await logAdminAction(admin.uid as string, admin.email as string, "UPDATE_PLAN", "USER", `Set user ${uid} plan to ${plan}`, uid)

            const targetUser = await getUserDetails(uid)
            if (targetUser.email) {
                if (plan === 'premium') {
                    await sendUserStatusEmail(targetUser.email, {
                        username: targetUser.displayName,
                        scenario: 'premium_granted'
                    })
                } else {
                    await sendUserStatusEmail(targetUser.email, {
                        username: targetUser.displayName,
                        scenario: 'premium_revoked'
                    })
                }
            }
        }
        else if (action === "set_role") {
            const role = payload?.role || "user"
            await prisma.user.update({
                where: { id: uid },
                data: { role },
            })
            await logAdminAction(admin.uid as string, admin.email as string, "UPDATE_ROLE", "USER", `Set user ${uid} role to ${role}`, uid)

            const targetUser = await getUserDetails(uid)
            if (targetUser.email) {
                if (role === 'admin') {
                    await sendUserStatusEmail(targetUser.email, {
                        username: targetUser.displayName,
                        scenario: 'admin_granted'
                    })
                } else if (role === 'user') {
                    await sendUserStatusEmail(targetUser.email, {
                        username: targetUser.displayName,
                        scenario: 'admin_revoked'
                    })
                }
            }
        }
        else {
            // Fallback for direct updates
            const { uid: _u, action: _a, payload: _p, ...rest } = body
            if (Object.keys(rest).length > 0) {
                await prisma.user.update({
                    where: { id: uid },
                    data: rest,
                })
            }
        }

        return NextResponse.json({
            success: true,
            debug: { admin: admin.email }
        })
    } catch (error) {
        console.error("Admin Users PUT Error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
    const admin = await checkAdmin(request)
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    try {
        const { searchParams } = new URL(request.url)
        const uid = searchParams.get("uid")
        const uidsStr = searchParams.get("uids")

        const uidsToDelete = uid ? [uid] : (uidsStr ? uidsStr.split(",") : [])

        if (uidsToDelete.length === 0) {
            return NextResponse.json({ error: "Missing UID(s)" }, { status: 400 })
        }

        const results = await Promise.all(uidsToDelete.map(async (targetUid) => {
            try {
                // Hard delete from Firebase Auth
                try {
                    await adminAuth.deleteUser(targetUid)
                } catch (e: any) {
                    if (e.code !== 'auth/user-not-found') throw e
                }

                // Hard delete from PostgreSQL
                await prisma.user.delete({
                    where: { id: targetUid },
                }).catch(() => {
                    // User might not exist in DB - that's okay
                })

                await logAdminAction(admin.uid as string, admin.email as string, "HARD_DELETE", "USER", `Hard deleted user ${targetUid}`, targetUid)
                return { uid: targetUid, success: true }
            } catch (error) {
                console.error(`Error hard deleting user ${targetUid}:`, error)
                return { uid: targetUid, success: false, error: "Deletion failed" }
            }
        }))

        return NextResponse.json({ success: true, results })
    } catch (error) {
        console.error("Admin Users DELETE Error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
