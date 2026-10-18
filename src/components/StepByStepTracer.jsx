import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  SkipBack,
  ChevronLeft,
  Play,
  Pause,
  ChevronRight,
  SkipForward,
  AlertTriangle,
  Activity,
  RotateCcw,
  Zap
} from 'lucide-react';
import { tracePythonRegexSteps, MAX_TRACE_STEPS } from '../engine/regexStepTracer';
import { TOKEN_CATEGORIES } from '../engine/regexAstParser';

const STATUS_BADGE = {
  advance: {
    label: '⚡ 문자 소비 & 전진',
    cls: 'bg-sky-500/20 text-sky-300 border-sky-500/40'
  },
  check: {
    label: '👁️ Zero-width 위치/조건 확인',
    cls: 'bg-amber-500/20 text-amber-300 border-amber-500/40'
  },
  backtrack: {
    label: '⏪ 백트래킹 (되감기 발생!)',
    cls: 'bg-red-500/30 text-red-200 border-red-400 animate-pulse'
  },
  fail: {
    label: '❌ 조건 불일치 (실패)',
    cls: 'bg-rose-950/80 text-rose-300 border-rose-700/60'
  },
  match: {
    label: '🎉 매칭 확정 (Match!)',
    cls: 'bg-emerald-500/25 text-emerald-200 border-emerald-400'
  }
};

export default function StepByStepTracer({
  pattern,
  testText,
  flags,
  compact = false,
  autoPlayOnMount = false,
  onActiveTokenChange
}) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(Boolean(autoPlayOnMount));
  const [speed, setSpeed] = useState(1); // 0.5, 1, 2, 4
  const containerRef = useRef(null);

  const traceData = useMemo(
    () => tracePythonRegexSteps(pattern, testText, flags, MAX_TRACE_STEPS),
    [pattern, testText, flags]
  );

  const { steps, totalSteps, exceededMaxSteps, backtrackCount, tokens } = traceData;

  // 패턴이나 텍스트 변경 시 첫 스텝으로 리셋
  useEffect(() => {
    setCurrentIdx(0);
    setIsPlaying(Boolean(autoPlayOnMount));
  }, [pattern, testText, flags, autoPlayOnMount]);

  const currentStep = steps[currentIdx] || null;

  // 부모 시각화 분석기(VisualPatternAnalyzer)와 현재 활성 토큰 동기화
  useEffect(() => {
    if (onActiveTokenChange) {
      onActiveTokenChange(currentStep?.tokenId || null);
    }
  }, [currentStep, onActiveTokenChange]);

  // 자동 재생 타이머
  useEffect(() => {
    if (!isPlaying || totalSteps === 0) return;

    const intervalMs = Math.max(80, Math.round(520 / speed));
    const timer = setInterval(() => {
      setCurrentIdx((prev) => {
        if (prev + 1 >= totalSteps) {
          if (compact) {
            // 미니 시연 플레이어일 때는 루프 재생
            return 0;
          }
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, totalSteps, speed, compact]);

  // 키보드 단축키 바인딩 (←, →, Space)
  const handleKeyDown = (e) => {
    if (['INPUT', 'TEXTAREA'].includes(e.target?.tagName)) return;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setIsPlaying(false);
      setCurrentIdx((prev) => Math.max(0, prev - 1));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setIsPlaying(false);
      setCurrentIdx((prev) => Math.min( Math.max(0, totalSteps - 1), prev + 1));
    } else if (e.key === ' ') {
      e.preventDefault();
      setIsPlaying((prev) => !prev);
    }
  };

  const textChars = useMemo(() => Array.from(testText ?? ''), [testText]);

  const statusMeta = currentStep
    ? STATUS_BADGE[currentStep.status] || STATUS_BADGE.advance
    : null;

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className={`bg-slate-900/95 border border-slate-800 rounded-xl overflow-hidden shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/60 ${
        compact ? 'p-3 space-y-2.5' : 'p-4 space-y-3.5'
      }`}
    >
      {/* 상단 컨트롤 헤더 */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold text-white">
            {compact ? '🎬 실시간 엔진 동작 시연' : '🔬 Step-by-Step 매칭 트레이서 (애니메이션 디버거)'}
          </span>
          {!compact && (
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              (단축키: <kbd className="px-1 py-0.5 bg-slate-800 rounded text-[10px]">←</kbd>{' '}
              <kbd className="px-1 py-0.5 bg-slate-800 rounded text-[10px]">→</kbd> 스텝 이동,{' '}
              <kbd className="px-1 py-0.5 bg-slate-800 rounded text-[10px]">Space</kbd> 재생/정지)
            </span>
          )}
        </div>

        {/* 스텝 통계 배지 */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300">
            Step <strong className="text-amber-300">{totalSteps > 0 ? currentIdx + 1 : 0}</strong> /{' '}
            {totalSteps}
          </span>
          <span
            className={`px-2 py-0.5 rounded border ${
              backtrackCount > 0
                ? 'bg-red-950/50 border-red-500/40 text-red-300'
                : 'bg-slate-950 border-slate-800 text-slate-400'
            }`}
          >
            백트래킹: <strong>{backtrackCount}회</strong>
          </span>
        </div>
      </div>

      {/* 최대 스텝(1,000) 초과 시 재앙적 백트래킹 경고 배너 */}
      {exceededMaxSteps && (
        <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/60 flex items-start gap-2.5 text-xs text-red-200 animate-pulse">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-red-300">
              ⚠️ 최대 추적 상한선({MAX_TRACE_STEPS} 스텝) 도달 — 과도한 백트래킹 감지!
            </div>
            <p className="text-[11px] text-red-200/90 mt-0.5">
              패턴에서 중첩 수량자나 탐욕적 와일드카드(`.*`)로 인해 스텝 수가 폭발적으로 증가하여 안전을 위해 {MAX_TRACE_STEPS} 스텝에서 추적을 일시 정지했습니다.
            </p>
          </div>
        </div>
      )}

      {/* 1. 정규식 토큰 포인터 바 */}
      <div className="bg-slate-950/90 border border-slate-800 rounded-lg p-2.5">
        <div className="text-[11px] text-slate-400 mb-1.5 flex items-center justify-between">
          <span>① 현재 검사 중인 정규식 토큰 포인터</span>
          {currentStep?.tokenRaw && (
            <span className="font-mono text-amber-300 font-semibold">
              활성 토큰: {currentStep.tokenRaw}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          {tokens.map((tok) => {
            const cat = TOKEN_CATEGORIES[tok.category] || TOKEN_CATEGORIES.literal;
            const isActive = currentStep?.tokenId === tok.id;
            return (
              <span
                key={tok.id}
                className={`relative font-mono text-xs px-2 py-0.5 rounded border transition-all duration-150 ${
                  cat.badgeClass
                } ${
                  isActive
                    ? 'ring-2 ring-amber-400 scale-110 z-10 shadow-lg shadow-amber-500/20 font-bold'
                    : 'opacity-65'
                }`}
              >
                {tok.raw}
                {isActive && (
                  <span className="absolute -top-2 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                )}
              </span>
            );
          })}
        </div>
      </div>

      {/* 2. 텍스트 커서 & Zero-width I-beam(|) 포인터 시각화 레이어 */}
      <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
          <span className="text-[11px] text-slate-400">
            ② 텍스트 탐색 커서 & Zero-width 포인터 (<code className="text-cyan-300 font-bold">|</code>)
          </span>
          <div className="flex items-center gap-3 text-[10px] text-slate-400">
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-amber-500/40 border border-amber-400" />
              현재 매칭 시도 구간
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-0.5 h-3 bg-cyan-400 inline-block" />
              Zero-width 포인터(소비 없음)
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500/35 border border-emerald-400" />
              확정된 매칭
            </span>
          </div>
        </div>

        {/* 글자 단위 + 글자 사이 I-beam 커서 렌더링 */}
        <div className="font-mono text-xs leading-loose flex items-center flex-wrap gap-y-1.5 py-1 select-none max-h-[150px] overflow-y-auto">
          {textChars.map((ch, idx) => {
            const [spanStart, spanEnd] = currentStep?.consumedSpan || [-1, -1];
            const inAttemptSpan = idx >= spanStart && idx < spanEnd && spanEnd > spanStart;
            const isCursorAtChar = currentStep && currentStep.textIndex === idx;
            const isConfirmed = (currentStep?.confirmedMatches || []).some(
              (m) => idx >= m.start && idx < m.end
            );
            const isBacktrackHere =
              currentStep?.status === 'backtrack' && currentStep.textIndex === idx;

            return (
              <React.Fragment key={idx}>
                {/* 글자 앞 Zero-width I-beam 커서(|) */}
                {isCursorAtChar && (
                  <span
                    title={`현재 커서 위치: 인덱스 ${idx}${
                      currentStep.isZeroWidth ? ' (Zero-width 검사)' : ''
                    }`}
                    className={`inline-flex flex-col items-center mx-0.5 ${
                      currentStep.status === 'backtrack'
                        ? 'text-red-400'
                        : currentStep.isZeroWidth
                        ? 'text-cyan-400'
                        : 'text-amber-400'
                    }`}
                  >
                    <span
                      className={`w-[3px] h-5 rounded-full ${
                        currentStep.status === 'backtrack'
                          ? 'bg-red-500 animate-ping'
                          : currentStep.isZeroWidth
                          ? 'bg-cyan-400 animate-pulse'
                          : 'bg-amber-400'
                      }`}
                    />
                  </span>
                )}

                {ch === '\n' ? (
                  <span className="px-1 py-0.5 text-[10px] text-slate-600 bg-slate-900 rounded mr-1">
                    ↵
                  </span>
                ) : (
                  <span
                    className={`relative px-1 py-0.5 rounded border transition-all duration-150 ${
                      isBacktrackHere
                        ? 'bg-red-500/40 border-red-400 text-white scale-110'
                        : inAttemptSpan
                        ? 'bg-amber-500/35 border-amber-400 text-amber-100 font-bold'
                        : isConfirmed
                        ? 'bg-emerald-500/25 border-emerald-500/50 text-emerald-200'
                        : 'bg-slate-900/60 border-slate-800/80 text-slate-300'
                    }`}
                  >
                    {ch === ' ' ? '\u00A0' : ch}
                    <sub className="text-[8px] text-slate-500 ml-0.5">{idx}</sub>
                  </span>
                )}
              </React.Fragment>
            );
          })}

          {/* 문자열 맨 끝(EOF) 커서 표시 */}
          {currentStep && currentStep.textIndex === textChars.length && (
            <span className="inline-flex items-center mx-0.5">
              <span className="w-[3px] h-5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-[9px] text-cyan-300 ml-1">[EOF]</span>
            </span>
          )}
        </div>
      </div>

      {/* 3. 현재 스텝 상세 설명 배너 */}
      {currentStep && (
        <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            {statusMeta && (
              <span
                className={`shrink-0 px-2 py-0.5 rounded border text-[11px] font-bold ${statusMeta.cls}`}
              >
                {statusMeta.label}
              </span>
            )}
            <span className="text-slate-200 truncate">{currentStep.description}</span>
          </div>
          <span className="font-mono text-[11px] text-slate-400 shrink-0">
            span({currentStep.consumedSpan[0]}, {currentStep.consumedSpan[1]})
          </span>
        </div>
      )}

      {/* 4. 플레이어 컨트롤 바 & O(1) 슬라이더 */}
      <div className="flex items-center justify-between gap-3 pt-1 flex-wrap">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              setIsPlaying(false);
              setCurrentIdx(0);
            }}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"
            title="처음으로 (Step 1)"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setIsPlaying(false);
              setCurrentIdx((prev) => Math.max(0, prev - 1));
            }}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"
            title="이전 스텝 (←)"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              if (currentIdx + 1 >= totalSteps) setCurrentIdx(0);
              setIsPlaying((prev) => !prev);
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow"
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5" /> 일시정지
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" /> 재생
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsPlaying(false);
              setCurrentIdx((prev) => Math.min(Math.max(0, totalSteps - 1), prev + 1));
            }}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"
            title="다음 스텝 (→)"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setIsPlaying(false);
              setCurrentIdx(Math.max(0, totalSteps - 1));
            }}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"
            title="마지막 스텝으로 (끝)"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* O(1) 스냅샷 슬라이더 */}
        <input
          type="range"
          min={0}
          max={Math.max(0, totalSteps - 1)}
          value={currentIdx}
          onChange={(e) => {
            setIsPlaying(false);
            setCurrentIdx(Number(e.target.value));
          }}
          className="flex-1 min-w-[120px] accent-indigo-500 cursor-pointer"
        />

        {/* 재생 속도 선택 */}
        <div className="flex items-center gap-1">
          {[0.5, 1, 2, 4].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSpeed(s)}
              className={`px-2 py-1 rounded text-[11px] font-mono font-semibold border ${
                speed === s
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
