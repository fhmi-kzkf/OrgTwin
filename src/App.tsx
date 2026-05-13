import React, { useState, useEffect } from 'react';
import { SimulationControls } from './components/SimulationControls';
import { PersonaCard } from './components/PersonaCard';
import { TranscriptView } from './components/TranscriptView';
import { AllocationView } from './components/AllocationView';
import { RelationshipGraph } from './components/RelationshipGraph';
import { ContextView } from './components/ContextView';
import { RiskMeter } from './components/RiskMeter';
import { HistorySidebar } from './components/HistorySidebar';
import { LobsterTrapView } from './components/LobsterTrapView';
import { Persona, SimulationResult, CorporateContext, SimulationArtifact } from './types';
import { generateCorporateContext, runSimulation } from './services/geminiService';
import { saveSimulationHistory, getSimulationHistory, SimulationHistoryEntry } from './services/storageService';
import { Shield, BrainCircuit, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState<CorporateContext | null>(null);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<SimulationHistoryEntry[]>([]);
  const [adjustObjective, setAdjustObjective] = useState<string | undefined>();
  const [activeArtifacts, setActiveArtifacts] = useState<SimulationArtifact[]>([]);

  useEffect(() => {
    setHistory(getSimulationHistory());
  }, []);

  const handleStart = async (objective: string, artifacts: SimulationArtifact[]) => {
    setLoading(true);
    setError(null);
    setResult(null);
    setActiveArtifacts(artifacts);
    try {
      const generatedContext = await generateCorporateContext(objective);
      setContext(generatedContext);
      
      const simulationResult = await runSimulation(objective, generatedContext, artifacts);
      setResult(simulationResult);

      const entry: SimulationHistoryEntry = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        objective,
        context: generatedContext,
        result: simulationResult
      };
      saveSimulationHistory(entry);
      setHistory(getSimulationHistory());

    } catch (err: any) {
      const message = err?.message || 'Communication Failure // Agent link unstable.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setContext(null);
    setResult(null);
    setError(null);
    setLoading(false);
    setAdjustObjective(undefined);
    setActiveArtifacts([]);
  };

  const handleSelectHistory = (entry: SimulationHistoryEntry) => {
    setContext(entry.context);
    setResult(entry.result);
    setAdjustObjective(entry.objective);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans overflow-x-hidden selection:bg-indigo-500/30">
      {/* Background Subtle Glows */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.4] mix-blend-screen overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-indigo-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-emerald-500/10 blur-[120px] rounded-full" />
      </div>

      {/* Header */}
      <header className="max-w-7xl mx-auto pt-16 px-8 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-zinc-800/80 relative z-10">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-100 mb-2">OrgSim Engine</h1>
          <p className="text-sm font-medium text-zinc-400">Strategic Stress-Testing Sandbox</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-12 px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        {/* Left Column: Negotiation Area */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          {/* Persona Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[Persona.CFO, Persona.CMO, Persona.CTO, Persona.AUDITOR].map((p) => {
              const lastMsg = result?.transcript[result.transcript.length - 1];
              const isSpeaker = lastMsg?.persona === p;
              
              let status = 'STANDBY';
              if (loading) {
                status = 'NEGOTIATING';
              } else if (result) {
                if (isSpeaker) {
                  status = p === Persona.AUDITOR ? 'AUDITING' : 'ACTIVE';
                } else if (result.externalShock) {
                  status = 'ADAPTING';
                } else {
                  status = 'LISTENING';
                }
              }

              return (
                <PersonaCard 
                  key={p}
                  persona={p} 
                  isSpeaker={isSpeaker} 
                  status={status}
                />
              );
            })}
          </div>

          <AnimatePresence>
            {result?.externalShock && (
              <motion.div
                key="external-shock"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-8 bg-amber-500/10 border border-amber-500/20 text-zinc-100 rounded-xl"
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[12px] font-bold uppercase tracking-widest text-amber-500">External Shock Detected - Round 02</span>
                </div>
                <h4 className="text-[28px] font-semibold leading-tight mb-4">{result.externalShock.title}</h4>
                <p className="text-[15px] leading-relaxed text-amber-200/80">{result.externalShock.description}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Active Documents Display */}
          {(result || loading) && (
            <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-6">
               <div className="flex flex-col gap-2">
                 <div className="text-[14px] text-zinc-300 font-medium flex items-center gap-2">
                   <span>📎 Active Documents:</span>
                   {activeArtifacts.length > 0 ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        {activeArtifacts.map((art, idx) => (
                           <span key={idx} className="px-2 py-1 bg-zinc-800 text-zinc-200 text-[12px] rounded-md border border-zinc-700">
                             {art.name}
                           </span>
                        ))}
                      </div>
                   ) : (
                      <span className="text-zinc-500">[none uploaded]</span>
                   )}
                 </div>
                 {activeArtifacts.length === 0 && (
                   <div className="text-[13px] text-amber-400 mt-1 flex items-center gap-2">
                     <span>⚠️</span> Simulation running on objective only — no grounding documents
                   </div>
                 )}
               </div>
            </div>
          )}

          {/* Transcript / Dialogue Log */}
          <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-8 relative flex-grow min-h-[500px]">
            <div className="absolute top-0 right-0 p-6 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              {loading ? 'Real-Time Processing' : 'Protocol Logs'}
            </div>
            
            {loading && !result ? (
               <div className="h-full flex flex-col items-center justify-center space-y-6">
                <div className="relative">
                  <div className="w-16 h-16 border-t-2 border-indigo-500/50 rounded-full animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Activity size={16} className="text-indigo-400 animate-pulse" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-[15px] font-medium text-zinc-200">Synchronizing Personas</p>
                  <p className="text-[13px] text-zinc-500 mt-2">Evaluating Risk Parameters...</p>
                </div>
              </div>
            ) : (
              <TranscriptView messages={result?.transcript || []} />
            )}
          </div>
          
          {result && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="p-8 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                <div className="text-[12px] font-bold uppercase tracking-widest text-indigo-400 mb-4">Final Consensus Verdict</div>
                <p className="text-[20px] font-medium text-zinc-100 leading-relaxed">
                  {result.consensusSummary}
                </p>
              </div>

              <div className="p-8 bg-zinc-900/80 border border-zinc-800/80 rounded-xl">
                <div className="text-[16px] font-semibold text-zinc-200 mb-5 flex items-center gap-3">
                  <Shield size={18} className="text-zinc-400" />
                  Auditor Security & Logic Check
                </div>
                <div className="text-[14px] text-zinc-400 leading-relaxed border-l-2 border-zinc-800 pl-6 space-y-4 whitespace-pre-wrap">
                  {result.auditorReport}
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Right Column: Intelligence & Controls */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <SimulationControls onStart={handleStart} isLoading={loading} onReset={handleReset} defaultObjective={adjustObjective} />
          
          <HistorySidebar 
            history={history} 
            onSelect={handleSelectHistory} 
            onAdjust={(entry) => {
              setAdjustObjective(entry.objective);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }} 
            onRefresh={() => setHistory(getSimulationHistory())}
          />

          <AnimatePresence>
            {error && (
              <motion.div 
                key="error-notice"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-5 border border-rose-500/30 bg-rose-500/10 text-rose-300 text-[13px] font-medium flex items-start gap-3 rounded-xl"
              >
                <Shield size={16} className="mt-0.5 shrink-0" />
                <p className="leading-relaxed">{error}</p>
              </motion.div>
            )}

            {context && (
              <motion.div
                key="context-view"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="text-[12px] font-semibold text-zinc-500 uppercase tracking-wider px-1">Source Environment Intelligence</div>
                <ContextView context={context} />
              </motion.div>
            )}

            {result && (
              <motion.div
                key="result-view"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 gap-6">
                  <RiskMeter score={result.riskScore} />
                  <AllocationView data={result.allocation} />
                  {result.governanceLogs && result.governanceLogs.length > 0 && (
                    <LobsterTrapView logs={result.governanceLogs} uploadedArtifacts={activeArtifacts} />
                  )}
                </div>
                <RelationshipGraph graph={result.graph} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 relative z-10 bg-zinc-950/50">
        <div className="max-w-7xl mx-auto py-8 px-8 flex flex-col md:flex-row justify-between items-center text-xs font-medium text-zinc-500 uppercase tracking-widest">
          <div>SYSTEM STATUS: NOMINAL — MULTIMODAL GROUNDING: ACTIVE</div>
          <div>ORGSIM_CORE_v4.1.0</div>
        </div>
      </footer>
    </div>
  );
}
