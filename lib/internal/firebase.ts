import * as admin from "firebase-admin"

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
    : {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }

if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        })
    } catch (error) {
        console.error("Firebase admin initialization error", error)
    }
}

// Only export auth-related services
// Storage and Firestore are now handled by Prisma + Plesk filesystem
export const adminAuth = admin.auth()
export const adminMessaging = admin.messaging()
