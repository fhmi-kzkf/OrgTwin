import React from 'react';
import { motion } from 'motion/react';

interface Props {
  score: number;
}

export const RiskMeter: React.FC<Props> = ({ score }) => {
  const getRiskStatus = (s: number) => {
    if (s < 30) return { label: 'LOW / NOMINAL', color: 'text-emerald-500' };
    if (s < 60) return { label: 'MODERATE / STABLE', color: 'text-amber-500' };
    return { label: 'CRITICAL / VOLATILE', color: 'text-rose-500' };
  };

  const status = getRiskStatus(score);

  return (
    <div className="bg-zinc-900/50 p-8 rounded-xl border border-zinc-800/80 flex flex-col items-center justify-center text-center">
      <div className="text-[12px] font-semibold uppercase tracking-wider text-zinc-400 mb-4">Strategic Risk Score</div>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-[72px] font-light text-zinc-100 leading-none mb-4 tracking-tight"
      >
        {score}
      </motion.div>
      <div className={`text-[12px] font-bold tracking-widest uppercase ${status.color}`}>
        {status.label}
      </div>
      <div className="mt-8 w-full h-[4px] bg-zinc-800 max-w-[140px] rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          className={`h-full ${score > 60 ? 'bg-rose-500' : score > 30 ? 'bg-amber-500' : 'bg-emerald-500'}`}
        />
      </div>
    </div>
  );
};
