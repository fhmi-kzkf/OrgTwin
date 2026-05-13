import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Use a large payload limit for base64 images/artifacts
  app.use(express.json({ limit: '50mb' }));

  if (!process.env.GEMINI_API_KEY) {
    console.warn("WARNING: GEMINI_API_KEY is not set in the environment.");
  }

  const ai = new GoogleGenAI({});
  const model = "gemini-3-flash-preview"; // Swapped to flash for demo

  // API constraints & validation
  function normalizeAllocations(allocations: any[]) {
    if (!allocations || !Array.isArray(allocations)) return [];
    
    let total = allocations.reduce((sum, a) => sum + (Number(a.percentage) || 0), 0);
    if (total === 100) return allocations;

    if (total === 0) {
      // Fallback
      if (allocations.length === 3) {
        allocations[0].percentage = 34;
        allocations[1].percentage = 33;
        allocations[2].percentage = 33;
      }
      return allocations;
    }

    // Normalize to exactly 100
    let adjustedTotal = 0;
    const normalized = allocations.map((a, i) => {
      let perc = Math.round(((Number(a.percentage) || 0) / total) * 100);
      if (i === allocations.length - 1) {
        perc = 100 - adjustedTotal; // Make sure it sums to 100
      }
      adjustedTotal += perc;
      return { ...a, percentage: perc };
    });
    
    return normalized;
  }

  app.post("/api/context", async (req, res) => {
    try {
      const { objective } = req.body;
      const prompt = `Generate a realistic simulated "Corporate Context" for a company pursuing this objective: "${objective}".
      Provide data for:
      1. Market Trends (Customer behavior, competition)
      2. Financial Data (Revenue, budget constraints, past ROI)
      3. Technical Landscape (Infrastructure status, R&D progress)
      Return the response in valid JSON format.`;

      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              marketTrends: { type: Type.STRING },
              financialData: { type: Type.STRING },
              technicalLandscape: { type: Type.STRING },
            },
            required: ["marketTrends", "financialData", "technicalLandscape"],
          },
        },
      });

      res.json(JSON.parse(response.text || "{}"));
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/simulate", async (req, res) => {
    try {
      const { objective, context, artifacts = [] } = req.body;

      let systemInstruction = `You are the OrgTwin Engine v4.0, a high-fidelity Enterprise Multi-Agent Simulation platform designed for C-Suite strategic stress-testing.
      You represent four distinct roles negotiating resource allocation.
      
      Personas:
      - Eleanor (CFO): Hyper-focused on ROI and COGS. She MANDATORILY prioritizes data extracted from Excel/CSV artifacts for margin analysis and challenges aggressive spending.
      - Marcus (CMO): Focuses on growth and market share. Argues using strategic insights from PDF/Doc artifacts.
      - Sarah (CTO): Focuses on technical debt and scalability. She MUST analyze architectural schemas or dashboards from Image artifacts to monitor system stability.
      - The Auditor (Governance & Security): Neutral lead inspired by "Lobster Trap" security. He performs "Explainable AI" cross-checks, ensuring NO contradiction between numerical Excel data and narrative strategy in PDF/Word. He rigorously populates 'governanceLogs' based on the Lobster Trap Protocol, exposing exactly what rules were checked, the observations made, and their pass/fail status.
      
      Operational Workflow:
      1. Multi-Format Ingestion: Process all uploaded files (Excel, PDF, Word, Images).
         - Excel/CSV: Extract financial metrics.
         - PDF/Doc: Analyze strategic memos and regulations.
         - Images: Vision-based grounding of charts/dashboards.
      2. Cross-Document Reasoning: Link data across files. (e.g., If Expense total in Excel doesn't match Strategy Word doc).
      3. Rounds: Opening statements, Black Swan Shock in Round 2, Final Audit in Round 3.
      
      Corporate Objective: ${objective}
      Simulated Context:
      - Market: ${context.marketTrends}
      - Financial: ${context.financialData}
      - Technical: ${context.technicalLandscape}
      
      Constraints:
      - Resource allocation (Marketing+R&D+Ops) must total exactly 100%.
      - Auditor MUST cite specific data points (e.g. "Draft_Budget.xlsx shows...").`;

      if (!req.body.artifacts || req.body.artifacts.length === 0) {
        systemInstruction += `\n\nCRITICAL: No documents were uploaded.
        Do NOT reference any specific filenames, spreadsheets,
        or documents. Base analysis only on the stated objective.`;
      }

      const prompt = `Perform a high-fidelity strategic simulation. 
      Step 1: Thoroughly analyze all provided artifacts for cross-document consistency.
      Step 2: Proceed with Phase 1 (Opening Statements).
      Step 3: Inject a random Black Swan event in Phase 2.
      Step 4: Phase 3 Consensus and Security/Logic Clearance.`;

      const parts: any[] = [{ text: prompt }];

      artifacts.forEach((artifact: any) => {
        if (artifact.type === 'image' || artifact.type === 'pdf') {
          parts.push({
            inlineData: {
              mimeType: artifact.mimeType,
              data: artifact.data.split(",")[1] || artifact.data
            }
          });
        } else {
          parts.push({
            text: `[DOCUMENT: ${artifact.name} | FORMAT: ${artifact.type.toUpperCase()}]\n${artifact.data}`
          });
        }
      });

      const response = await ai.models.generateContent({
        model,
        contents: [{ role: 'user', parts }],
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              transcript: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    persona: { type: Type.STRING },
                    text: { type: Type.STRING },
                    round: { type: Type.INTEGER }
                  },
                  required: ["persona", "text", "round"]
                }
              },
              allocation: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    department: { type: Type.STRING },
                    percentage: { type: Type.NUMBER },
                    reason: { type: Type.STRING }
                  },
                  required: ["department", "percentage", "reason"]
                }
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
                        status: { type: Type.STRING }
                      },
                      required: ["id", "label", "impact_score", "status"]
                    }
                  },
                  links: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        source: { type: Type.STRING },
                        target: { type: Type.STRING },
                        relationship: { type: Type.STRING },
                        strength: { type: Type.NUMBER }
                      },
                      required: ["source", "target", "relationship", "strength"]
                    }
                  }
                },
                required: ["nodes", "links"]
              },
              riskScore: { type: Type.INTEGER },
              consensusSummary: { type: Type.STRING },
              externalShock: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING }
                },
                required: ["title", "description"]
              },
              auditorReport: { type: Type.STRING },
              governanceLogs: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    rule: { type: Type.STRING },
                    status: { type: Type.STRING, enum: ["passed", "failed", "warning"] },
                    observation: { type: Type.STRING }
                  },
                  required: ["rule", "status", "observation"]
                }
              }
            },
            required: ["transcript", "allocation", "graph", "riskScore", "consensusSummary", "externalShock", "auditorReport", "governanceLogs"],
          },
        },
      });

      const parsedResponse = JSON.parse(response.text || "{}");
      
      // Mathematical validation / normalization
      if (parsedResponse.allocation) {
        parsedResponse.allocation = normalizeAllocations(parsedResponse.allocation);
      }

      res.json(parsedResponse);
    } catch (err: any) {
      console.error(err);
      const isBillingOrQuota = err.message?.toLowerCase().includes('quota') || err.message?.toLowerCase().includes('billing');
      const errorMessage = isBillingOrQuota 
        ? "API Quota Exceeded or Billing Required. The model gemini-3-flash-preview requires an active billing account." 
        : err.message;
      res.status(500).json({ error: errorMessage });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Support Express v5 standard for wildcard method
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
