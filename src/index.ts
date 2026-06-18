import { GeminiAnalyzer } from './core/GeminiAnalyzer';
import { Tripo3DClient } from './core/Tripo3DClient';
import { AnalyzeRequest, GenerationResult } from './types';
export * from './types';
export * from './core/errors';

/**
 * Main Pipeline Orchestrator that unifies the cloud reasoning and 3D generation.
 */
export class MeshPipeline {
    public analyzer: GeminiAnalyzer;
    public bridge: Tripo3DClient;

    /**
     * @param geminiApiKey Optional API key.
     * @param tripoApiKey Optional Tripo3D API key.
     */
    constructor(geminiApiKey?: string, tripoApiKey?: string) {
        this.analyzer = new GeminiAnalyzer(geminiApiKey);
        this.bridge = new Tripo3DClient(tripoApiKey);
    }

    /**
     * Executes the complete pipeline:
     * 1. Uses Gemini to analyze and optimize the prompt.
     * 2. Uses the Tripo3D API to generate the 3D mesh based on the optimized prompt.
     * 
     * @param request Input containing the raw prompt and optional image.
     * @returns GenerationResult containing the path to the 3D model and the analysis metadata.
     */
    async runPipeline(request: AnalyzeRequest): Promise<GenerationResult> {
        console.log(`[MeshPipeline] Step 1: Analyzing prompt using Gemini...`);
        const analysis = await this.analyzer.analyze(request.prompt, request.imagePath, request.geminiModel, request.temperature);
        console.log(`[MeshPipeline] Optimization complete: ${analysis.optimizedPrompt} (Category: ${analysis.objectCategory}, Complexity: ${analysis.complexityScore}/10)`);

        console.log(`[MeshPipeline] Step 2: Offloading generation to Tripo3D API...`);
        const glbFilePath = await this.bridge.generate3DModel(analysis.optimizedPrompt, request.imagePath, request.textureQuality, request.tripoEngine);
        console.log(`[MeshPipeline] Generation complete! Output saved to: ${glbFilePath}`);

        return {
            glbFilePath,
            analysis
        };
    }
}
