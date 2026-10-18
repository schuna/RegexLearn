import React, { useState, useEffect } from 'react';
import { Film, ChevronDown, ChevronUp, Sparkles, AlertCircle } from 'lucide-react';
import StepByStepTracer from './StepByStepTracer';

/**
 * 레슨별 맞춤형 Before / After 개념 시연 메타데이터
 */
const LESSON_DEMO_PRESETS = {
  'lv1-1': {
    title: '와일드카드(.) vs 이스케이프(\\.) 동작 비교',
    beforeLabel: '❌ 흔한 실수: ...py (이스케이프 누락)',
    beforePattern: '...py',
    afterLabel: '✅ 정석: ...\\.py (실제 마침표만 매칭)',
    afterPattern: '...\\.py',
    demoText: 'app.py app_py',
    summary: '점(.)은 언더스코어(_)까지 매칭하지만, \\.은 실제 마침표(.)에서만 매칭에 성공합니다.'
  },
  'lv2-3': {
    title: '탐욕적(Greedy .+) vs 게으른(Lazy .+?) 추적 비교',
    beforeLabel: '❌ 탐욕적(Greedy): <b>.+</b> (문장 끝까지 삼킴)',
    beforePattern: '<b>.+</b>',
    afterLabel: '✅ 게으른(Lazy): <b>.+?</b> (첫 </b>에서 즉시 정지)',
    afterPattern: '<b>.+?</b>',
    demoText: '<b>공지</b> <b>점검</b>',
    summary: 'Greedy(.+)는 끝까지 갔다가 백트래킹하지만, Lazy(.+?)는 첫 번째 닫는 태그에서 즉시 멈춥니다!'
  },
  'lv2-4': {
    title: '단어 경계(\\b)의 Zero-width 위치 검사 원리',
    beforeLabel: '❌ 경계 없음: ERROR (단어 내부도 오탐)',
    beforePattern: 'ERROR',
    afterLabel: '✅ 단어 경계: \\bERROR\\b (독립 단어만 통과)',
    afterPattern: '\\bERROR\\b',
    demoText: 'MY_ERROR ERROR',
    summary: '\\b는 문자를 소비하지 않고(Zero-width | 포인터) 단어와 비단어의 경계인지 확인만 합니다.'
  },
  'lv3-3': {
    title: 'Python 명명된 그룹 (?P<name>...) 추출 시연',
    beforeLabel: '일반 매칭: \\d{4}-\\d{2}',
    beforePattern: '\\d{4}-\\d{2}',
    afterLabel: '✅ Python Named Group: (?P<yr>\\d{4})-(?P<mo>\\d{2})',
    afterPattern: '(?P<yr>\\d{4})-(?P<mo>\\d{2})',
    demoText: '2026-10',
    summary: '(?P<name>...)으로 감싸면 매칭과 동시에 groupdict() 딕셔너리 키로 추출됩니다.'
  },
  'lv4-1': {
    title: '긍정 전방탐색 (?=원) Zero-width 매칭 시연',
    beforeLabel: '❌ 일반 매칭: \\d+원 ("원"까지 소비됨)',
    beforePattern: '\\d+원',
    afterLabel: '✅ 전방탐색: \\d+(?=원) (숫자만 소비, "원"은 확인만)',
    afterPattern: '\\d+(?=원)',
    demoText: '3개 1500원',
    summary: '(?=원)은 커서(|)에서 오른쪽에 "원"이 있는지만 확인하고 문자를 삼키지 않습니다!'
  },
  'lv5-2': {
    title: '탐욕적 따옴표(".*") 백트래킹 vs 부정 클래스("[^"]+") 비교',
    beforeLabel: '❌ 탐욕적: ".*?" (백트래킹/오버헤드 발생)',
    beforePattern: '".*?"',
    afterLabel: '✅ 최적화 정석: "[^"]+" (백트래킹 0회 고속 매칭)',
    afterPattern: '"[^"]+"',
    demoText: '"host": "local"',
    summary: '"[^"]+"는 닫는 따옴표가 아닌 문자만 정확히 직진 소비하므로 백트래킹이 전혀 발생하지 않습니다.'
  }
};

export default function ConceptDemoWidget({ lesson }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState('after'); // 'before' | 'after'

  useEffect(() => {
    setIsOpen(false);
    setMode('after');
  }, [lesson?.id]);

  if (!lesson) return null;

  const customPreset = LESSON_DEMO_PRESETS[lesson.id];
  const demoConfig = customPreset || {
    title: `${lesson.title} — 동작 비교 시연`,
    beforeLabel: `적용 전 초기 패턴: ${lesson.initialPattern}`,
    beforePattern: lesson.initialPattern,
    afterLabel: `정석 목표 패턴: ${lesson.solution}`,
    afterPattern: lesson.solution,
    demoText: (lesson.sampleText || '').split('\n').slice(0, 2).join(' '),
    summary: lesson.solutionExplanation
  };

  const activePattern = mode === 'before' ? demoConfig.beforePattern : demoConfig.afterPattern;

  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-950/15 overflow-hidden transition-all">
      {/* 토글 헤더 버튼 */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 text-left hover:bg-amber-500/10 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Film className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-xs font-bold text-amber-200">
            🎬 개념 시연 애니메이션 보기 (Before / After 비교)
          </span>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-semibold text-amber-300">
          <span>{isOpen ? '시연 닫기' : '▶ 시연 열기'}</span>
          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </div>
      </button>

      {/* 펼쳐진 미니 시연 플레이어 (Phase 1 트레이서 엔진 재사용) */}
      {isOpen && (
        <div className="p-3 pt-1 border-t border-amber-500/20 space-y-2.5 animate-fadeIn">
          {/* Before vs After 전환 버튼 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => setMode('before')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-semibold border text-left transition-all ${
                mode === 'before'
                  ? 'bg-rose-950/80 border-rose-400 text-rose-200 shadow'
                  : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span className="truncate">{demoConfig.beforeLabel}</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('after')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-semibold border text-left transition-all ${
                mode === 'after'
                  ? 'bg-emerald-950/80 border-emerald-400 text-emerald-200 shadow'
                  : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">{demoConfig.afterLabel}</span>
            </button>
          </div>

          {/* 트레이서 Mini-player (compact & autoPlayOnMount) */}
          <StepByStepTracer
            pattern={activePattern}
            testText={demoConfig.demoText}
            flags={lesson.initialFlags}
            compact={true}
            autoPlayOnMount={true}
          />

          <p className="text-[11px] text-amber-200/90 bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-amber-500/20">
            💡 <strong>시연 핵심 포인트:</strong> {demoConfig.summary}
          </p>
        </div>
      )}
    </div>
  );
}
