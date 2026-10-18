import React, { useMemo } from 'react';
import { Target, CheckCircle2, AlertTriangle, Search, XCircle } from 'lucide-react';
import { executePythonRegex } from '../engine/pythonRegexEngine';

/**
 * Goal Span vs User Match Span 자동 Diff 진단 매트릭스
 * - exact: 목표 스팬과 사용자 매칭 스팬이 100% 일치
 * - over: 사용자 스팬이 목표 스팬을 포함하면서 더 넓음 (User Span ⊃ Goal Span -> Greedy 주의)
 * - under: 사용자 스팬이 목표 스팬의 부분집합이거나 일부 목표를 놓침 (User Span ⊂ Goal Span)
 * - mismatch: 목표가 아닌 엉뚱한 인덱스를 매칭 (Offset / False Positive)
 */
export function diagnoseGoalDiff(goalMatches, userMatches) {
  if (!goalMatches || goalMatches.length === 0) {
    return null;
  }

  if (!userMatches || userMatches.length === 0) {
    return {
      status: 'empty',
      title: '아직 매칭된 영역이 없습니다',
      message: '초록색 점선 테두리(🎯 목표 영역)와 일치하도록 정규식을 작성해 보세요.'
    };
  }

  // 1. 100% 정확히 일치하는지 검사
  const isExact =
    goalMatches.length === userMatches.length &&
    goalMatches.every(
      (gm, idx) =>
        userMatches[idx] &&
        gm.start === userMatches[idx].start &&
        gm.end === userMatches[idx].end
    );

  if (isExact) {
    return {
      status: 'exact',
      title: '목표 영역과 100% 일치합니다!',
      message: '모든 목표 구간을 오탐 없이 정확하게 매칭했습니다.'
    };
  }

  // 2. 과다 매칭 (Over-matching): 사용자 매칭 중 하나가 목표 매칭보다 더 길게 삼킨 경우 (User ⊃ Goal)
  const hasOverMatch = userMatches.some((um) =>
    goalMatches.some(
      (gm) =>
        um.start <= gm.start &&
        um.end >= gm.end &&
        um.end - um.start > gm.end - gm.start
    )
  );

  if (hasOverMatch) {
    return {
      status: 'over',
      title: '과다 매칭 (Over-matching) 감지',
      message:
        '목표보다 더 넓은 영역이 매칭되었습니다. 탐욕적(Greedy) 수량자(.+, .*)나 범위를 좁혀보세요.'
    };
  }

  // 3. 부분 매칭 (Under-matching): 사용자 매칭이 목표 매칭 내부의 일부분만 매칭한 경우 (User ⊂ Goal)
  const hasUnderMatch = userMatches.some((um) =>
    goalMatches.some(
      (gm) =>
        um.start >= gm.start &&
        um.end <= gm.end &&
        um.end - um.start < gm.end - gm.start
    )
  );

  if (hasUnderMatch) {
    return {
      status: 'under',
      title: '누락/부분 매칭 (Under-matching) 감지',
      message:
        '목표 단어의 일부 글자만 매칭되었습니다. 반복 수량자(+, {n,m})나 문자 클래스를 확인하세요.'
    };
  }

  // 4. 목표와 겹치지 않는 오탐(False Positive / Offset Error)이 있는지 확인
  const hasFalsePositive = userMatches.some(
    (um) => !goalMatches.some((gm) => Math.max(um.start, gm.start) < Math.min(um.end, gm.end))
  );

  if (hasFalsePositive) {
    return {
      status: 'mismatch',
      title: '오탐 (False Positive / Offset Error) 감지',
      message:
        '매칭하지 말아야 할 텍스트가 포함되었습니다. 이스케이프(\\.)나 경계(^, $, \\b), 제외 조건을 확인하세요.'
    };
  }

  // 5. 일부 목표는 정확히 찾았으나 전체 건수가 부족한 경우
  return {
    status: 'under',
    title: `일부 목표 누락 (${userMatches.length} / ${goalMatches.length}건 매칭됨)`,
    message: '일부 목표 구간은 찾았지만 아직 매칭되지 않은 목표(초록 점선)가 남아 있습니다.'
  };
}

export default function GoalDiffViewer({ lesson, testText, userExecResult }) {
  // 레슨의 정답(solution)으로 목표 스팬(Goal Spans) 계산
  const goalExecResult = useMemo(() => {
    if (!lesson?.solution) return null;
    return executePythonRegex(
      lesson.solution,
      testText,
      lesson.initialFlags || { i: false, m: false, s: false, x: false }
    );
  }, [lesson, testText]);

  const goalMatches = goalExecResult?.matches || [];
  const userMatches = userExecResult?.matches || [];

  const diagnosis = useMemo(
    () => diagnoseGoalDiff(goalMatches, userMatches),
    [goalMatches, userMatches]
  );

  // 글자 단위로 Goal 여부와 User 매칭 여부를 분리 계산하여 줄바꿈/중첩 시에도 테두리가 깨지지 않게 처리
  const charSegments = useMemo(() => {
    const text = testText ?? '';
    if (!text) return [];

    // 각 인덱스별 상태(inGoal, inUser) 태깅 후 연속 구간 병합
    const states = Array.from(text).map((ch, idx) => {
      const inGoal = goalMatches.some((gm) => idx >= gm.start && idx < gm.end);
      const inUser = userMatches.some((um) => idx >= um.start && idx < um.end);
      return { ch, idx, inGoal, inUser };
    });

    const segments = [];
    for (const item of states) {
      if (item.ch === '\n') {
        segments.push({ isNewline: true, text: '\n' });
        continue;
      }
      const last = segments[segments.length - 1];
      if (
        last &&
        !last.isNewline &&
        last.inGoal === item.inGoal &&
        last.inUser === item.inUser
      ) {
        last.text += item.ch;
      } else {
        segments.push({
          isNewline: false,
          inGoal: item.inGoal,
          inUser: item.inUser,
          text: item.ch
        });
      }
    }
    return segments;
  }, [testText, goalMatches, userMatches]);

  if (!lesson?.solution) return null;

  return (
    <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 space-y-2.5">
      {/* 상단 범례 헤더 */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
          <Target className="w-3.5 h-3.5 text-emerald-400" />
          시각적 목표(Goal) vs 내 매칭 실시간 Diff 오버레이
        </span>

        <div className="flex items-center gap-3 text-[11px]">
          <span className="inline-flex items-center gap-1 text-emerald-300">
            <span className="w-3.5 h-3 rounded border-2 border-dashed border-emerald-400 inline-block" />
            🎯 목표(Goal)
          </span>
          <span className="inline-flex items-center gap-1 text-amber-300">
            <span className="w-3.5 h-3 rounded bg-amber-400/35 border border-amber-400/60 inline-block" />
            ⚡ 내 매칭
          </span>
          <span className="inline-flex items-center gap-1 text-emerald-200 font-semibold">
            <span className="w-3.5 h-3 rounded bg-emerald-500/35 border-2 border-dashed border-emerald-400 inline-block" />
            ✅ 일치 구간
          </span>
        </div>
      </div>

      {/* 이중 레이어 오버레이 텍스트 뷰어 */}
      <div className="font-mono text-xs leading-relaxed whitespace-pre-wrap break-all bg-slate-900/80 border border-slate-800/90 rounded-lg p-3 max-h-[175px] overflow-y-auto">
        {charSegments.map((seg, idx) => {
          if (seg.isNewline) {
            return <br key={idx} />;
          }

          // 1. 목표(Goal)이면서 동시에 내 매칭(User)인 구간 -> 초록 점선 + 에메랄드 배경
          if (seg.inGoal && seg.inUser) {
            return (
              <span
                key={idx}
                title="✅ 목표와 일치하는 매칭 구간"
                className="px-1 py-0.5 mx-0.5 rounded bg-emerald-500/30 border-2 border-dashed border-emerald-400 text-emerald-100 font-bold"
              >
                {seg.text}
              </span>
            );
          }

          // 2. 목표(Goal)이지만 아직 내가 매칭하지 못한 구간 -> 초록 점선 테두리만 (배경 투명)
          if (seg.inGoal && !seg.inUser) {
            return (
              <span
                key={idx}
                title="🎯 매칭해야 할 목표 구간 (현재 미매칭)"
                className="px-1 py-0.5 mx-0.5 rounded border-2 border-dashed border-emerald-400/85 text-emerald-300/90"
              >
                {seg.text}
              </span>
            );
          }

          // 3. 목표가 아닌데 내가 잘못 매칭한 구간(오탐/과다매칭) -> 노란/호박색 배경 하이라이트
          if (!seg.inGoal && seg.inUser) {
            return (
              <span
                key={idx}
                title="⚠️ 목표 외 매칭 구간 (과다 매칭 또는 오탐)"
                className="px-1 py-0.5 mx-0.5 rounded bg-amber-400/35 border border-amber-400 text-amber-100 font-semibold"
              >
                {seg.text}
              </span>
            );
          }

          // 4. 일반 비매칭 텍스트
          return (
            <span key={idx} className="text-slate-400">
              {seg.text}
            </span>
          );
        })}
      </div>

      {/* 자동 Diff 진단 피드백 배너 */}
      {diagnosis && (
        <div
          className={`flex items-start gap-2 px-3 py-2 rounded-lg border text-xs ${
            diagnosis.status === 'exact'
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
              : diagnosis.status === 'over'
              ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
              : diagnosis.status === 'mismatch'
              ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
              : 'bg-slate-900 border-slate-800 text-slate-300'
          }`}
        >
          {diagnosis.status === 'exact' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          ) : diagnosis.status === 'over' ? (
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          ) : diagnosis.status === 'mismatch' ? (
            <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          ) : (
            <Search className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          )}
          <div>
            <span className="font-bold mr-1.5">{diagnosis.title}:</span>
            <span className="opacity-90">{diagnosis.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
