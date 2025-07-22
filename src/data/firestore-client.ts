// src/data/firestore-client.ts
import { Firestore } from '@google-cloud/firestore';

/**
 * Initializes and exports a single Firestore database instance.
 * This instance automatically uses Google Application Default Credentials
 * when running locally (if `gcloud auth application-default login` is used)
 * or the service account credentials when deployed on Google Cloud (e.g., Cloud Run).
 */
const db = new Firestore({
    projectId: process.env.GOOGLE_CLOUD_PROJECT,
    location: process.env.FIRESTORE_REGION || 'europe-west3', // Default to europe-west3 if not set 
});


export default db;