import React, { useEffect } from 'react';
import { HelpCircle, X } from 'lucide-react';
import STEPS from '../data/usageGuideSteps.json';

export default function UsageGuideModal({ isOpen, onClose }) {
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section role="dialog" aria-modal="true" aria-labelledby="usage-guide-title" className="w-full max-w-xl max-h-full overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between gap-4 border-b border-slate-800 px-5 py-4">
          <h2 id="usage-guide-title" className="flex items-center gap-2 text-base font-bold text-white">
            <HelpCircle className="h-5 w-5 text-indigo-400" /> 사용 방법
          </h2>
          <button type="button" onClick={onClose} aria-label="사용 방법 닫기" className="rounded-lg p-2 text-slate-300 hover:bg-slate-800 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
        <ol className="space-y-4 p-5">
          {STEPS.map(([title, description]) => (
            <li key={title}>
              <h3 className="text-sm font-bold text-indigo-300">{title}</h3>
              <p className="mt-1 text-sm leading-6 text-slate-300">{description}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
