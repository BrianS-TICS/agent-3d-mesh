# agent-3d-mesh 🚀

**agent-3d-mesh** is a multimodal AI orchestrator that acts as an intelligent bridge between **Google Gemini** (for semantic reasoning) and **Tripo3D** (for high-fidelity 3D mesh generation). By treating the 3D generation process as an agentic workflow, this library takes raw user intent (text or images) and outputs production-ready `.glb` models.

---

## ✨ Features

- 🧠 **Agentic Prompt Optimization**: Automatically routes your prompt through Google Gemini (using the `@google/genai` SDK) to categorize, score, and rewrite it for maximum 3D geometry and texture fidelity.
- 🎨 **Multimodal Inputs**: Generates fully textured PBR models from simple text prompts or by attaching an optional reference image.
- 🖥️ **Desktop-Class UI (SPA)**: Includes a sleek, dark-mode web application (built with Vanilla JS and CSS) featuring independent custom scrollbars, fullscreen 3D model viewers, and local history tracking.
- ⚙️ **Dynamic Zero-Config Setup**: Forget about managing `.env` files manually. The UI intercepts missing API keys and prompts users through a beautiful Setup Modal.
- 💸 **Built-In Monetization**: The Setup Modal is strategically designed to include your personal Tripo3D referral links, allowing you to distribute this tool open-source while passively earning affiliate commissions.

---

## 🛠️ Architecture Overview

This project is broken down into two distinct phases:

1. **Phase 1: Semantic Reasoning (Gemini)**
   The prompt is passed to Google Gemini to understand the user's intent. Gemini acts as an expert technical director, outputting a structured JSON payload containing an `optimizedPrompt`, an `objectCategory`, and a `complexityScore`.
   
2. **Phase 2: 3D Mesh Generation (Tripo3D)**
   The refined parameters are automatically passed to the Tripo3D Cloud API. The application intelligently handles file streams, token uploads (for images), asynchronous polling, and finally downloads the `.glb` mesh directly to the local file system.

---

## 🚀 Quick Start

### 1. Installation
Clone the repository and install the dependencies:
```bash
git clone https://github.com/yourusername/agent-3d-mesh.git
cd agent-3d-mesh
npm install
```

### 2. Running the UI
Start the local Express server and frontend UI:
```bash
npm run start-ui
```
Open your browser and navigate to `http://localhost:3000`.

### 3. API Keys Setup
When you first launch the UI, you will be prompted to enter your:
- **Google Gemini API Key**
- **Tripo3D API Key** *(Need one? [Get it here](https://studio.tripo3d.ai?via=briansanchez) for bonus credits!)*

These keys are automatically saved securely to your `.env` file via the backend.

---

## 💻 Tech Stack
- **Backend:** Node.js, Express, TypeScript
- **AI SDKs:** `@google/genai`
- **Frontend:** Vanilla HTML/CSS/JS, [Lucide Icons](https://lucide.dev/), `<model-viewer>`
- **Compilation:** `ts-node`, `tsc`

---

## 📄 Documentation
For an in-depth architectural breakdown and API documentation, run the server and click on the **Documentation** link in the top navigation bar, or navigate to `/docs.html`.

## 📜 License
MIT License. Feel free to use, modify, and distribute!
