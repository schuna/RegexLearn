import React, { useState, useMemo } from 'react';
import {
  Play,
  BookmarkPlus,
  Copy,
  Check,
  Replace,
  Code2,
  Table2,
  AlertCircle,
  Clock,
  Sparkles,
  Activity,
  Edit3
} from 'lucide-react';
import { generatePythonCode } from '../engine/pythonRegexEngine';
import StepByStepTracer from './StepByStepTracer';
import GoalDiffViewer from './GoalDiffViewer';

const GROUP_COLORS = [
  'bg-indigo-500/30 border-indigo-400 text-indigo-100',
  'bg-emerald-500/30 border-emerald-400 text-emerald-100',
  'bg-amber-500/30 border-amber-400 text-amber-100',
  'bg-rose-500/30 border-rose-400 text-rose-100',
  'bg-sky-500/30 border-sky-400 text-sky-100'
];

const FLAG_META = [
  {
    key: 'i',
    short: 're.I',
    name: 'IGNORECASE',
    desc: '영문 대소문자를 구분하지 않고 매칭합니다.'
  },
  {
    key: 'm',
    short: 're.M',
    name: 'MULTILINE',
    desc: '^와 $ 앵커가 전체 문자열이 아닌 각 줄(Line)의 시작과 끝에서 매칭됩니다.'
  },
  {
    key: 's',
    short: 're.S',
    name: 'DOTALL',
    desc: '와일드카드 점(.)이 줄바꿈 문자(\\n)까지 포함하여 모든 문자와 매칭됩니다.'
  },
  {
    key: 'x',
    short: 're.X',
    name: 'VERBOSE',
    desc: '정규식 내부의 공백/줄바꿈을 무시하고 # 주석 작성을 허용합니다.'
  }
];

export default function PlaygroundPanel({
  pattern,
  setPattern,
  flags,
  setFlags,
  testText,
  setTestText,
  replacement,
  setReplacement,
  execResult,
  onSaveBookmark,
  activeWorkbenchTab,
  setActiveWorkbenchTab,
  onActiveTokenChange,
  activeLesson = null
}) {
  const [viewMode, setViewMode] = useState('edit'); // 'edit' | 'trace'
  const [highlightMode, setHighlightMode] = useState('goal'); // 'goal' | 'groups'
  const [codeMode, setCodeMode] = useState('finditer');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedPattern, setCopiedPattern] = useState(false);
  const [hoveredMatchIdx, setHoveredMatchIdx] = useState(null);

  const toggleFlag = (key) => {
    setFlags((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // 테스트 텍스트 내 매칭 구간 분할 (실시간 하이라이트 뷰어용)
  const highlightedTextChunks = useMemo(() => {
    const text = testText ?? '';
    if (!execResult?.isValid || !execResult.matches || execResult.matches.length === 0) {
      return [{ type: 'plain', text }];
    }

    const chunks = [];
    let cursor = 0;

    execResult.matches.forEach((m, idx) => {
      if (m.start > cursor) {
        chunks.push({ type: 'plain', text: text.slice(cursor, m.start) });
      }
      chunks.push({
        type: 'match',
        text: m.fullMatch,
        matchObj: m,
        colorIdx: idx % GROUP_COLORS.length
      });
      cursor = m.end;
    });

    if (cursor < text.length) {
      chunks.push({ type: 'plain', text: text.slice(cursor) });
    }
    return chunks;
  }, [testText, execResult]);

  const pythonCode = useMemo(
    () => generatePythonCode(pattern, testText, flags, replacement, codeMode),
    [pattern, testText, flags, replacement, codeMode]
  );

  const handleCopyCode = () => {
    navigator.clipboard.writeText(pythonCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 1800);
  };

  const handleCopyPattern = () => {
    const isMulti = (pattern || '').includes('\n');
    const rawStr = isMulti ? `r'''${pattern}'''` : `r'${pattern}'`;
    navigator.clipboard.writeText(rawStr);
    setCopiedPattern(true);
    setTimeout(() => setCopiedPattern(false), 1800);
  };

  const insertIntoReplacement = (token) => {
    setReplacement((prev) => `${prev || ''}${token}`);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* 1. Python 정규식 패턴 입력 카드 */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg">
        <div className="flex items-center justify-between gap-2 mb-2.5 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-xs font-bold">
              Python re.compile
            </span>
            <span className="text-xs font-semibold text-slate-300">정규표현식 패턴 (Raw String)</span>
          </div>

          {/* 플래그 토글 버튼 및 액션 */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {FLAG_META.map((f) => {
              const active = Boolean(flags?.[f.key]);
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => toggleFlag(f.key)}
                  title={`${f.short} (re.${f.name}): ${f.desc}`}
                  className={`px-2.5 py-1 rounded-lg font-mono text-xs font-semibold border transition-all ${
                    active
                      ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm shadow-indigo-500/30'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  {f.short}
                </button>
              );
            })}

            <button
              type="button"
              onClick={handleCopyPattern}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-colors ml-1"
              title="Python Raw String 형태로 복사"
            >
              {copiedPattern ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedPattern ? '복사됨!' : "r'...' 복사"}</span>
            </button>

            <button
              type="button"
              onClick={onSaveBookmark}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-medium transition-colors"
              title="현재 정규식과 샘플 텍스트를 내 북마크에 저장"
            >
              <BookmarkPlus className="w-3.5 h-3.5" />
              <span>북마크 저장</span>
            </button>
          </div>
        </div>

        {/* 정규식 에디터 (re.X 모드일 때는 여러 줄 Textarea 자동 확장) */}
        <div
          className={`flex items-start gap-2 rounded-xl bg-slate-950 border-2 px-3.5 py-2.5 transition-colors ${
            !execResult.isValid
              ? 'border-red-500/70'
              : 'border-slate-800 focus-within:border-indigo-500/80'
          }`}
        >
          <span className="font-mono text-sm font-bold text-indigo-400 select-none pt-0.5">
            {flags?.x || (pattern || '').includes('\n') ? "r'''" : "r'"}
          </span>

          {flags?.x || (pattern || '').includes('\n') ? (
            <textarea
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              rows={Math.min(8, Math.max(3, (pattern || '').split('\n').length))}
              placeholder="Python 정규표현식을 입력하세요... (re.X 모드: 줄바꿈 및 # 주석 사용 가능)"
              className="w-full bg-transparent font-mono text-sm text-slate-100 focus:outline-none resize-y leading-relaxed"
              spellCheck={false}
            />
          ) : (
            <input
              type="text"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              placeholder="정규표현식을 입력하세요... 예: (?P<year>\d{4})-(?P<month>\d{2})"
              className="w-full bg-transparent font-mono text-sm text-slate-100 focus:outline-none"
              spellCheck={false}
            />
          )}

          <span className="font-mono text-sm font-bold text-indigo-400 select-none pt-0.5">
            {flags?.x || (pattern || '').includes('\n') ? "'''" : "'"}
          </span>
        </div>

        {/* 상태 표시줄: 매칭 건수, 실행 시간, 문법 오류 또는 호환 경고 */}
        <div className="mt-2.5 flex items-center justify-between gap-2 flex-wrap text-xs">
          {!execResult.isValid ? (
            <div className="flex items-center gap-1.5 text-red-400 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{execResult.error}</span>
            </div>
          ) : (
            <div className="flex items-center gap-3 flex-wrap">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-semibold ${
                  execResult.matches.length > 0
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                <Play className="w-3 h-3 fill-current" />
                {execResult.matches.length > 0
                  ? `총 ${execResult.matches.length}건 매칭됨`
                  : '일치하는 매칭 없음'}
              </span>

              {execResult.groupMeta.length > 0 && (
                <span className="text-indigo-300 font-medium">
                  캡처 그룹 {execResult.groupMeta.length}개 정의됨
                  {execResult.groupMeta.some((g) => g.name) &&
                    ` (명명된 그룹: ${execResult.groupMeta
                      .filter((g) => g.name)
                      .map((g) => g.name)
                      .join(', ')})`}
                </span>
              )}
            </div>
          )}

          <div className="flex items-center gap-2">
            {/* Edit Mode vs Trace Mode 스위칭 버튼 (뷰포트 밀도 제어) */}
            <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setViewMode('edit');
                  if (onActiveTokenChange) onActiveTokenChange(null);
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold transition-colors ${
                  viewMode === 'edit'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" /> 실시간 작성/결과 모드
              </button>
              <button
                type="button"
                onClick={() => setViewMode('trace')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold transition-colors ${
                  viewMode === 'trace'
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-amber-300/80 hover:text-amber-200'
                }`}
              >
                <Activity className="w-3.5 h-3.5" /> Step-by-Step 트레이서
              </button>
            </div>

            <div className="flex items-center gap-1 text-slate-400 font-mono text-[11px]">
              <Clock className="w-3.5 h-3.5" />
              <span>{execResult.execTimeMs} ms</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. 모드별 뷰어: Step-by-Step 트레이서 모드 vs 실시간 작성/매칭 하이라이터 모드 */}
      {viewMode === 'trace' ? (
        <StepByStepTracer
          pattern={pattern}
          testText={testText}
          flags={flags}
          onActiveTokenChange={onActiveTokenChange}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* 좌: 원본 테스트 문자열 입력 */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-200">
                📝 테스트 대상 문자열 (편집 가능)
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                길이: {(testText || '').length}자
              </span>
            </div>
            <textarea
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              rows={6}
              placeholder="여기에 테스트할 로그, 텍스트, 데이터를 입력하거나 붙여넣으세요..."
              className="w-full flex-1 bg-slate-950 border border-slate-800 focus:border-indigo-500/70 rounded-lg p-3 font-mono text-xs text-slate-200 leading-relaxed focus:outline-none resize-y"
              spellCheck={false}
            />
          </div>

          {/* 우: 실시간 매칭 & 시각적 목표(Goal) Diff 하이라이트 프리뷰 */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex flex-col">
            <div className="flex items-center justify-between mb-2 flex-wrap gap-1.5">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                {activeLesson && highlightMode === 'goal'
                  ? '시각적 목표(Goal) Diff 대조 뷰어'
                  : '실시간 매칭 하이라이트 뷰어'}
              </span>

              {activeLesson ? (
                <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setHighlightMode('goal')}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors ${
                      highlightMode === 'goal'
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    🎯 목표(Goal) 비교
                  </button>
                  <button
                    type="button"
                    onClick={() => setHighlightMode('groups')}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors ${
                      highlightMode === 'groups'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    ✨ 그룹 상세 뷰
                  </button>
                </div>
              ) : (
                <span className="text-[11px] text-slate-400">
                  매칭 영역에 마우스를 올리면 상세 그룹이 표시됩니다
                </span>
              )}
            </div>

            {activeLesson && highlightMode === 'goal' ? (
              <GoalDiffViewer
                lesson={activeLesson}
                testText={testText}
                userExecResult={execResult}
              />
            ) : (
              <>
                <div className="w-full flex-1 min-h-[140px] max-h-[220px] overflow-y-auto bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap break-all">
                  {highlightedTextChunks.map((chunk, idx) => {
                    if (chunk.type === 'plain') {
                      return (
                        <span key={idx} className="text-slate-400">
                          {chunk.text}
                        </span>
                      );
                    }
                    const m = chunk.matchObj;
                    const isHovered = hoveredMatchIdx === m.matchIndex;
                    const colorClass = GROUP_COLORS[chunk.colorIdx];
                    return (
                      <span
                        key={idx}
                        onMouseEnter={() => setHoveredMatchIdx(m.matchIndex)}
                        onMouseLeave={() => setHoveredMatchIdx(null)}
                        className={`relative inline rounded px-1 py-0.5 mx-0.5 border font-semibold cursor-pointer transition-transform ${colorClass} ${
                          isHovered ? 'ring-2 ring-white scale-105 z-10' : ''
                        }`}
                        title={`Match #${m.matchIndex + 1} | span(${m.start}, ${m.end})`}
                      >
                        {chunk.text.length === 0 ? '∅' : chunk.text}
                        <sup className="ml-0.5 text-[9px] opacity-80 font-bold">
                          #{m.matchIndex + 1}
                        </sup>
                      </span>
                    );
                  })}
                </div>

                {/* 호버된 매칭 빠른 요약 바 */}
                {hoveredMatchIdx !== null && execResult.matches[hoveredMatchIdx] && (
                  <div className="mt-2 px-3 py-1.5 rounded-lg bg-slate-950 border border-indigo-500/40 text-[11px] flex items-center gap-3 flex-wrap">
                    <span className="font-bold text-indigo-300">
                      Match #{hoveredMatchIdx + 1} span({execResult.matches[hoveredMatchIdx].start},{' '}
                      {execResult.matches[hoveredMatchIdx].end})
                    </span>
                    <span className="text-slate-300 font-mono">
                      group(0): &quot;{execResult.matches[hoveredMatchIdx].fullMatch}&quot;
                    </span>
                    {execResult.matches[hoveredMatchIdx].groups.map((g) => (
                      <span
                        key={g.index}
                        className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-200 font-mono"
                      >
                        {g.name ? `${g.name} (#${g.index})` : `#${g.index}`}: &quot;
                        {g.value ?? 'None'}&quot;
                      </span>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* 3. 하단 워크벤치 탭: ① 매칭/그룹 상세 테이블 | ② re.sub 치환 시뮬레이터 | ③ Python 코드 생성기 */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="flex items-center justify-between px-4 border-b border-slate-800 bg-slate-900 flex-wrap gap-2">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveWorkbenchTab('matches')}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold border-b-2 transition-colors ${
                activeWorkbenchTab === 'matches'
                  ? 'border-indigo-500 text-indigo-300 bg-indigo-950/30'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Table2 className="w-3.5 h-3.5" />
              캡처 그룹 & groupdict() 상세 ({execResult.matches.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveWorkbenchTab('sub')}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold border-b-2 transition-colors ${
                activeWorkbenchTab === 'sub'
                  ? 'border-emerald-500 text-emerald-300 bg-emerald-950/30'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Replace className="w-3.5 h-3.5" />
              re.sub 치환 시뮬레이터
            </button>

            <button
              type="button"
              onClick={() => setActiveWorkbenchTab('code')}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold border-b-2 transition-colors ${
                activeWorkbenchTab === 'code'
                  ? 'border-amber-500 text-amber-300 bg-amber-950/30'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              Python 코드 생성기 (원클릭 복사)
            </button>
          </div>
        </div>

        {/* 탭 1: 매칭 & 캡처 그룹 상세 테이블 */}
        {activeWorkbenchTab === 'matches' && (
          <div className="p-4 max-h-[280px] overflow-y-auto">
            {execResult.matches.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500">
                현재 매칭된 결과가 없습니다. 패턴이나 플래그를 조정해 보세요.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                      <th className="py-2 px-3 w-16">#</th>
                      <th className="py-2 px-3">전체 매칭 — match.group(0)</th>
                      <th className="py-2 px-3 w-28">위치 — span()</th>
                      <th className="py-2 px-3">번호 그룹 — match.groups()</th>
                      <th className="py-2 px-3">명명된 그룹 — match.groupdict()</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {execResult.matches.map((m) => (
                      <tr
                        key={m.matchIndex}
                        onMouseEnter={() => setHoveredMatchIdx(m.matchIndex)}
                        onMouseLeave={() => setHoveredMatchIdx(null)}
                        className="hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-2 px-3 font-bold text-indigo-300">#{m.matchIndex + 1}</td>
                        <td className="py-2 px-3">
                          <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            {m.fullMatch}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-400">
                          ({m.start}, {m.end})
                        </td>
                        <td className="py-2 px-3">
                          {m.groups.length === 0 ? (
                            <span className="text-slate-600">()</span>
                          ) : (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {m.groups.map((g) => (
                                <span
                                  key={g.index}
                                  className="px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-200 border border-indigo-500/30"
                                  title={`match.group(${g.index})`}
                                >
                                  <strong className="text-indigo-400 mr-1">#{g.index}:</strong>
                                  {g.value !== null ? `'${g.value}'` : 'None'}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-3">
                          {Object.keys(m.groupdict).length === 0 ? (
                            <span className="text-slate-600">{'{}'}</span>
                          ) : (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {Object.entries(m.groupdict).map(([k, v]) => (
                                <span
                                  key={k}
                                  className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-200 border border-amber-500/30"
                                >
                                  <strong className="text-amber-400">&apos;{k}&apos;:</strong>{' '}
                                  {v !== null ? `'${v}'` : 'None'}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 탭 2: re.sub 치환 시뮬레이터 */}
        {activeWorkbenchTab === 'sub' && (
          <div className="p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-emerald-300">
                  치환 문자열 (repl):
                </span>
                <span className="text-[11px] text-slate-400">
                  번호 참조(`\\1`, `\\g&lt;1&gt;`) 및 Python 명명된 그룹(`\\g&lt;name&gt;`) 완벽 지원
                </span>
              </div>

              {/* 캡처 그룹 빠른 삽입 버튼 */}
              {execResult.groupMeta.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-[11px] text-slate-400 mr-1">빠른 삽입:</span>
                  {execResult.groupMeta.map((g) => (
                    <button
                      key={g.index}
                      type="button"
                      onClick={() =>
                        insertIntoReplacement(g.name ? `\\g<${g.name}>` : `\\${g.index}`)
                      }
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 font-mono text-[11px]"
                    >
                      + {g.name ? `\\g<${g.name}>` : `\\${g.index}`}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 rounded-xl bg-slate-950 border border-slate-800 focus-within:border-emerald-500/70 px-3.5 py-2">
              <span className="font-mono text-xs font-bold text-emerald-400 select-none">
                repl = r&apos;
              </span>
              <input
                type="text"
                value={replacement}
                onChange={(e) => setReplacement(e.target.value)}
                placeholder="치환할 문자열 패턴 입력... 예: \g<year>년 \g<month>월 또는 \1-****-\2"
                className="w-full bg-transparent font-mono text-xs text-slate-100 focus:outline-none"
                spellCheck={false}
              />
              <span className="font-mono text-xs font-bold text-emerald-400 select-none">
                &apos;
              </span>
            </div>

            {/* 치환 결과 프리뷰 (치환된 부분 하이라이트) */}
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-slate-400">
                  ✨ re.sub() 변환 결과 미리보기 (초록색 하이라이트 = 치환된 영역)
                </span>
              </div>
              <div className="font-mono text-xs leading-relaxed whitespace-pre-wrap break-all text-slate-300 max-h-[160px] overflow-y-auto">
                {execResult.subSegments.map((seg, idx) =>
                  seg.type === 'plain' ? (
                    <span key={idx}>{seg.text}</span>
                  ) : (
                    <span
                      key={idx}
                      title={`원본: "${seg.original}" → 치환됨`}
                      className="px-1 py-0.5 mx-0.5 rounded bg-emerald-500/25 text-emerald-200 border border-emerald-500/40 font-semibold"
                    >
                      {seg.text}
                    </span>
                  )
                )}
              </div>
            </div>
          </div>
        )}

        {/* 탭 3: Python 코드 생성기 */}
        {activeWorkbenchTab === 'code' && (
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { id: 'finditer', label: 're.finditer() [실무 추천]' },
                  { id: 'findall', label: 're.findall()' },
                  { id: 'search', label: 're.search()' },
                  { id: 'sub', label: 're.sub() 치환' }
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setCodeMode(m.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-colors ${
                      codeMode === m.id
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleCopyCode}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors shadow"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Python 코드 복사 완료!' : 'Python 코드 전체 복사'}</span>
              </button>
            </div>

            <pre className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 font-mono text-xs text-slate-200 overflow-x-auto leading-relaxed">
              <code>{pythonCode}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
