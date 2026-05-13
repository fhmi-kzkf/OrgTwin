import React from 'react';
import { PERSONA_CONFIGS } from '../constants';
import { Persona } from '../types';
import { motion } from 'motion/react';
import { TrendingUp, Cpu, PieChart } from 'lucide-react';

interface Props {
  persona: Persona;
  isSpeaker?: boolean;
  status: string;
}

export const PersonaCard: React.FC<Props> = ({ persona, isSpeaker, status }) => {
  const config = PERSONA_CONFIGS[persona];
  const Icon = persona === Persona.CFO ? PieChart : persona === Persona.CMO ? TrendingUp : Cpu;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ 
        opacity: 1, 
        y: 0,
        borderColor: isSpeaker ? config.color : 'rgba(39,39,42,0.8)',
        backgroundColor: isSpeaker ? `${config.color}15` : 'rgba(24,24,27,0.5)'
      }}
      className={`p-5 border rounded-xl transition-all duration-500 relative overflow-hidden`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col">
          <div className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: config.color }}>{persona}</div>
          <div className="text-[11px] text-zinc-500 mt-1 flex items-center gap-1.5 font-medium uppercase tracking-widest">
            <span className={`w-1.5 h-1.5 rounded-full ${isSpeaker ? 'animate-pulse' : ''}`} style={{ backgroundColor: isSpeaker ? config.color : '#52525b' }} />
            {status}
          </div>
        </div>
        <div className="p-1.5 rounded-lg bg-zinc-800/50 text-zinc-400">
          <Icon size={16} />
        </div>
      </div>
      <div>
        <h3 className="text-lg text-zinc-100 font-medium mb-1">{config.name}</h3>
        <p className="text-[13px] text-zinc-400 leading-snug">{config.role}</p>
      </div>
    </motion.div>
  );
};
