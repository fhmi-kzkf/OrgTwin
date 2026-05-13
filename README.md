<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# OrgTwin Engine // Strategic Stress-Testing Sandbox

**OrgTwin Engine** is an intelligent, agent-driven platform designed for C-Suite strategic stress-testing and resource negotiation. Built for the Google AI Studio Hackathon, it leverages the multimodal capabilities and advanced reasoning of the **Gemini API** to simulate complex corporate decisions.

## 🎯 Hackathon Highlights
- **Agent-Driven Workflow**: Simulates four distinct AI personas (CFO, CMO, CTO, Auditor) negotiating over strategy.
- **Multimodal Understanding**: Ingests and reasons across diverse formats including `.xlsx` (financials), `.pdf` (memos), and images (charts).
- **Security-First Architecture**: Features a robust Express backend to secure API keys, implement rate limiting, and sanitize inputs, ensuring enterprise-grade safety.

## 🛠 Tech Stack
- **Frontend**: React 19, Vite, Tailwind CSS v4, Framer Motion, D3.js.
- **Backend**: Node.js, Express, Google Gen AI SDK (`@google/genai`).
- **AI Model**: `gemini-2.5-flash-preview` (Optimized for rapid multi-turn simulations).

## 🚀 Run Locally

**Prerequisites:** Node.js v18+

1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure Environment:
   Copy the example env file and add your Gemini API Key.
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` and set `GEMINI_API_KEY="your_api_key_here"`.
3. Start the application (starts both Vite and the Express API concurrently):
   ```bash
   npm run dev
   ```

## ☁️ Deploy to Vercel (Free, No Credit Card Required)

This application is configured natively for Vercel using `vercel.json` and a Serverless Function bridge (`api/index.ts`).

1. **Push your code to GitHub**:
   Commit all your files (including `vercel.json` and `api/index.ts`) and push them to a new repository on GitHub.
2. **Import to Vercel**:
   Go to [vercel.com](https://vercel.com), click **Add New Project**, and select your GitHub repository.
3. **Configure Environment Variables**:
   Before clicking "Deploy", open the **Environment Variables** section. Add the following key:
   - **Name**: `GEMINI_API_KEY`
   - **Value**: `your_actual_gemini_api_key`
4. **Deploy**:
   Click **Deploy**. Vercel will automatically build the React frontend and deploy your Express backend as a Serverless API.

> **Note:** The API endpoints (`/api/context` and `/api/simulate`) will automatically route securely via Vercel's serverless infrastructure. No keys will be exposed to the client!
