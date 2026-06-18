import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import dotenv from 'dotenv';
import { MeshPipeline } from './index';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Set up Multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Ensure keys are available
const geminiApiKey = process.env.GEMINI_API_KEY;
const tripoApiKey = process.env.TRIPO_API_KEY;

let pipeline = new MeshPipeline(geminiApiKey, tripoApiKey);

// Serve static files from 'public' directory
app.use(express.static(path.join(__dirname, '../public')));

// API endpoint for Phase 1: Gemini Analysis
app.post('/api/analyze', upload.single('image'), async (req, res) => {
    try {
        const prompt = req.body.prompt;
        const geminiModel = req.body.geminiModel || 'gemini-1.5-pro';
        const temperature = parseFloat(req.body.temperature || '1.0');
        const imageFile = req.file;

        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        let imagePath;
        if (imageFile) {
            imagePath = path.resolve(imageFile.path);
        }

        const useGemini = req.body.useGemini !== 'false';

        console.log(`[Server] Phase 1 - Gemini Analysis (Enabled: ${useGemini})`);
        
        let analysis;
        if (useGemini) {
            analysis = await pipeline.analyzer.analyze(prompt, imagePath, geminiModel, temperature);
        } else {
            analysis = {
                optimizedPrompt: prompt,
                objectCategory: "Bypassed",
                complexityScore: 0
            };
        }

        res.json({
            imagePath, // Retain image path for the next step
            analysis
        });
    } catch (error: any) {
        console.error('[Server] Analyze Error:', error.message);
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ error: error.message || 'Error during analysis' });
    }
});

// API endpoint for Phase 2: Tripo3D Generation
app.post('/api/render', express.json(), async (req, res) => {
    try {
        const { optimizedPrompt, imagePath, textureQuality, tripoEngine } = req.body;

        if (!optimizedPrompt) {
            return res.status(400).json({ error: 'Optimized prompt is required' });
        }

        console.log(`[Server] Phase 2 - Tripo3D Generation`);
        const glbFilePath = await pipeline.bridge.generate3DModel(optimizedPrompt, imagePath, textureQuality, tripoEngine);

        // Clean up the temporary image
        if (imagePath && fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }

        res.json({ glbFilePath });
    } catch (error: any) {
        console.error('[Server] Render Error:', error.message);
        const { imagePath } = req.body;
        if (imagePath && fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }
        res.status(500).json({ error: error.message || 'Error during 3D generation' });
    }
});

// Endpoint to serve the generated 3D model
app.get('/api/model', (req, res) => {
    const glbPath = req.query.path as string;
    if (!glbPath || !fs.existsSync(glbPath)) {
        return res.status(404).json({ error: 'Model file not found' });
    }
    res.setHeader('Content-Type', 'model/gltf-binary');
    res.sendFile(glbPath);
});

// Endpoint to rename a generated model
app.post('/api/rename', express.json(), (req, res) => {
    const { oldPath, newName } = req.body;
    if (!oldPath || !newName) return res.status(400).json({ error: 'Missing oldPath or newName' });

    const uploadsDir = path.resolve(process.cwd(), 'uploads');
    
    // Simple path traversal check
    if (!oldPath.includes(uploadsDir)) {
        return res.status(403).json({ error: 'Invalid path' });
    }

    // Ensure it ends with .glb and contains no dangerous characters
    const safeName = newName.replace(/[^a-zA-Z0-9_\-]/g, '_');
    const newFileName = safeName.endsWith('.glb') ? safeName : safeName + '.glb';
    const newPath = path.join(uploadsDir, newFileName);

    try {
        if (fs.existsSync(newPath)) {
            return res.status(400).json({ error: 'A file with that name already exists' });
        }
        fs.renameSync(oldPath, newPath);
        res.json({ success: true, newPath });
    } catch (e: any) {
        console.error('[Server] Failed to rename file:', e.message);
        res.status(500).json({ error: 'Failed to rename file' });
    }
});

// Endpoint to open file in Windows Explorer
app.post('/api/open-explorer', express.json(), (req, res) => {
    const glbPath = req.body.path;
    if (!glbPath || !fs.existsSync(glbPath)) {
        return res.status(404).json({ error: 'Model file not found' });
    }

    // Command to open explorer and select the file on Windows
    exec(`explorer.exe /select,"${glbPath}"`, (error) => {
        if (error) {
            console.error('[Server] Failed to open explorer:', error);
            return res.status(500).json({ error: 'Failed to open file manager' });
        }
        res.json({ success: true });
    });
});

// Endpoint to configure API keys dynamically
app.post('/api/config', express.json(), (req, res) => {
    const { geminiKey, tripoKey } = req.body;
    const envPath = path.resolve(process.cwd(), '.env');
    
    try {
        let envContent = '';
        if (fs.existsSync(envPath)) {
            envContent = fs.readFileSync(envPath, 'utf-8');
        }

        const updateEnvVar = (content: string, key: string, value: string) => {
            const regex = new RegExp(`^#?\\s*${key}\\s*=.*$`, 'm');
            if (regex.test(content)) {
                return content.replace(regex, `${key}=${value}`);
            } else {
                return content + `\n${key}=${value}`;
            }
        };

        if (geminiKey) {
            envContent = updateEnvVar(envContent, 'GEMINI_API_KEY', geminiKey);
            process.env.GEMINI_API_KEY = geminiKey;
        }
        
        if (tripoKey) {
            envContent = updateEnvVar(envContent, 'TRIPO_API_KEY', tripoKey);
            process.env.TRIPO_API_KEY = tripoKey;
        }

        fs.writeFileSync(envPath, envContent.trim() + '\n', 'utf-8');
        console.log('[Server] Successfully updated .env keys via UI.');

        // Re-instantiate the pipeline with new keys
        pipeline = new MeshPipeline(process.env.GEMINI_API_KEY, process.env.TRIPO_API_KEY);

        res.json({ success: true });
    } catch (error) {
        console.error('[Server] Failed to write to .env:', error);
        res.status(500).json({ error: 'Failed to update configuration.' });
    }
});

// Endpoint to fetch history of generated models
app.get('/api/history', (req, res) => {
    const uploadsDir = path.resolve(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
        return res.json({ files: [] });
    }

    try {
        const files = fs.readdirSync(uploadsDir);
        const glbFiles = files
            .filter(f => f.endsWith('.glb'))
            .map(f => {
                const filePath = path.join(uploadsDir, f);
                const stats = fs.statSync(filePath);
                return {
                    name: f,
                    path: filePath,
                    time: stats.mtimeMs
                };
            })
            .sort((a, b) => b.time - a.time) // Sort newest first
            .map(f => ({
                name: f.name,
                path: f.path,
                url: `/api/model?path=${encodeURIComponent(f.path)}`,
                date: new Date(f.time).toLocaleString()
            }));

        res.json({ files: glbFiles });
    } catch (e: any) {
        console.error('[Server] Failed to read history:', e.message);
        res.status(500).json({ error: 'Failed to read history' });
    }
});

// Endpoint to fetch real API status
app.get('/api/status', async (req, res) => {
    try {
        let tripoBalance = 0;
        let tripoConnected = false;

        if (process.env.TRIPO_API_KEY) {
            const tripoRes = await fetch('https://api.tripo3d.ai/v2/openapi/user/balance', {
                headers: { 'Authorization': `Bearer ${process.env.TRIPO_API_KEY}` }
            });
            if (tripoRes.ok) {
                const tripoData: any = await tripoRes.json();
                if (tripoData.code === 0) {
                    tripoBalance = tripoData.data.balance;
                    tripoConnected = true;
                }
            }
        }

        res.json({
            geminiConnected: !!process.env.GEMINI_API_KEY,
            tripoConnected,
            tripoBalance
        });
    } catch (e) {
        res.json({
            geminiConnected: !!process.env.GEMINI_API_KEY,
            tripoConnected: false,
            tripoBalance: 0
        });
    }
});

// Endpoint to import an existing Tripo3D Task by ID
app.post('/api/import-task', express.json(), async (req, res) => {
    try {
        const { taskId } = req.body;
        if (!taskId) return res.status(400).json({ error: 'Task ID is required' });
        if (!process.env.TRIPO_API_KEY) return res.status(400).json({ error: 'Tripo3D API Key missing' });

        console.log(`[Server] Importing Task ID: ${taskId}...`);
        
        // Fetch task from Tripo
        const pollResponse = await fetch(`https://api.tripo3d.ai/v2/openapi/task/${taskId}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${process.env.TRIPO_API_KEY}` }
        });
        const pollData: any = await pollResponse.json();

        if (pollData.code !== 0) throw new Error(pollData.message);
        if (pollData.data.status !== 'success') throw new Error(`Task status is ${pollData.data.status}. Cannot download.`);

        const output = pollData.data.output || {};
        let resultUrl = output.model || output.base_model || output.pbr_model || pollData.data.result?.model?.url;
        if (!resultUrl) {
            resultUrl = Object.values(output).find(v => typeof v === 'string' && v.startsWith('http')) as string;
        }
        if (!resultUrl) throw new Error('Model URL not found in task output');

        console.log(`[Server] Downloading model from ${resultUrl}...`);
        const modelResponse = await fetch(resultUrl);
        const arrayBuffer = await modelResponse.arrayBuffer();
        
        const uploadsDir = path.resolve(process.cwd(), 'uploads');
        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

        const glbFilePath = path.join(uploadsDir, `tripo_import_${taskId}.glb`);
        fs.writeFileSync(glbFilePath, Buffer.from(arrayBuffer));

        res.json({ success: true, path: glbFilePath, url: `/api/model?path=${encodeURIComponent(glbFilePath)}` });
    } catch (e: any) {
        console.error('[Server] Failed to import task:', e.message);
        res.status(500).json({ error: e.message || 'Failed to import task' });
    }
});

// Create uploads dir if it doesn't exist
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

app.listen(port, () => {
    console.log(`\n========================================`);
    console.log(`🚀 Agentic Infrastructure UI is live!`);
    console.log(`💻 Open http://localhost:${port} in your browser.`);
    console.log(`========================================\n`);
});
