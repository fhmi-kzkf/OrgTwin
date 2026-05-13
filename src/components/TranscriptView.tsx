import React from 'react';
import { Message } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  messages: Message[];
}

export const TranscriptView: React.FC<Props> = ({ messages }) => {
  return (
    <div className="space-y-6 overflow-y-auto max-h-[600px] pr-4 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
      <AnimatePresence initial={false}>
        {messages.map((msg, idx) => {
          const colorClass = 
            msg.persona === 'CFO' ? 'text-rose-400' : 
            msg.persona === 'CMO' ? 'text-blue-400' : 
            msg.persona === 'CTO' ? 'text-emerald-400' : 
            'text-amber-400';
          return (
            <motion.div
              key={`msg-${idx}-${msg.round}-${msg.persona}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="flex gap-4 group"
            >
              <div className="flex flex-col items-center gap-2 pt-1.5 shrink-0 w-12">
                <span className={`font-mono text-[10px] font-bold uppercase ${colorClass}`}>
                  [{msg.persona}]
                </span>
                <div className="w-px flex-grow bg-zinc-800 group-last:hidden" />
              </div>
              <div className="flex-grow pb-6">
                <div className="text-[12px] font-medium text-zinc-500 uppercase tracking-[0.16px] mb-1">
                  ROUND {msg.round.toString().padStart(2, '0')} — ENTRY {idx}
                </div>
                <p className="text-[14px] leading-[1.6] text-zinc-300 border-l-2 border-zinc-800 pl-4 ml-1">
                  "{msg.text}"
                </p>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
      {messages.length === 0 && (
        <div className="h-64 flex flex-col items-center justify-center border border-dashed border-zinc-800 rounded-xl bg-zinc-900/20">
          <div className="text-[14px] font-medium text-zinc-500 uppercase tracking-widest animate-pulse">
            Terminal Idle
          </div>
          <div className="text-[14px] text-zinc-600 mt-2">
            Waiting for strategic data packets...
          </div>
        </div>
      )}
    </div>
  );
};
