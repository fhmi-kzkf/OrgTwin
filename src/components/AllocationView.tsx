import React from 'react';
import { ResourceAllocation } from '../types';

interface Props {
  data: ResourceAllocation[];
}

export const AllocationView: React.FC<Props> = ({ data }) => {
  const colors = [
    { bg: 'bg-indigo-500', border: 'border-indigo-500' },
    { bg: 'bg-rose-500', border: 'border-rose-500' },
    { bg: 'bg-emerald-500', border: 'border-emerald-500' },
    { bg: 'bg-amber-500', border: 'border-amber-500' },
    { bg: 'bg-cyan-500', border: 'border-cyan-500' }
  ];

  return (
    <div className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800/80">
      <div className="text-[12px] font-semibold uppercase tracking-wider text-zinc-400 mb-6 text-center">
        Resource Allocation Analysis
      </div>
      <div className="flex flex-col gap-4">
        {data.map((item, idx) => {
          const color = colors[idx % colors.length];
          return (
            <div key={idx} className="flex flex-col gap-1 group relative">
              <div className="flex items-end justify-between mb-1">
                <span className="text-[11px] font-semibold tracking-wider uppercase text-zinc-300 truncate max-w-[120px]">{item.department}</span>
                <span className="text-[12px] font-mono text-zinc-400">{item.percentage}%</span>
              </div>
              <div className="w-full bg-zinc-950/50 h-2 rounded-r-md overflow-hidden flex">
                <div 
                  className={`h-full ${color.bg} opacity-80 rounded-r-md transition-all duration-1000 ease-out`}
                  style={{ width: `${item.percentage}%` }}
                />
              </div>

              {/* Custom Tooltip */}
              <div className="absolute top-8 left-0 z-10 w-64 p-4 bg-zinc-900 border border-zinc-700 shadow-2xl rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <p className="text-[11px] uppercase font-semibold text-zinc-500 mb-1">{item.department}</p>
                <p className="text-2xl font-light text-zinc-100 mb-2">{item.percentage}%</p>
                <p className="text-[13px] text-zinc-400 leading-relaxed border-t border-zinc-800 pt-3">
                  {item.reason}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
