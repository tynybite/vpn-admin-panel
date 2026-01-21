import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { adminAuth } from "@/lib/internal/firebase"
import { createToken } from "@/lib/internal/auth"

export async function POST(request: Request) {
    try {
        const { firebaseIdToken } = await request.json()

        if (!firebaseIdToken) {
            return NextResponse.json({ error: "Missing ID token" }, { status: 400 })
        }

        // Verify the Firebase ID token
        const decodedToken = await adminAuth.verifyIdToken(firebaseIdToken)
        const uid = decodedToken.uid

        // Check if user exists in PostgreSQL
        let userData = await prisma.user.findUnique({
            where: { id: uid },
        })

        // Detect if this is an anonymous login
        const isAnonymous = decodedToken.firebase?.sign_in_provider === 'anonymous'

        if (!userData) {
            // Create new user record in PostgreSQL
            userData = await prisma.user.create({
                data: {
                    id: uid,
                    email: decodedToken.email || null,
                    displayName: decodedToken.name || (isAnonymous ? "Anonymous User" : "Guest User"),
                    photoURL: decodedToken.picture as string || null,
                    role: "user", // Default to user, NOT admin
                    plan: "free",
                    status: "active",
                    provider: decodedToken.firebase?.sign_in_provider || "unknown",
                },
            })
        }

        // Ensure we respect the existing role from DB
        const currentRole = userData.role || "user"

        // Issue backend JWT with standardized claims
        const payload = {
            uid,
            email: decodedToken.email,
            role: currentRole,
            plan: userData.plan || "free",
        }

        const accessToken = await createToken(payload)

        return NextResponse.json({
            accessToken,
            user: {
                uid: payload.uid,
                email: payload.email,
                role: payload.role,
                plan: payload.plan,
                displayName: userData.displayName,
                photoURL: userData.photoURL || (decodedToken.picture as string),
            },
            expiresIn: 3600,
        })
    } catch (error) {
        console.error("Login API Error:", error)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
}
