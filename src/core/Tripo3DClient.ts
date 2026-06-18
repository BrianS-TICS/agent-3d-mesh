import fs from 'fs';
import path from 'path';
import { Tripo3DError } from './errors';

const TRIPO_API_BASE = 'https://api.tripo3d.ai/v2/openapi';

export class Tripo3DClient {
    private apiKey: string | null = null;

    constructor(apiKey?: string) {
        const key = apiKey || process.env.TRIPO_API_KEY;
        if (key) {
            this.apiKey = key;
        } else {
            console.warn('[Tripo3DClient] Started without TRIPO_API_KEY. Operations will fail if called.');
        }
    }

    /**
     * Submits a generation task to Tripo3D.
     */
    async generate3DModel(prompt: string, imagePath?: string, textureQuality: string = 'standard', tripoEngine: string = 'default'): Promise<string> {
        if (!this.apiKey) {
            throw new Tripo3DError("Tripo3D API Key is missing. Configure it in .env");
        }
        // Step 1: Submit task
        let payload: any = {};
        
        if (imagePath && fs.existsSync(imagePath)) {
            console.log(`[Tripo3DClient] Uploading image to Tripo3D: ${imagePath}`);
            const fileBuffer = fs.readFileSync(imagePath);
            const fileBlob = new Blob([fileBuffer]);
            
            const formData = new FormData();
            formData.append('file', fileBlob, path.basename(imagePath));
            
            const uploadResponse = await fetch(`${TRIPO_API_BASE}/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: formData
            });
            const uploadData: any = await uploadResponse.json();
            
            if (uploadData.code !== 0) {
                throw new Tripo3DError(`Tripo3D Upload Error: ${uploadData.message}`);
            }
            
            console.log(`[Tripo3DClient] Upload success. Token: ${uploadData.data.image_token}`);
            payload = {
                type: "image_to_model",
                model_version: tripoEngine,
                file: {
                    type: path.extname(imagePath).substring(1) || "jpg",
                    file_token: uploadData.data.image_token
                },
                texture_quality: textureQuality
            };
        } else {
            payload = {
                type: "text_to_model",
                model_version: tripoEngine,
                prompt: prompt,
                texture_quality: textureQuality
            };
        }

        console.log(`[Tripo3DClient] Submitting task with payload type: "${payload.type}"...`);

        const submitResponse = await fetch(`${TRIPO_API_BASE}/task`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const submitData: any = await submitResponse.json();

        if (submitData.code !== 0) {
            throw new Tripo3DError(`Tripo3D API Error: ${submitData.message}`);
        }

        const taskId = submitData.data.task_id;
        console.log(`[Tripo3DClient] Task submitted. Task ID: ${taskId}. Polling for completion...`);

        // Step 2: Poll for completion
        let resultUrl = '';
        while (true) {
            await new Promise(resolve => setTimeout(resolve, 3000)); // Poll every 3 seconds

            const pollResponse = await fetch(`${TRIPO_API_BASE}/task/${taskId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`
                }
            });

            const pollData: any = await pollResponse.json();

            if (pollData.code !== 0) {
                throw new Tripo3DError(`Tripo3D API Error: ${pollData.message}`);
            }

            const status = pollData.data.status;
            console.log(`[Tripo3DClient] Task ${taskId} status: ${status}...`);

            if (status === 'success') {
                console.log(`[Tripo3DClient] Task output: ${JSON.stringify(pollData.data.output)}`);
                
                // Tripo v2 API stores the result in data.output, usually data.output.model
                // We also fallback to v1 structure just in case.
                const output = pollData.data.output || {};
                resultUrl = output.model || output.base_model || output.pbr_model || pollData.data.result?.model?.url;
                
                if (!resultUrl) {
                    // Fallback: search for any URL in the output object
                    resultUrl = Object.values(output).find(v => typeof v === 'string' && v.startsWith('http')) as string;
                }

                if (!resultUrl) {
                    throw new Tripo3DError(`Could not find the model URL in the Tripo3D response: ${JSON.stringify(pollData)}`);
                }
                break;
            } else if (status === 'failed' || status === 'cancelled') {
                throw new Tripo3DError(`Tripo3D Task failed: ${status}`);
            }
        }

        // Step 3: Download the .glb file
        console.log(`[Tripo3DClient] Generation successful. Downloading model from ${resultUrl}...`);
        const modelResponse = await fetch(resultUrl);
        const arrayBuffer = await modelResponse.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const uploadsDir = path.resolve(process.cwd(), 'uploads');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir);
        }

        const glbFilePath = path.join(uploadsDir, `tripo_${taskId}.glb`);
        fs.writeFileSync(glbFilePath, buffer);

        console.log(`[Tripo3DClient] Model downloaded and saved to: ${glbFilePath}`);
        return glbFilePath;
    }
}
