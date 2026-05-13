import React from 'react';
import { CorporateContext } from '../types';

interface Props {
  context: CorporateContext;
}

export const ContextView: React.FC<Props> = ({ context }) => {
  const sections = [
    { title: 'Market Dynamics', content: context.marketTrends },
    { title: 'Financial Outlook', content: context.financialData },
    { title: 'Technical Maturity', content: context.technicalLandscape },
  ];

  return (
    <div className="grid grid-cols-1 gap-3">
      {sections.map((section, idx) => (
        <div key={idx} className="bg-zinc-900/40 border border-zinc-800/80 p-5 rounded-xl transition-colors hover:bg-zinc-900/60">
          <h4 className="text-[11px] font-semibold text-indigo-400 uppercase tracking-widest mb-2">
            {section.title}
          </h4>
          <p className="text-[13px] text-zinc-400 leading-relaxed">
            {section.content}
          </p>
        </div>
      ))}
    </div>
  );
};
