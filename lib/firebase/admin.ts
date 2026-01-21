import { initializeApp, getApps, cert, ServiceAccount } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getMessaging } from "firebase-admin/messaging";

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!projectId || !clientEmail || !privateKey) {
    console.warn("Missing Firebase Admin credentials in environment variables.");
}

const serviceAccount: ServiceAccount = {
    projectId,
    clientEmail,
    privateKey,
};

// Singleton pattern to avoid multiple initializations
if (!getApps().length) {
    initializeApp({
        credential: cert(serviceAccount),
        // No storageBucket needed
    });
}

const adminAuth = getAuth();
const adminMessaging = getMessaging();

export { adminAuth, adminMessaging };
