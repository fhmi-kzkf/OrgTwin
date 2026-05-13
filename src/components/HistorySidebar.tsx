import React, { useRef } from 'react';
import { SimulationHistoryEntry, exportHistory, importHistory } from '../services/storageService';
import { Clock, Edit2, Download, Upload } from 'lucide-react';

interface Props {
  history: SimulationHistoryEntry[];
  onSelect: (entry: SimulationHistoryEntry) => void;
  onAdjust: (entry: SimulationHistoryEntry) => void;
  onRefresh: () => void;
}

export const HistorySidebar: React.FC<Props> = ({ history, onSelect, onAdjust, onRefresh }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result && importHistory(event.target.result as string)) {
          onRefresh();
        }
      };
      reader.readAsText(file);
    }
  };

  // Removed if (history.length === 0) return null;

  return (
    <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-xl flex flex-col h-full max-h-[800px]">
      <div className="p-5 border-b border-zinc-800/80 flex items-center justify-between text-zinc-400 uppercase tracking-widest text-[11px] font-semibold">
        <div className="flex items-center gap-2">
          <Clock size={16} />
          <span>Simulation History</span>
        </div>
        <div className="flex items-center gap-3">
          <button title="Export Data as JSON" onClick={exportHistory} className="hover:text-zinc-100 transition-colors" disabled={history.length === 0}>
            <Download size={16} className={history.length === 0 ? "opacity-30" : ""} />
          </button>
          <button title="Import JSON Data" onClick={() => fileInputRef.current?.click()} className="hover:text-zinc-100 transition-colors">
            <Upload size={16} />
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            accept="application/json" 
            className="hidden" 
            onChange={handleImport}
          />
        </div>
      </div>
      <div className="overflow-y-auto p-4 space-y-4 flex-1 scrollbar-thin scrollbar-thumb-zinc-700">
        {history.length === 0 ? (
          <div className="text-center text-[12px] text-zinc-600 uppercase tracking-wider py-8 font-medium">
            No history available.<br/>Run a simulation or import data.
          </div>
        ) : (
          history.map((entry) => (
          <div key={entry.id} className="bg-zinc-950/50 border border-zinc-800/80 p-4 rounded-lg flex flex-col gap-3 group relative cursor-pointer hover:border-zinc-700 transition-all" onClick={() => onSelect(entry)}>
            <div className="text-zinc-200 text-[13px] leading-relaxed line-clamp-2 pr-8">
              "{entry.objective}"
            </div>
            <div className="flex justify-between items-center text-[11px] uppercase font-semibold text-zinc-500">
              <span>{new Date(entry.timestamp).toLocaleDateString()}</span>
              <span className={`px-2 py-1 rounded-md ${entry.result.riskScore > 60 ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                Risk: {entry.result.riskScore}
              </span>
            </div>
            
            {/* Adjust Button overlay */}
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAdjust(entry);
                }}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 p-1.5 rounded-md flex items-center justify-center transition-colors"
                title="Adjust Scenario"
              >
                <Edit2 size={12} />
              </button>
            </div>
          </div>
        ))
        )}
      </div>
    </div>
  );
};
