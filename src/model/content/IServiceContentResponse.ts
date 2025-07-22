import { ContentData } from './Content';

// --- Service Output Structure (for content that might include warnings) ---
export interface IServiceContentResponse<T extends ContentData> {
    content: T;
    warning?: string;
}