// src/data/content-repository.ts
import db from './firestore-client';
import {
    IFirestoreContentDocument,
    IContentMetadata,
    ContentData,
    HttpError // Ensure HttpError is imported if used directly here
} from '../model';

/**
 * Gets a Firestore document reference.
 * @param {string} collectionName - The name of the collection.
 * @param {string} docId - The document ID.
 * @returns {FirebaseFirestore.DocumentReference} The document reference.
 */
function getDocRef(collectionName: string, docId: string) {
    return db.collection(collectionName).doc(docId);
}

/**
 * Fetches document data from Firestore.
 * @param {string} collectionName - The name of the collection.
 * @param {string} docId - The document ID.
 * @returns {Promise<IFirestoreContentDocument | null>} The document data or null.
 */
async function fetchDocumentData(collectionName: string, docId: string): Promise<IFirestoreContentDocument | null> {
    const docRef = getDocRef(collectionName, docId);
    const doc = await docRef.get();
    return doc.exists ? (doc.data() as IFirestoreContentDocument) : null;
}

/**
 * Saves content data to Firestore.
 * @param {string} collectionName - The name of the collection.
 * @param {string} docId - The document ID.
 * @param {ContentData} content - The content data.
 * @param {IContentMetadata} metadata - The content metadata.
 */
async function saveDocumentData(collectionName: string, docId: string, content: ContentData, metadata: IContentMetadata): Promise<void> {
    const docRef = getDocRef(collectionName, docId);
    const dataToSave: IFirestoreContentDocument = { content, _metadata: metadata };
    await docRef.set(dataToSave);
    console.log(`✅ Content for ${docId} in '${collectionName}' saved to Firestore.`);
}

/**
 * Repository class for interacting with Firestore content collections.
 * Provides methods to get and save content documents.
 */
export class ContentRepository {
    private collectionName: string;

    constructor(collectionName: string) {
        this.collectionName = collectionName;
    }

    /**
     * Retrieves a content document by its ID from the specified collection.
     * @param {string} topicId - The ID of the document.
     * @returns {Promise<IFirestoreContentDocument | null>} The document data or null if not found.
     */
    async getById(topicId: string): Promise<IFirestoreContentDocument | null> {
        return fetchDocumentData(this.collectionName, topicId);
    }

    /**
     * Saves new content to Firestore in the specified collection.
     * @param {string} topicId - The ID for the document.
     * @param {ContentData} content - The content data.
     * @param {IContentMetadata} metadata - The metadata for the content.
     */
    async save(topicId: string, content: ContentData, metadata: IContentMetadata): Promise<void> {
        await saveDocumentData(this.collectionName, topicId, content, metadata);
    }
}