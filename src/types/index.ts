export interface AnalyzeRequest {
    prompt: string;
    imagePath?: string;
    geminiModel?: string;
    temperature?: number;
    textureQuality?: string;
    tripoEngine?: string;
}

export interface GeminiStructuredResponse {
    optimizedPrompt: string;
    objectCategory: string;
    complexityScore: number;
}

export interface GenerationResult {
    glbFilePath: string;
    analysis: GeminiStructuredResponse;
}
