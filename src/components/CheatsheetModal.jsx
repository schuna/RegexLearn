import React from 'react';
import { X, BookOpen, Plus } from 'lucide-react';
import { CHEATSHEET_SECTIONS } from '../data/cheatsheetData';

export default function CheatsheetModal({ isOpen, onClose, onInsertToken }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-2xl bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <div>
              <h2 className="text-sm font-bold text-white">
                Python `re` 정규표현식 인터랙티브 치트시트
              </h2>
              <p className="text-[11px] text-slate-400">
                항목을 클릭하면 현재 정규식 입력창 끝에 즉시 삽입됩니다
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 치트시트 본문 */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {CHEATSHEET_SECTIONS.map((sec, idx) => (
            <div key={idx} className="space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-300 border-b border-slate-800 pb-1.5">
                {sec.category}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {sec.items.map((item, iIdx) => (
                  <button
                    key={iIdx}
                    type="button"
                    onClick={() => onInsertToken(item.token)}
                    className="group flex flex-col justify-between p-2.5 rounded-xl bg-slate-950/80 hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-500/50 text-left transition-all"
                  >
                    <div className="flex items-center justify-between gap-2 w-full">
                      <code className="font-mono text-xs font-bold text-amber-300 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/30">
                        {item.token}
                      </code>
                      <span className="text-[10px] text-indigo-400 opacity-0 group-hover:opacity-100 flex items-center gap-0.5 font-semibold transition-opacity">
                        <Plus className="w-3 h-3" /> 패턴에 삽입
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-slate-200 mt-1.5">
                      {item.label}
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                      예: {item.example}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
