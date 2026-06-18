# 🚀 agent-3d-mesh

<div align="center">

[![npm version](https://img.shields.io/npm/v/agent-3d-mesh?style=for-the-badge&color=CB3837&logo=npm)](https://www.npmjs.com/package/agent-3d-mesh)
[![GitHub stars](https://img.shields.io/github/stars/BrianS-TICS/agent-3d-mesh?style=for-the-badge&color=FFD700&logo=github)](https://github.com/BrianS-TICS/agent-3d-mesh/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=node.js)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript)](https://typescriptlang.org)
[![Gemini](https://img.shields.io/badge/Google%20Gemini-AI-4285F4?style=for-the-badge&logo=google)](https://ai.google.dev)
[![Tripo3D](https://img.shields.io/badge/Tripo3D-API-FF6B6B?style=for-the-badge)](https://tripo3d.ai)

**A multimodal AI orchestrator that turns text prompts and images into production-ready `.glb` 3D meshes — powered by Google Gemini + Tripo3D.**

[🔥 Live Demo](#-demo) · [📦 NPM Package](https://www.npmjs.com/package/agent-3d-mesh) · [📖 Docs](#-architecture-overview) · [🚀 Quick Start](#-quick-start)

</div>

---

## 🎯 What is this?

`agent-3d-mesh` is an **agentic AI pipeline** that bridges the gap between human intent and 3D creation. Instead of requiring users to write complex, technical prompts for 3D generation APIs, this library uses **Google Gemini as a semantic reasoning layer** that automatically optimizes, scores, and routes your input to the **Tripo3D mesh engine**.

The result: you type `"a rusty sci-fi robot"` and get back a fully textured, production-ready `.glb` file.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🧠 **Agentic Prompt Engine** | Gemini acts as a "3D art director" — it categorizes, scores, and rewrites prompts for optimal geometry and texture fidelity |
| 🎨 **Multimodal Input** | Generate 3D models from **text descriptions** OR **reference images** (or both combined) |
| 🖥️ **Desktop-Class UI** | A full SPA with dark mode, 3D model viewer (`<model-viewer>`), local history, and fullscreen mode |
| ⚙️ **Zero-Config Setup** | Missing API keys? The UI detects this and walks users through a beautiful Setup Modal |
| 📊 **Quality Tiers** | Supports `draft`, `standard`, and `detailed` generation modes for cost/quality tradeoffs |
| 💾 **Local History** | All generated models are saved and browsable in a local gallery with download options |
| 💸 **Built-In Monetization** | Referral links embedded in the Setup Modal allow open-source distribution with passive affiliate income |

---

## 🎬 Demo

> *The web UI runs locally. Start it with `npm run start-ui` and open `http://localhost:3000`.*

### Text to 3D Generation Flow
```
User Input: "A futuristic glowing cyberpunk sword"
    │
    ▼
┌─────────────────────────────────────────┐
│         Google Gemini Analysis          │
│  • Object Category: weapon/melee        │
│  • Complexity Score: 7.2 / 10           │
│  • Optimized Prompt: "A single-edged    │
│    katana-style energy blade with       │
│    neon-cyan plasma core, detailed      │
│    sci-fi guard, metallic PBR finish"   │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│           Tripo3D Mesh Engine           │
│  • Async job polling                    │
│  • High-fidelity PBR texture baking     │
│  • Output: output_model.glb (ready!)    │
└─────────────────────────────────────────┘
```

---

## 🏗️ Architecture Overview

This project is organized in two distinct agentic phases:

```
src/
├── core/
│   ├── GeminiAnalyzer.ts    # Phase 1: Semantic reasoning & prompt optimization
│   ├── Tripo3DClient.ts     # Phase 2: Async 3D mesh generation + polling
│   └── errors.ts            # Typed error classes
├── types/                   # Shared TypeScript interfaces
├── index.ts                 # Library entry point (npm package export)
└── server.ts                # Express backend + API proxy + file management

public/
├── app.html                 # Main SPA (Text-to-3D + Image-to-3D + Gallery)
├── docs.html                # In-app API documentation
├── index.html               # Landing page / setup modal
└── style.css                # Global design system
```

### Phase 1: Semantic Reasoning (Gemini)
The raw user prompt is sent to `GeminiAnalyzer`, which uses a structured prompt template to produce:
- `optimizedPrompt` — a technically precise description ideal for 3D generation
- `objectCategory` — classifies the object type (character, vehicle, prop, environment...)
- `complexityScore` — a 1-10 rating used to auto-select generation parameters

### Phase 2: 3D Mesh Generation (Tripo3D)
`Tripo3DClient` handles the full async lifecycle:
1. Submits the generation job
2. Polls status until completion (with exponential backoff)
3. Downloads and saves the `.glb` file locally
4. Returns metadata (model ID, file path, generation stats)

---

## 🚀 Quick Start

### Installation

```bash
npm install agent-3d-mesh
```

Or clone and run locally:

```bash
git clone https://github.com/BrianS-TICS/agent-3d-mesh.git
cd agent-3d-mesh
npm install
```

### Use as a Library (Node.js)

```typescript
import { generate3DMesh } from 'agent-3d-mesh';

const result = await generate3DMesh({
  prompt: "A detailed Viking warrior helmet with Norse engravings",
  quality: "standard"          // 'draft' | 'standard' | 'detailed'
  // image: './reference.jpg'  // Optional: attach a reference image
});

console.log(`Model saved to: ${result.filePath}`);
// → Model saved to: ./output_model.glb
```

### Run the Web UI

```bash
npm run start-ui
# Open http://localhost:3000
```

On first launch, the UI will prompt you for:
- 🔑 **Google Gemini API Key** — [Get free credits at Google AI Studio](https://aistudio.google.com)
- 🔑 **Tripo3D API Key** — [Get it here (+ bonus credits via referral)](https://studio.tripo3d.ai?via=briansanchez)

Keys are saved automatically to `.env` — no manual file editing needed.

---

## 💻 Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Node.js 18+, Express 5, TypeScript |
| **AI Orchestration** | `@google/genai` (Gemini 1.5 Pro) |
| **3D Generation** | Tripo3D Cloud API (REST) |
| **Frontend** | Vanilla HTML/CSS/JS (zero framework dependencies) |
| **3D Viewer** | `<model-viewer>` Web Component |
| **Icons** | Lucide Icons |
| **File Handling** | Multer (multipart/form-data), Node.js streams |

---

## 🔌 API Reference

### `generate3DMesh(options)`

| Parameter | Type | Default | Description |
|---|---|---|---|
| `prompt` | `string` | *required* | Natural language description of the 3D object |
| `quality` | `'draft' \| 'standard' \| 'detailed'` | `'standard'` | Generation quality tier |
| `image` | `string` (file path) | `undefined` | Optional reference image for Image-to-3D mode |
| `outputPath` | `string` | `'./output_model.glb'` | Where to save the generated `.glb` file |

**Returns:** `Promise<MeshResult>` with `{ filePath, modelId, prompt, optimizedPrompt, stats }`

---

## 🌐 Environment Variables

```env
GEMINI_API_KEY=your_google_gemini_api_key
TRIPO_API_KEY=your_tripo3d_api_key
PORT=3000
```

---

## 📄 License

MIT License — free to use, modify, and distribute. See [LICENSE](LICENSE) for details.

---

<div align="center">

**Built with ❤️ by [Brian Sanchez](https://github.com/BrianS-TICS)**

*If this project helped you, consider giving it a ⭐ on GitHub!*

</div>
