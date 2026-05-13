import React from 'react';
import { Shield, ShieldAlert, ShieldCheck } from 'lucide-react';
import { SimulationResult, SimulationArtifact } from '../types';

interface Props {
  logs: SimulationResult['governanceLogs'];
  uploadedArtifacts?: SimulationArtifact[];
}

export const LobsterTrapView: React.FC<Props> = ({ logs, uploadedArtifacts = [] }) => {
  if (!logs || logs.length === 0) return null;

  return (
    <div className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800/80 mt-6 overflow-hidden relative group">
      <div className="absolute inset-0 bg-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      <div className="flex items-center gap-2 text-zinc-400 uppercase tracking-wider text-[12px] font-semibold mb-6 relative z-10">
        <Shield size={16} className="text-zinc-400" />
        Lobster Trap Protocol · Governance
      </div>
      
      <div className="space-y-4 relative z-10">
        {logs.map((log, index) => {
          let isPassed = log.status === 'passed';
          let isWarning = log.status === 'warning';
          
          // Fix 3: Kalau dokumen yang dikutip Auditor tidak ada di daftar upload aktual -> otomatis tandai sebagai Unverified Reference.
          // Very basic check: If observation mentions a file extension like .xlsx, .pdf, or explicitly mentions a document not in the list
          const observationLower = log.observation.toLowerCase();
          const artifactNames = uploadedArtifacts.map(a => a.name.toLowerCase());
          const mentionsFilePattern = /\b\w+\.(xlsx|csv|pdf|docx|txt|jpg|png|jpeg)\b/gi;
          const mentionedFiles = [...log.observation.matchAll(mentionsFilePattern)].map(m => m[0].toLowerCase());
          
          let unverifiedReference = false;
          let newObservation = log.observation;

          if (uploadedArtifacts.length === 0 && (log.observation.includes('document') || log.observation.includes('artifact') || log.observation.includes('file') || log.observation.includes('spreadsheet') || mentionedFiles.length > 0)) {
            unverifiedReference = true;
          } else if (mentionedFiles.length > 0) {
            unverifiedReference = mentionedFiles.some(f => !artifactNames.some(a => a.includes(f)));
          }

          if (unverifiedReference) {
             isPassed = false;
             isWarning = true;
             newObservation = `⚠️ [Unverified Reference] ${log.observation} (Warning: No matching document uploaded for this claim.)`;
          }

          let icon = <ShieldCheck size={16} className="text-emerald-400" />;
          let colorClass = "border-zinc-800/80 bg-zinc-950/50";
          let badgeClass = "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
          let statusLabel = unverifiedReference ? 'UNVERIFIED' : log.status;

          if (!isPassed) {
            if (isWarning) {
              icon = <ShieldAlert size={16} className="text-amber-400" />;
              badgeClass = "bg-amber-500/10 text-amber-400 border border-amber-500/20";
              if (!unverifiedReference && statusLabel !== 'UNVERIFIED') {
                  statusLabel = 'WARNING';
              }
            } else {
              icon = <ShieldAlert size={16} className="text-rose-400" />;
              colorClass = "border-rose-500/30 bg-rose-500/5 text-rose-200";
              badgeClass = "bg-rose-500/10 text-rose-400 border border-rose-500/20";
              statusLabel = 'FAILED';
            }
          }

          return (
            <div key={index} className={`p-5 border rounded-xl flex flex-col gap-2 transition-all ${colorClass}`}>
              <div className="flex justify-between items-start gap-4">
                <div className="flex items-center gap-2">
                  {icon}
                  <h4 className="text-[13px] font-semibold text-zinc-200">{log.rule}</h4>
                </div>
                <span className={`text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 text-center rounded-md ${badgeClass}`}>
                  {statusLabel}
                </span>
              </div>
              <p className={`text-[14px] ${unverifiedReference ? 'text-amber-400 font-medium' : 'text-zinc-400'} pl-6 pr-4 leading-relaxed`}>
                {newObservation}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
