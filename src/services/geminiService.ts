import { SimulationResult, CorporateContext, SimulationArtifact } from '../types';

const API_BASE = '/api';

async function apiFetch<T>(endpoint: string, body: Record<string, any>): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `Server error: ${res.status}` }));
    throw new Error(err.error || `Request failed with status ${res.status}`);
  }

  return res.json();
}

export async function generateCorporateContext(objective: string): Promise<CorporateContext> {
  return apiFetch<CorporateContext>('/context', { objective });
}

export async function runSimulation(
  objective: string,
  context: CorporateContext,
  artifacts: SimulationArtifact[] = []
): Promise<SimulationResult> {
  return apiFetch<SimulationResult>('/simulate', { objective, context, artifacts });
}
