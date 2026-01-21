import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { adminAuth } from "@/lib/internal/firebase"
import { sendUserStatusEmail } from "@/lib/email-service"

export async function POST(request: Request) {
    try {
        const authHeader = request.headers.get("Authorization")
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const idToken = authHeader.split("Bearer ")[1]
        let decodedToken
        try {
            decodedToken = await adminAuth.verifyIdToken(idToken)
        } catch (e) {
            console.error("Token verification failed:", e)
            return NextResponse.json({ error: "Invalid token" }, { status: 401 })
        }

        const uid = decodedToken.uid
        const email = decodedToken.email

        if (!uid) {
            return NextResponse.json({ error: "User identity missing" }, { status: 400 })
        }

        // 1. Soft Delete in PostgreSQL
        await prisma.user.update({
            where: { id: uid },
            data: { status: "deleted" },
        }).catch(async () => {
            // If user doesn't exist in DB, create with deleted status
            await prisma.user.create({
                data: {
                    id: uid,
                    email: email || null,
                    status: "deleted",
                },
            })
        })

        // 2. Disable in Firebase Auth (Prevent future logins)
        await adminAuth.updateUser(uid, { disabled: true })

        // 3. Send Notification Email
        if (email) {
            let displayName = decodedToken.name || "User"
            try {
                const userRecord = await adminAuth.getUser(uid)
                if (userRecord.displayName) displayName = userRecord.displayName
            } catch (e) {
                // Ignore
            }

            await sendUserStatusEmail(email, {
                username: displayName,
                scenario: "account_deleted",
            })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Account Deletion Error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
