import React, { useState, useMemo, useEffect } from 'react';
import {
  CheckCircle2,
  Circle,
  Lightbulb,
  KeyRound,
  ChevronRight,
  Award,
  Target,
  XCircle,
  RotateCcw
} from 'lucide-react';
import { CURRICULUM_LEVELS } from '../data/curriculumData';
import ConceptDemoWidget from './ConceptDemoWidget';

/**
 * 현재 실행 결과(execResult)가 레슨의 미션 조건을 통과했는지 자동 채점합니다.
 */
function evaluateLessonMission(lesson, execResult) {
  if (!lesson?.validation || !execResult?.isValid) {
    return { passed: false, checks: [] };
  }

  const v = lesson.validation;
  const matchedStrings = execResult.matches.map((m) => m.fullMatch);
  const checks = [];

  // 1. mustMatch & mustNotMatch 유형
  if (v.type === 'match') {
    (v.mustMatch || []).forEach((target) => {
      const ok = matchedStrings.includes(target);
      checks.push({
        label: `매칭 필수: "${target}"`,
        passed: ok,
        kind: 'mustMatch'
      });
    });

    (v.mustNotMatch || []).forEach((target) => {
      const falselyMatched = matchedStrings.some((m) => m === target || target.includes(m) && m.length === target.length);
      const ok = !matchedStrings.includes(target);
      checks.push({
        label: `제외 필수 (매칭 금지): "${target}"`,
        passed: ok && !falselyMatched,
        kind: 'mustNotMatch'
      });
    });
  }

  // 2. exactMatches 유형 (정확히 지정된 매칭 목록과 일치)
  if (v.type === 'exactMatches') {
    const expected = v.expectedMatches || [];
    expected.forEach((exp, idx) => {
      const actual = matchedStrings[idx];
      const ok = actual === exp;
      checks.push({
        label: `매칭 #${idx + 1}: "${exp}" (현재: ${actual ? `"${actual}"` : '없음'})`,
        passed: ok,
        kind: 'exact'
      });
    });

    const countOk = matchedStrings.length === expected.length;
    checks.push({
      label: `전체 매칭 건수 정확히 ${expected.length}건 (현재 ${matchedStrings.length}건)`,
      passed: countOk,
      kind: 'count'
    });
  }

  // 3. 번호 캡처 그룹(Group #1) 추출 검증
  if (v.type === 'capture') {
    const expectedG1 = v.expectedGroup1 || [];
    const actualG1 = execResult.matches.map((m) => m.groups[0]?.value);

    expectedG1.forEach((exp, idx) => {
      const ok = actualG1[idx] === exp;
      checks.push({
        label: `매칭 #${idx + 1}의 Group #1 추출값 == "${exp}" (현재: ${
          actualG1[idx] !== undefined ? `"${actualG1[idx]}"` : '캡처 안 됨'
        })`,
        passed: ok,
        kind: 'capture'
      });
    });
  }

  // 4. Python 명명된 캡처 그룹(?P<name>...) groupdict() 검증
  if (v.type === 'namedCapture') {
    const expectedDict = v.expectedGroupDict || {};
    const firstDict = execResult.matches[0]?.groupdict || {};

    Object.entries(expectedDict).forEach(([key, val]) => {
      const actualVal = firstDict[key];
      const ok = actualVal === val;
      checks.push({
        label: `groupdict()['${key}'] == "${val}" (현재: ${
          actualVal !== undefined ? `"${actualVal}"` : '없음'
        })`,
        passed: ok,
        kind: 'namedCapture'
      });
    });
  }

  // 5. re.sub 치환 결과 검증
  if (v.type === 'sub') {
    const ok = (execResult.subResult || '').trim() === (v.expectedSubResult || '').trim();
    checks.push({
      label: `re.sub 결과 == "${v.expectedSubResult}"`,
      passed: ok,
      kind: 'sub'
    });
  }

  const passed = checks.length > 0 && checks.every((c) => c.passed);
  return { passed, checks };
}

export default function CurriculumSidebar({
  currentLesson,
  onSelectLesson,
  completedIds,
  onMarkCompleted,
  execResult,
  onApplySolution,
  onResetLesson
}) {
  const [hintStep, setHintStep] = useState(0);
  const [showSolutionNote, setShowSolutionNote] = useState(false);

  // 레슨 변경 시 힌트/정답 표시 초기화
  useEffect(() => {
    setHintStep(0);
    setShowSolutionNote(false);
  }, [currentLesson?.id]);

  const evaluation = useMemo(
    () => evaluateLessonMission(currentLesson, execResult),
    [currentLesson, execResult]
  );

  // 미션 통과 시 자동 완료 기록
  useEffect(() => {
    if (evaluation.passed && currentLesson?.id && !completedIds.includes(currentLesson.id)) {
      onMarkCompleted(currentLesson.id);
    }
  }, [evaluation.passed, currentLesson, completedIds, onMarkCompleted]);

  // 전체 레슨 평탄화 목록 (다음 강의 이동용)
  const allLessons = useMemo(
    () => CURRICULUM_LEVELS.flatMap((lv) => lv.lessons),
    []
  );

  const nextLesson = useMemo(() => {
    const idx = allLessons.findIndex((l) => l.id === currentLesson?.id);
    return idx >= 0 && idx + 1 < allLessons.length ? allLessons[idx + 1] : null;
  }, [allLessons, currentLesson]);

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* 1. 레벨 & 강의 선택 네비게이터 */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-lg">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            🎓 5단계 커리큘럼 (Lv 1 ~ Lv 5)
          </span>
          <span className="text-xs font-semibold text-emerald-400">
            진도율: {completedIds.length} / {allLessons.length} 완료 (
            {Math.round((completedIds.length / allLessons.length) * 100)}%)
          </span>
        </div>

        <div className="space-y-2.5 max-h-[210px] overflow-y-auto pr-1">
          {CURRICULUM_LEVELS.map((lv) => (
            <div key={lv.level} className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 px-1">
                <span>{lv.title}</span>
                <span className="text-slate-500 font-normal">{lv.subtitle}</span>
              </div>
              <div className="grid grid-cols-1 gap-1">
                {lv.lessons.map((lesson) => {
                  const isActive = currentLesson?.id === lesson.id;
                  const isDone = completedIds.includes(lesson.id);
                  return (
                    <button
                      key={lesson.id}
                      type="button"
                      onClick={() => onSelectLesson(lesson)}
                      className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-left text-xs transition-all border ${
                        isActive
                          ? 'bg-indigo-600/25 border-indigo-500 text-white font-semibold shadow-sm'
                          : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {isDone ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-slate-600 shrink-0" />
                        )}
                        <span className="font-mono text-[11px] text-indigo-400 shrink-0">
                          {lesson.step}
                        </span>
                        <span className="truncate">{lesson.title}</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. 현재 강의 개념 설명 및 인터랙티브 미션 카드 */}
      {currentLesson && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg flex-1 flex flex-col justify-between gap-4">
          <div className="space-y-3.5">
            {/* 강의 헤더 */}
            <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <span className="inline-block text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mb-1">
                  STEP {currentLesson.step}
                </span>
                <h2 className="text-base font-bold text-white leading-snug">
                  {currentLesson.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={onResetLesson}
                title="이 강의의 초기 패턴으로 리셋"
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" /> 초기화
              </button>
            </div>

            {/* 핵심 개념 가이드 */}
            <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-line bg-slate-950/70 border border-slate-800/90 rounded-xl p-3.5">
              {currentLesson.concept}
            </div>

            {/* 인터랙티브 개념 시연 위젯 (Before / After 애니메이션 비교) */}
            <ConceptDemoWidget lesson={currentLesson} />

            {/* 실습 미션 박스 */}
            <div className="rounded-xl border-2 border-indigo-500/40 bg-indigo-950/20 p-3.5 space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300">
                <Target className="w-4 h-4 text-indigo-400" />
                <span>실습 미션 (Mission)</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">
                {currentLesson.missionDesc}
              </p>

              {/* 실시간 미션 체크리스트 */}
              <div className="space-y-1.5 pt-2 border-t border-indigo-500/20">
                {evaluation.checks.map((chk, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-lg border ${
                      chk.passed
                        ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                        : 'bg-slate-950/70 border-slate-800 text-slate-400'
                    }`}
                  >
                    {chk.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400/80 shrink-0" />
                    )}
                    <span className="font-mono text-[11px] break-all">{chk.label}</span>
                  </div>
                ))}
              </div>

              {/* 미션 성공 축하 배너 */}
              {evaluation.passed && (
                <div className="mt-3 p-3 rounded-xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-between gap-2 animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-emerald-300 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-emerald-200">
                        🎉 미션 클리어! 완벽하게 매칭되었습니다.
                      </div>
                      <div className="text-[11px] text-emerald-300/90 mt-0.5">
                        {currentLesson.solutionExplanation}
                      </div>
                    </div>
                  </div>
                  {nextLesson && (
                    <button
                      type="button"
                      onClick={() => onSelectLesson(nextLesson)}
                      className="shrink-0 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1 shadow"
                    >
                      다음 단계 <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 3. 힌트 및 정답 도우미 푸터 */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setHintStep((prev) =>
                    Math.min((currentLesson.hints || []).length, prev + 1)
                  )
                }
                disabled={hintStep >= (currentLesson.hints || []).length}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 disabled:opacity-50 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-colors"
              >
                <Lightbulb className="w-3.5 h-3.5" />
                {hintStep === 0
                  ? `힌트 보기 (1/${(currentLesson.hints || []).length})`
                  : hintStep < (currentLesson.hints || []).length
                  ? `다음 힌트 보기 (${hintStep + 1}/${currentLesson.hints.length})`
                  : '모든 힌트 표시됨'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowSolutionNote(true);
                  onApplySolution(currentLesson);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 text-xs font-semibold transition-colors"
              >
                <KeyRound className="w-3.5 h-3.5" />
                정답 패턴 적용해보기
              </button>
            </div>

            {/* 단계별 힌트 노출 */}
            {hintStep > 0 && (
              <div className="space-y-1.5 bg-amber-950/30 border border-amber-500/30 rounded-lg p-2.5">
                {currentLesson.hints.slice(0, hintStep).map((h, i) => (
                  <div key={i} className="text-xs text-amber-200 flex items-start gap-1.5">
                    <span className="font-bold shrink-0">💡 힌트 {i + 1}:</span>
                    <span>{h}</span>
                  </div>
                ))}
              </div>
            )}

            {/* 정답 해설 노출 */}
            {showSolutionNote && (
              <div className="bg-indigo-950/40 border border-indigo-500/40 rounded-lg p-2.5 text-xs text-indigo-200 space-y-1">
                <div>
                  <strong>정답 패턴:</strong>{' '}
                  <code className="font-mono bg-slate-900 px-1.5 py-0.5 rounded text-amber-300">
                    {currentLesson.solution}
                  </code>
                </div>
                <p className="text-slate-300">{currentLesson.solutionExplanation}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
