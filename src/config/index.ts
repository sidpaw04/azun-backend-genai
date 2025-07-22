// src/config/index.ts
interface AppConfig {
    geminiApiKey: string;
    contentCacheDurationHours: number;
    minConfidenceForRegen: number;
    geminiModel: string;
}

const config: AppConfig = {
    geminiApiKey: process.env.GEMINI_API_KEY || '', // Access GEMINI_API_KEY from .env
    contentCacheDurationHours: 24, // Content is valid for 24 hours
    minConfidenceForRegen: 0.6, // If confidence drops below this, regenerate
    geminiModel: 'gemini-1.5-flash-latest' // The Gemini model to use
};

// Basic validation for critical configuration
if (!config.geminiApiKey) {
    console.error("❌ GEMINI_API_KEY is not set in the .env file!");
    // In a production environment, you might throw an error or exit the process
    // to prevent the application from running without necessary credentials.
    process.exit(1);
}

export default config;