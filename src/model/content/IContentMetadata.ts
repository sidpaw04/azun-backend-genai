// --- Metadata for Cached Content ---
export interface IContentMetadata {
    generatedAt: string; // ISO string
    confidenceScore: number; // 0.0 to 1.0
    topicId: string;
    level: string;
    title: string;
    description: string;
}