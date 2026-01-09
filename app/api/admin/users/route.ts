import { NextResponse } from "next/server"
import { adminAuth, adminDb } from "@/lib/internal/firebase"
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
        // Fallback to Firestore if Auth fails (unlikely for active users)
        const doc = await adminDb.collection("users").doc(uid).get()
        return {
            email: doc.data()?.email,
            displayName: doc.data()?.displayName || "User"
        }
    }
}

export async function GET(request: Request) {
    const admin = await checkAdmin(request)
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    try {
        const listUsersResult = await adminAuth.listUsers(1000)
        const authUsers = listUsersResult.users

        const userDocsSnapshot = await adminDb.collection("users").get()
        const firestoreUsersMap: Record<string, any> = {}
        userDocsSnapshot.forEach((doc) => {
            firestoreUsersMap[doc.id] = doc.data()
        })

        const authUsersMap: Record<string, any> = {}
        authUsers.forEach((u) => {
            authUsersMap[u.uid] = u
        })

        const allUids = new Set([...Object.keys(firestoreUsersMap), ...Object.keys(authUsersMap)])

        const users = Array.from(allUids).map((uid) => {
            const authUser = authUsersMap[uid]
            const firestoreData = firestoreUsersMap[uid] || {}

            let status = firestoreData.status || "active"
            if (status === "trial") status = "deleted"
            if (authUser?.disabled) status = "suspended"
            // If user exists in Firestore but not in Auth, they are likely deleted from Auth
            if (!authUser && status !== "deleted") {
                status = "deleted"
            }

            // Safely parse date helper
            const safeDate = (val: any) => {
                if (!val) return null
                try {
                    // Handle Firestore Timestamp (has toDate method)
                    if (val && typeof val.toDate === 'function') {
                        return val.toDate().toISOString()
                    }
                    // Handle numbers/strings
                    const date = new Date(val)
                    if (isNaN(date.getTime())) return null
                    return date.toISOString()
                } catch (e) {
                    return null
                }
            }

            return {
                id: uid,
                uid: uid,
                name: authUser?.displayName || firestoreData.name || firestoreData.displayName || "Guest User",
                email: authUser?.email || firestoreData.email || "No Email",
                avatar: authUser?.photoURL || firestoreData.photoURL || "",
                role: firestoreData.role || "user",
                status: status,
                plan: firestoreData.plan || firestoreData.tier || "free",
                registrationDate: safeDate(authUser?.metadata.creationTime) || safeDate(firestoreData.createdAt),
                lastLogin: safeDate(authUser?.metadata.lastSignInTime) || null,
                provider: authUser?.providerData[0]?.providerId || firestoreData.provider || "anonymous",
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

        // Handle different action types
        if (action === "ban") {
            await adminDb.collection("users").doc(uid).set({ status: "suspended" }, { merge: true })
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
            await adminDb.collection("users").doc(uid).set({ status: "active" }, { merge: true })
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
            // payload: { plan: "premium" | "free" }
            const plan = payload?.plan || "free"
            // Only update plan, preserve existing status (active/suspended/etc)
            await adminDb.collection("users").doc(uid).set({ plan: plan }, { merge: true })
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
            // payload: { role: "admin" | "user" }
            const role = payload?.role || "user"
            await adminDb.collection("users").doc(uid).set({ role }, { merge: true })
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
            // Fallback for direct updates if needed (legacy or other fields)
            const { uid: _u, ...rest } = body
            if (Object.keys(rest).length > 0) {
                await adminDb.collection("users").doc(uid).set(rest, { merge: true })
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

                // Hard delete from Firestore
                await adminDb.collection("users").doc(targetUid).delete()

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
