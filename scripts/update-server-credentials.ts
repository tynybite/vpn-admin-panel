
// Load environment variables
process.loadEnvFile(".env.local");

import { initializeApp, cert, getApps, ServiceAccount } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!projectId || !clientEmail || !privateKey) {
    console.error("Missing Firebase Admin credentials in environment variables.");
    process.exit(1);
}

const serviceAccount: ServiceAccount = {
    projectId,
    clientEmail,
    privateKey,
};

if (!getApps().length) {
    initializeApp({
        credential: cert(serviceAccount),
    });
}

const firestore = getFirestore();

async function updateServerCredentials() {
    console.log("Starting server credentials update (Firestore)...");
    
    const newUsername = "ncphostpika@namecheap";
    const newPassword = "P8KlDd6tMH";

    // Try Firestore (most likely based on "collection" terminology)
    console.log(`\n--- Attempting Firestore Update (Collection: 'servers') ---`);
    try {
        const serversCollection = firestore.collection("servers");
        const snapshot = await serversCollection.limit(100).get();

        if (!snapshot.empty) {
            console.log(`Found ${snapshot.size} documents in Firestore 'servers' collection.`);
            
            // Check one document to see if it has the expected fields
            const firstDoc = snapshot.docs[0].data();
            console.log("Sample Document keys:", Object.keys(firstDoc));
            
            console.log("Updating credentials...");
            const batch = firestore.batch();
            let count = 0;

            snapshot.forEach((doc) => {
                const docRef = serversCollection.doc(doc.id);
                // Based on user request, update username and password
                batch.update(docRef, { 
                    username: newUsername,
                    password: newPassword
                });
                count++;
            });

            await batch.commit();
            console.log(`Successfully updated ${count} documents in Firestore.`);
        } else {
            console.log("No documents found in Firestore 'servers' collection.");
        }

    } catch (error: any) {
        console.error("Error accessing Firestore:", error.message);
    }

    console.log("\nDone.");
    process.exit(0);
}

updateServerCredentials();
