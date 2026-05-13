import { Persona } from './types';

export const PERSONA_CONFIGS = {
  [Persona.CFO]: {
    name: 'Eleanor Vance',
    role: 'Chief Financial Officer',
    trait: 'ROI-focused, Risk-averse',
    description: 'Focuses on ROI, COGS, and 12% inflation impact. Hyper-vigilant about bottom-line stability.',
    color: '#ef4444', // Red-500
  },
  [Persona.CMO]: {
    name: 'Marcus Thorne',
    role: 'Chief Marketing Officer',
    trait: 'Growth-oriented, Aggressive',
    description: 'Focuses on 5% churn, market share, and AI-driven CX. Pushes for aggressive customer acquisition.',
    color: '#3b82f6', // Blue-500
  },
  [Persona.CTO]: {
    name: 'Dr. Sarah Chen',
    role: 'Chief Technology Officer',
    trait: 'Innovation-focused, Infrastructure-oriented',
    description: 'Focuses on 6-month AI lag, technical debt, and scalability. Infrastructure-first growth.',
    color: '#10b981', // Emerald-500
  },
  [Persona.AUDITOR]: {
    name: 'The Auditor',
    role: 'Governance & Security Lead',
    trait: 'Neutral, Security-focused',
    description: 'Governance agent inspired by "Lobster Trap" security protocols. Checks for PII leaks and logical fallacies.',
    color: '#f59e0b', // Amber-500
  }
};
