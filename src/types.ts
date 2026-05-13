export enum Persona {
  CFO = 'CFO',
  CMO = 'CMO',
  CTO = 'CTO',
  AUDITOR = 'AUDITOR'
}

export interface Message {
  persona: Persona;
  text: string;
  round: number;
}

export interface ResourceAllocation {
  department: string;
  percentage: number;
  reason: string;
}

export interface GraphData {
  nodes: {
    id: string;
    label: string;
    impact_score: number;
    status: 'risk' | 'stable';
  }[];
  links: {
    source: string;
    target: string;
    relationship: string;
    strength: number;
  }[];
}

export interface SimulationResult {
  transcript: Message[];
  allocation: ResourceAllocation[];
  graph: GraphData;
  riskScore: number;
  consensusSummary: string;
  externalShock?: {
    title: string;
    description: string;
  };
  auditorReport: string;
  governanceLogs?: {
    rule: string;
    status: 'passed' | 'failed' | 'warning';
    observation: string;
  }[];
}

export interface CorporateContext {
  marketTrends: string;
  financialData: string;
  technicalLandscape: string;
}

export interface SimulationArtifact {
  name: string;
  type: 'image' | 'pdf' | 'excel' | 'word' | 'text';
  data: string;
  mimeType: string;
}
