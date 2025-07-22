// --- Service Input Parameters ---
export interface IServiceParams {
    title: string;
    description: string;
    level: string;
    topicId: string;
    confidence?: number; // Optional, for frontend-driven regeneration
}