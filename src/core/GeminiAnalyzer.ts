import { GoogleGenAI, Type } from '@google/genai';
import { GeminiStructuredResponse } from '../types';
import { GeminiAPIError } from './errors';

import * as fs from 'fs';
import * as path from 'path';

export class GeminiAnalyzer {
    private ai: GoogleGenAI | null = null;

    constructor(apiKey?: string) {
        const key = apiKey || process.env.GEMINI_API_KEY;
        if (key) {
            try {
                this.ai = new GoogleGenAI({ apiKey: key });
            } catch (error: any) {
                console.error(`[GeminiAnalyzer] Failed to initialize GoogleGenAI client: ${error.message}`);
            }
        } else {
            console.warn('[GeminiAnalyzer] Started without GEMINI_API_KEY. Analysis will fail if called.');
        }
    }

    /**
     * Analyzes the raw text and image to extract a structured generation prompt.
     */
    async analyze(rawPrompt: string, imagePath?: string, geminiModel: string = 'gemini-1.5-pro', temperature: number = 1.0): Promise<GeminiStructuredResponse> {
        if (!this.ai) {
            throw new GeminiAPIError('GEMINI_API_KEY is missing. Configure it in .env');
        }
        
        try {
            const parts: any[] = [
                { text: `Analyze the following prompt and image (if provided) for generating a 3D model: "${rawPrompt}". Provide an optimized prompt for a 3D image-to-3D or text-to-3D engine. Also categorize the object and estimate its complexity from 1 to 10.` }
            ];

            if (imagePath && fs.existsSync(imagePath)) {
                const ext = path.extname(imagePath).toLowerCase();
                let mimeType = 'image/jpeg';
                if (ext === '.png') mimeType = 'image/png';
                if (ext === '.webp') mimeType = 'image/webp';

                parts.push({
                    inlineData: {
                        data: fs.readFileSync(imagePath).toString("base64"),
                        mimeType
                    }
                });
            }

            const response = await this.ai.models.generateContent({
                model: geminiModel,
                contents: [
                    {
                        role: 'user',
                        parts
                    }
                ],
                config: {
                    temperature: temperature,
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            optimizedPrompt: {
                                type: Type.STRING,
                                description: 'The optimized prompt for the 3D generation engine.'
                            },
                            objectCategory: {
                                type: Type.STRING,
                                description: 'The category of the object (e.g., character, prop, vehicle, environment).'
                            },
                            complexityScore: {
                                type: Type.INTEGER,
                                description: 'Complexity score from 1 (simple primitives) to 10 (highly detailed characters or environments).'
                            }
                        },
                        required: ['optimizedPrompt', 'objectCategory', 'complexityScore']
                    }
                }
            });

            if (!response.text) {
                throw new GeminiAPIError('Received empty response from Gemini API.');
            }

            const parsedResponse = JSON.parse(response.text) as GeminiStructuredResponse;
            return parsedResponse;
        } catch (error: any) {
            let cleanMessage = error.message || 'Unknown error occurred.';
            
            // The Google GenAI SDK sometimes returns raw JSON strings inside error.message
            if (cleanMessage.startsWith('{')) {
                try {
                    const parsed = JSON.parse(cleanMessage);
                    // Handle standard Google Cloud API error format
                    if (parsed.error && parsed.error.message) {
                        cleanMessage = parsed.error.message;
                    } else if (parsed.message) {
                        cleanMessage = parsed.message;
                    }
                } catch (e) {
                    // Ignore JSON parse errors, just use the raw string
                }
            }

            if (error.status === 401 || error.status === 403 || cleanMessage.includes('API key not valid')) {
                throw new GeminiAPIError('Invalid or unauthorized Google Gemini API Key. Please click "Save & Connect" in the configuration modal with a valid key.');
            }
            throw new GeminiAPIError(cleanMessage);
        }
    }
}
