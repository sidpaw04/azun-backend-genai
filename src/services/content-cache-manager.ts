// src/services/content-cache-manager.ts
import config from '../config'; // Import the config for cache duration and min confidence
import { IContentMetadata, IServiceParams } from '../model';

/**
 * Manages caching logic for content, determining when regeneration is needed.
 */
export class ContentCacheManager {
    /**
     * Checks if the cached content is older than the configured duration.
     * @param {string} generatedAtIso - ISO string of when content was generated.
     * @returns {boolean} True if stale, false otherwise.
     */
    private static isStale(generatedAtIso: string): boolean {
        const generatedAt = new Date(generatedAtIso);
        const now = new Date();
        const ageHours = (now.getTime() - generatedAt.getTime()) / (1000 * 60 * 60);
        return ageHours > config.contentCacheDurationHours;
    }

    /**
     * Checks if the confidence score is below the minimum threshold.
     * Prioritizes frontend-provided confidence if available.
     * @param {number} currentConfidence - The confidence score from cached metadata.
     * @param {number | undefined} frontendConfidence - Confidence score from frontend.
     * @returns {boolean} True if confidence is low, false otherwise.
     */
    private static isLowConfidence(currentConfidence: number, frontendConfidence: number | undefined): boolean {
        // If frontend explicitly sends low confidence, prioritize that
        if (frontendConfidence !== undefined) {
            return frontendConfidence < config.minConfidenceForRegen;
        }
        // Otherwise, use the backend's cached confidence
        return currentConfidence < config.minConfidenceForRegen;
    }

    /**
     * Determines if cached content should be regenerated.
     * @param {IContentMetadata | undefined} metadata - The metadata of the cached content.
     * @param {number | undefined} frontendConfidence - Confidence score sent from frontend.
     * @returns {boolean} True if regeneration is needed, false otherwise.
     */
    static shouldRegenerate(metadata: IContentMetadata | undefined, frontendConfidence: number | undefined): boolean {
        if (!metadata) {
            return true; // No cache found, always regenerate
        }
        return ContentCacheManager.isStale(metadata.generatedAt) ||
               ContentCacheManager.isLowConfidence(metadata.confidenceScore, frontendConfidence);
    }

    /**
     * Creates new metadata for content being saved.
     * @param {IServiceParams} params - The original service parameters.
     * @param {number} confidenceScore - The confidence score for the new content (default 1.0).
     * @returns {IContentMetadata} The generated metadata object.
     */
    static createNewMetadata(params: IServiceParams, confidenceScore: number = 1.0): IContentMetadata {
        return {
            generatedAt: new Date().toISOString(),
            confidenceScore: confidenceScore,
            topicId: params.topicId,
            level: params.level,
            title: params.title,
            description: params.description,
        };
    }
}