import React, { useState, useRef, useEffect } from 'react';
import { Play, RotateCcw, FileText, X, PieChart, Database, FileDigit, Plus, AlertTriangle } from 'lucide-react';
import mammoth from 'mammoth';
import ExcelJS from 'exceljs';
import { SimulationArtifact } from '../types';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per file
const MAX_FILES = 5;

// Magic bytes validation
const MAGIC_SIGNATURES: Record<string, number[]> = {
  'png': [0x89, 0x50, 0x4E, 0x47],
  'jpg': [0xFF, 0xD8, 0xFF],
  'pdf': [0x25, 0x50, 0x44, 0x46],
  'zip': [0x50, 0x4B, 0x03, 0x04], // xlsx & docx are ZIP-based
};

function validateMagicBytes(buffer: ArrayBuffer, expectedType: string): boolean {
  const bytes = new Uint8Array(buffer.slice(0, 8));
  let sig: number[] | undefined;

  if (expectedType.startsWith('image/png')) sig = MAGIC_SIGNATURES.png;
  else if (expectedType.startsWith('image/jpeg') || expectedType.startsWith('image/jpg')) sig = MAGIC_SIGNATURES.jpg;
  else if (expectedType === 'application/pdf') sig = MAGIC_SIGNATURES.pdf;
  else if (expectedType.includes('spreadsheet') || expectedType.includes('wordprocessing')) sig = MAGIC_SIGNATURES.zip;

  if (!sig) return true; // Unknown type, allow
  return sig.every((b, i) => bytes[i] === b);
}

// Simple CSV parser
function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = values[i] || ''; });
    return row;
  });
}

interface Props {
  onStart: (objective: string, artifacts: SimulationArtifact[]) => void;
  isLoading: boolean;
  onReset: () => void;
  defaultObjective?: string;
}

export const SimulationControls: React.FC<Props> = ({ onStart, isLoading, onReset, defaultObjective }) => {
  const [objective, setObjective] = useState('Expansion into the Asian sustainable energy market by Q4.');
  const [artifacts, setArtifacts] = useState<SimulationArtifact[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (defaultObjective) {
      setObjective(defaultObjective);
    }
  }, [defaultObjective]);

  const processFile = async (file: File): Promise<SimulationArtifact | null> => {
    const mimeType = file.type;
    const name = file.name;

    // Size validation (HIGH-02)
    if (file.size > MAX_FILE_SIZE) {
      setFileError(`File "${name}" exceeds 10MB limit (${(file.size / 1024 / 1024).toFixed(1)}MB).`);
      return null;
    }

    try {
      // Magic bytes validation (HIGH-03)
      const headerBuffer = await file.slice(0, 8).arrayBuffer();
      if (!validateMagicBytes(headerBuffer, mimeType)) {
        setFileError(`File "${name}" has invalid file signature. The file may be corrupted or disguised.`);
        return null;
      }

      if (mimeType.startsWith('image/')) {
        const data = await toBase64(file);
        return { name, type: 'image', data, mimeType };
      } else if (mimeType === 'application/pdf') {
        const data = await toBase64(file);
        return { name, type: 'pdf', data, mimeType };
      } else if (
        mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        name.endsWith('.xlsx')
      ) {
        const buffer = await file.arrayBuffer();
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);
        const sheet = workbook.worksheets[0];
        if (!sheet) return { name, type: 'excel', data: '[]', mimeType: 'text/plain' };

        const headers: string[] = [];
        const jsonData: Record<string, any>[] = [];
        sheet.getRow(1).eachCell((cell, colNum) => {
          headers[colNum - 1] = cell.value?.toString() || `Column${colNum}`;
        });
        sheet.eachRow((row, rowNum) => {
          if (rowNum === 1) return;
          const rowData: Record<string, any> = {};
          row.eachCell((cell, colNum) => {
            rowData[headers[colNum - 1] || `Column${colNum}`] = cell.value;
          });
          jsonData.push(rowData);
        });
        return { name, type: 'excel', data: JSON.stringify(jsonData, null, 2), mimeType: 'text/plain' };
      } else if (mimeType === 'text/csv' || name.endsWith('.csv')) {
        const text = await file.text();
        const jsonData = parseCSV(text);
        return { name, type: 'excel', data: JSON.stringify(jsonData, null, 2), mimeType: 'text/plain' };
      } else if (
        mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        name.endsWith('.docx')
      ) {
        const buffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer: buffer });
        return { name, type: 'word', data: result.value, mimeType: 'text/plain' };
      } else if (mimeType === 'text/plain') {
        const text = await file.text();
        return { name, type: 'text', data: text, mimeType: 'text/plain' };
      }
    } catch (err) {
      console.error(`Error processing file ${name}:`, err);
      setFileError(`Failed to process "${name}". The file may be corrupted.`);
    }
    return null;
  };

  const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const files = Array.from(e.target.files || []) as File[];

    // File count validation (HIGH-02)
    if (artifacts.length + files.length > MAX_FILES) {
      setFileError(`Maximum ${MAX_FILES} files allowed. You currently have ${artifacts.length}.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const processed = [];
    for (const file of files) {
      const artifact = await processFile(file);
      if (artifact) {
        processed.push(artifact);
      }
    }
    setArtifacts([...artifacts, ...processed]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeArtifact = (index: number) => {
    setArtifacts(artifacts.filter((_, i) => i !== index));
    setFileError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (objective.trim()) {
      onStart(objective, artifacts);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'image': return <PieChart size={16} className="text-blue-400" />;
      case 'excel': return <Database size={16} className="text-emerald-400" />;
      case 'word': return <FileText size={16} className="text-amber-400" />;
      case 'pdf': return <FileDigit size={16} className="text-rose-400" />;
      default: return <FileText size={16} className="text-zinc-500" />;
    }
  };

  return (
    <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-6 lg:p-8 relative">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-[12px] font-semibold tracking-wider text-zinc-400 uppercase mb-3">
            Strategy Objective
          </label>
          <textarea
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            disabled={isLoading}
            maxLength={2000}
            className="w-full bg-zinc-950/50 px-4 py-3 border border-zinc-800 rounded-lg focus:border-indigo-500/50 focus:ring-0 outline-none transition-all h-28 text-[14px] text-zinc-200 leading-relaxed resize-none placeholder-zinc-600"
            placeholder="Define the primary strategic objective..."
          />
          <div className="text-right text-[10px] text-zinc-600 mt-1">{objective.length}/2000</div>
        </div>

        <div>
          <label className="block text-[12px] font-semibold tracking-wider text-zinc-400 uppercase mb-3">
            Multi-Format Artifacts (Excel, PDF, Word, Images) — Max {MAX_FILES} files, 10MB each
          </label>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {artifacts.map((art, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-zinc-800/50 border border-zinc-700/50 px-3 py-2 rounded-lg group relative">
                  {getIcon(art.type)}
                  <span className="text-[13px] text-zinc-200 truncate max-w-[150px]">{art.name}</span>
                  <button
                    type="button"
                    onClick={() => removeArtifact(idx)}
                    className="ml-1 text-zinc-500 hover:text-rose-400 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              {artifacts.length < MAX_FILES && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-zinc-950/50 border border-zinc-800 rounded-lg text-[13px] font-medium text-zinc-300 hover:bg-zinc-800 transition-all border-dashed"
                >
                  <Plus size={16} />
                  Ingest Data
                </button>
              )}
            </div>
            {fileError && (
              <div className="flex items-center gap-2 text-amber-400 text-[12px] bg-amber-950/20 border border-amber-900/30 px-3 py-2 rounded-lg">
                <AlertTriangle size={14} className="shrink-0" />
                {fileError}
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/png,image/jpeg,application/pdf,.docx,.xlsx,.csv,text/plain"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>

        <div className="flex gap-4 pt-2">
          <button
            type="submit"
            disabled={isLoading || !objective.trim()}
            className="flex-1 bg-zinc-100 text-zinc-900 text-[13px] font-bold uppercase tracking-wider px-6 py-4 rounded-xl hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 shadow-lg shadow-white/5"
          >
            {isLoading ? (
              <span className="animate-pulse">Engine Initializing...</span>
            ) : (
              <>
                <Play size={16} fill="currentColor" />
                <span>Execute Simulation</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onReset}
            disabled={isLoading}
            className="px-6 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-xl hover:bg-zinc-800 hover:text-zinc-200 transition-all flex items-center justify-center"
            title="Reset Protocol"
          >
            <RotateCcw size={18} />
          </button>
        </div>
      </form>
    </div>
  );
};
