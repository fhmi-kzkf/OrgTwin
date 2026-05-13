import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

// --- Config ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const PORT = parseInt(process.env.PORT || '3001', 10);
const apiKey = process.env.GEMINI_API_KEY;

// Don't process.exit in serverless — lazily check per-request instead
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;
const MODEL = 'gemini-3.1-flash-lite-preview';
const PersonaValues = ['CFO', 'CMO', 'CTO', 'AUDITOR'];

const app = express();

// --- Security Middleware ---
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Rate limiter (in-memory)
const rateStore = new Map<string, { count: number; resetAt: number }>();
function rateLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const entry = rateStore.get(ip);
  if (!entry || now > entry.resetAt) {
    rateStore.set(ip, { count: 1, resetAt: now + 60_000 });
    return next();
  }
  if (entry.count >= 10) {
    return res.status(429).json({ error: 'Rate limit exceeded. Max 10 req/min.' });
  }
  entry.count++;
  return next();
}
app.use('/api', rateLimiter);

// --- Helpers ---
function sanitize(text: string, maxLen = 2000): string {
  if (typeof text !== 'string') return '';
  return text.slice(0, maxLen).replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();
}

function normalizeAllocations(allocs: any[]): any[] {
  if (!Array.isArray(allocs) || !allocs.length) return allocs;
  const total = allocs.reduce((s: number, a: any) => s + (Number(a.percentage) || 0), 0);
  if (total === 0 || Math.abs(total - 100) < 0.5) return allocs;
  console.log(`[Validation] Normalizing allocations from ${total}% → 100%`);
  return allocs.map(a => ({
    ...a,
    percentage: Math.round(((Number(a.percentage) || 0) / total) * 1000) / 10,
  }));
}

function safeJsonParse(text: string | undefined, fallback: any = {}) {
  try { return JSON.parse(text || '{}'); }
  catch (e) { console.error('[Parse Error]', e); return fallback; }
}

// --- POST /api/context ---
app.post('/api/context', async (req: Request, res: Response) => {
  try {
    if (!ai) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
    }

    const objective = sanitize(req.body?.objective);
    if (!objective) return res.status(400).json({ error: 'Objective is required.' });

    const prompt = `Generate a realistic simulated "Corporate Context" for a company pursuing this objective: "${objective}".
    Provide data for:
    1. Market Trends (Customer behavior, competition)
    2. Financial Data (Revenue, budget constraints, past ROI)
    3. Technical Landscape (Infrastructure status, R&D progress)
    Return the response in valid JSON format.`;

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            marketTrends: { type: Type.STRING },
            financialData: { type: Type.STRING },
            technicalLandscape: { type: Type.STRING },
          },
          required: ['marketTrends', 'financialData', 'technicalLandscape'],
        },
      },
    });

    const data = safeJsonParse(response.text);
    res.json(data);
  } catch (err: any) {
    console.error('[/api/context Error]', err.message, err.stack);
    res.status(500).json({ error: `Context generation failed: ${err.message}` });
  }
});

// --- POST /api/simulate ---
app.post('/api/simulate', async (req: Request, res: Response) => {
  try {
    if (!ai) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
    }

    const { objective: rawObj, context, artifacts = [] } = req.body || {};
    const objective = sanitize(rawObj);
    if (!objective || !context) {
      return res.status(400).json({ error: 'Objective and context are required.' });
    }

    // Validate artifacts payload size
    const payloadSize = JSON.stringify(artifacts).length;
    if (payloadSize > 40_000_000) {
      return res.status(413).json({ error: 'Artifacts payload too large. Max 40MB.' });
    }

    const systemInstruction = `You are the OrgTwin Engine v4.0, a high-fidelity Enterprise Multi-Agent Simulation platform designed for C-Suite strategic stress-testing.
    You represent four distinct roles negotiating resource allocation.
    
    Personas:
    - Eleanor (CFO): Hyper-focused on ROI and COGS. She MANDATORILY prioritizes data extracted from Excel/CSV artifacts for margin analysis and challenges aggressive spending.
    - Marcus (CMO): Focuses on growth and market share. Argues using strategic insights from PDF/Doc artifacts.
    - Sarah (CTO): Focuses on technical debt and scalability. She MUST analyze architectural schemas or dashboards from Image artifacts to monitor system stability.
    - The Auditor (Governance & Security): Neutral lead inspired by "Lobster Trap" security. He performs "Explainable AI" cross-checks, ensuring NO contradiction between numerical Excel data and narrative strategy in PDF/Word.
    
    Operational Workflow:
    1. Multi-Format Ingestion: Process all uploaded files (Excel, PDF, Word, Images).
       - Excel/CSV: Extract financial metrics.
       - PDF/Doc: Analyze strategic memos and regulations.
       - Images: Vision-based grounding of charts/dashboards.
    2. Cross-Document Reasoning: Link data across files.
    3. Rounds: Opening statements, Black Swan Shock in Round 2, Final Audit in Round 3.
    
    Corporate Objective: ${objective}
    Simulated Context:
    - Market: ${sanitize(context.marketTrends, 5000)}
    - Financial: ${sanitize(context.financialData, 5000)}
    - Technical: ${sanitize(context.technicalLandscape, 5000)}
    
    Constraints:
    - Resource allocation (Marketing+R&D+Ops) must total exactly 100%.
    - Auditor MUST cite specific data points.`;

    const prompt = `Perform a high-fidelity strategic simulation.
    Step 1: Thoroughly analyze all provided artifacts for cross-document consistency.
    Step 2: Proceed with Phase 1 (Opening Statements).
    Step 3: Inject a random Black Swan event in Phase 2.
    Step 4: Phase 3 Consensus and Security/Logic Clearance.`;

    const parts: any[] = [{ text: prompt }];
    for (const artifact of artifacts) {
      if (artifact.type === 'image' || artifact.type === 'pdf') {
        parts.push({
          inlineData: {
            mimeType: artifact.mimeType,
            data: (artifact.data || '').split(',')[1] || artifact.data,
          },
        });
      } else {
        parts.push({
          text: `[DOCUMENT: ${sanitize(artifact.name, 200)} | FORMAT: ${(artifact.type || '').toUpperCase()}]\n${artifact.data}`,
        });
      }
    }

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [{ role: 'user', parts }],
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            transcript: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  persona: { type: Type.STRING, enum: PersonaValues },
                  text: { type: Type.STRING },
                  round: { type: Type.INTEGER },
                },
                required: ['persona', 'text', 'round'],
              },
            },
            allocation: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  department: { type: Type.STRING },
                  percentage: { type: Type.NUMBER },
                  reason: { type: Type.STRING },
                },
                required: ['department', 'percentage', 'reason'],
              },
            },
            graph: {
              type: Type.OBJECT,
              properties: {
                nodes: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      label: { type: Type.STRING },
                      impact_score: { type: Type.INTEGER },
                      status: { type: Type.STRING, enum: ['risk', 'stable'] },
                    },
                    required: ['id', 'label', 'impact_score', 'status'],
                  },
                },
                links: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      source: { type: Type.STRING },
                      target: { type: Type.STRING },
                      relationship: { type: Type.STRING },
                      strength: { type: Type.NUMBER },
                    },
                    required: ['source', 'target', 'relationship', 'strength'],
                  },
                },
              },
              required: ['nodes', 'links'],
            },
            riskScore: { type: Type.INTEGER },
            consensusSummary: { type: Type.STRING },
            externalShock: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
              },
              required: ['title', 'description'],
            },
            auditorReport: { type: Type.STRING },
          },
          required: ['transcript', 'allocation', 'graph', 'riskScore', 'consensusSummary', 'externalShock', 'auditorReport'],
        },
      },
    });

    const result = safeJsonParse(response.text);

    // Post-processing: normalize allocations to 100%
    if (result.allocation) {
      result.allocation = normalizeAllocations(result.allocation);
    }

    res.json(result);
  } catch (err: any) {
    console.error('[/api/simulate Error]', err.message, err.stack);
    res.status(500).json({ error: `Simulation failed: ${err.message}` });
  }
});

// --- Production: serve frontend ---
if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
  const distPath = path.join(__dirname, '../dist');
  app.use(express.static(distPath));
  app.get('*', (_req: Request, res: Response) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`[OrgTwin Server] Running on port ${PORT}`);
    console.log(`[OrgTwin Server] Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

export default app;
