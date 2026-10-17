import React, { useState } from 'react';
import { Briefcase, PlayCircle, CheckCircle, Info } from 'lucide-react';
import { WORK_PRESETS } from '../data/presetsData';

export default function PresetsSidebar({ currentPresetId, onSelectPreset }) {
  const categories = ['전체', ...Array.from(new Set(WORK_PRESETS.map((p) => p.category)))];
  const [selectedCategory, setSelectedCategory] = useState('전체');

  const filtered =
    selectedCategory === '전체'
      ? WORK_PRESETS
      : WORK_PRESETS.filter((p) => p.category === selectedCategory);

  const activePreset = WORK_PRESETS.find((p) => p.id === currentPresetId) || WORK_PRESETS[0];

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3">
        <div className="flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-indigo-400" />
          <h2 className="text-sm font-bold text-white">실무 예제 프리셋 (Work-Ready Presets)</h2>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          시스템/서버 로그 분석, 개인정보 마스킹(`re.sub`), HTML/CSV 정제 등 현업에서 바로 활용 가능한 표준 가상 데이터 예제입니다. 클릭하면 우측 플레이그라운드와 시각화 분석기에 즉시 로드됩니다.
        </p>

        {/* 카테고리 필터 알약 버튼 */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white border-indigo-500'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* 프리셋 카드 리스트 */}
        <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1 pt-1">
          {filtered.map((preset) => {
            const isSelected = preset.id === activePreset?.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onSelectPreset(preset)}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-indigo-950/40 border-indigo-500 shadow-md'
                    : 'bg-slate-950/60 border-slate-800/90 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {preset.badge}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                    {isSelected ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5" /> 적용 중
                      </>
                    ) : (
                      <>
                        <PlayCircle className="w-3.5 h-3.5" /> 불러오기
                      </>
                    )}
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-100">{preset.title}</div>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {preset.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 현재 선택된 프리셋의 실무 포인트 해설 */}
      {activePreset && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
            <Info className="w-4 h-4" />
            <span>이 프리셋의 실무 핵심 포인트</span>
          </div>
          <ul className="space-y-2 text-xs text-slate-300 leading-relaxed list-disc list-inside">
            {(activePreset.tips || []).map((tip, idx) => (
              <li key={idx}>{tip}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
