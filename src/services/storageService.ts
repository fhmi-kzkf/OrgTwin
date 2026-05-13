import { SimulationResult, CorporateContext } from '../types';

export interface SimulationHistoryEntry {
  id: string;
  timestamp: number;
  objective: string;
  context: CorporateContext;
  result: SimulationResult;
}

const STORAGE_KEY = 'orgsim_history';

export function saveSimulationHistory(entry: SimulationHistoryEntry): void {
  try {
    const history = getSimulationHistory();
    history.unshift(entry); // Add to the beginning
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Failed to save simulation history', error);
  }
}

export function getSimulationHistory(): SimulationHistoryEntry[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load simulation history', error);
    return [];
  }
}

export function clearSimulationHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function exportHistory() {
  const history = getSimulationHistory();
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(history));
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", "orgsim_history_export.json");
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
}

export function importHistory(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString);
    if (Array.isArray(data)) {
      // Validate structure optionally or just replace
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    }
    return false;
  } catch (error) {
    console.error("Failed to parse history import", error);
    return false;
  }
}

