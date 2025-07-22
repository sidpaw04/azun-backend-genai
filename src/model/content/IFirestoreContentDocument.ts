import { ContentData } from "./Content";
import { IContentMetadata } from "./IContentMetadata";

// --- Firestore Document Structure ---
export interface IFirestoreContentDocument {
    content: ContentData;
    _metadata: IContentMetadata;
}