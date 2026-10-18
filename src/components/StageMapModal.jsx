import React from 'react';
import { X, Map, Star, CheckCircle2, Lock, Sparkles, ArrowRight } from 'lucide-react';
import { CURRICULUM_LEVELS } from '../data/curriculumData';

export default function StageMapModal({
  isOpen,
  onClose,
  currentLessonId,
  completedIds = [],
  starredIds = [],
  onSelectLesson
}) {
  if (!isOpen) return null;

  const allLessons = CURRICULUM_LEVELS.flatMap((lv) => lv.lessons);
  const totalCount = allLessons.length;
  const clearCount = completedIds.length;
  const starCount = starredIds.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="w-full max-w-4xl max-h-[88vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* 상단 월드맵 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow">
              <Map className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <span>PyRegex 월드맵 — 전체 코스 스테이지</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Learn Git Branching Style
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                미션을 통과하면 클리어(✓), 권장 패턴 길이(Par) 및 최소 스텝 기준을 달성하면 마스터 별점(★)을 획득합니다!
              </p>
            </div>
          </div>

          {/* 클리어 및 별점 수집 현황 */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-400">클리어:</span>
              <span className="font-bold text-emerald-300">
                {clearCount} / {totalCount}
              </span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-xs">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span className="text-amber-200">마스터 별점:</span>
              <span className="font-bold text-amber-300">
                {starCount} / {totalCount}
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 월드맵 본문: Lv 1 ~ Lv 5 시리즈 노드 연결 뷰 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {CURRICULUM_LEVELS.map((lv) => {
            const lvCompleted = lv.lessons.filter((l) => completedIds.includes(l.id)).length;
            const lvStarred = lv.lessons.filter((l) => starredIds.includes(l.id)).length;

            return (
              <div
                key={lv.level}
                className="rounded-2xl bg-slate-950/80 border border-slate-800/90 p-5 space-y-4"
              >
                {/* 레벨 타이틀 바 */}
                <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`px-3 py-1 rounded-lg text-xs font-extrabold text-white bg-gradient-to-r ${lv.badgeColor} shadow`}
                    >
                      LEVEL {lv.level}
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-white">{lv.title}</h3>
                      <p className="text-xs text-slate-400">{lv.subtitle}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-emerald-400 font-semibold">
                      ✓ {lvCompleted}/{lv.lessons.length} 완료
                    </span>
                    <span className="text-amber-400 font-semibold flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400" /> {lvStarred}/{lv.lessons.length}
                    </span>
                  </div>
                </div>

                {/* 스테이지 원형/카드 노드 연결선 맵 */}
                <div className="flex items-stretch gap-3 overflow-x-auto pb-2 pt-1">
                  {lv.lessons.map((lesson, idx) => {
                    const isCurrent = lesson.id === currentLessonId;
                    const isCleared = completedIds.includes(lesson.id);
                    const isStarred = starredIds.includes(lesson.id);
                    const parLen = (lesson.solution || '').length + 2;

                    return (
                      <React.Fragment key={lesson.id}>
                        {idx > 0 && (
                          <div className="flex items-center justify-center shrink-0">
                            <div
                              className={`w-6 h-1 rounded-full ${
                                isCleared ? 'bg-emerald-500/60' : 'bg-slate-800'
                              }`}
                            />
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            onSelectLesson(lesson);
                            onClose();
                          }}
                          className={`group relative flex-1 min-w-[200px] max-w-[260px] flex flex-col justify-between p-3.5 rounded-xl border-2 text-left transition-all ${
                            isCurrent
                              ? 'bg-indigo-950/60 border-indigo-400 ring-2 ring-indigo-500/40 shadow-lg'
                              : isStarred
                              ? 'bg-amber-950/20 border-amber-500/60 hover:border-amber-400'
                              : isCleared
                              ? 'bg-emerald-950/25 border-emerald-500/50 hover:border-emerald-400'
                              : 'bg-slate-900/70 border-slate-800 hover:border-slate-600'
                          }`}
                        >
                          {/* 상단 번호 아이콘 & 별점 배지 */}
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span
                              className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-mono text-xs font-extrabold border-2 ${
                                isStarred
                                  ? 'bg-amber-500 text-slate-950 border-amber-300 shadow shadow-amber-500/40'
                                  : isCleared
                                  ? 'bg-emerald-500 text-slate-950 border-emerald-300'
                                  : isCurrent
                                  ? 'bg-indigo-600 text-white border-indigo-300'
                                  : 'bg-slate-800 text-slate-300 border-slate-700'
                              }`}
                            >
                              {lesson.step}
                            </span>

                            <div className="flex items-center gap-1">
                              {isCleared && (
                                <span
                                  title="미션 클리어!"
                                  className="p-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                </span>
                              )}
                              <span
                                title={
                                  isStarred
                                    ? '★ 마스터 별점 획득! (권장 길이 & 최적 스텝 달성)'
                                    : `별점 조건: 패턴 ${parLen}자 이하 & 백트래킹 안전`
                                }
                                className={`p-1 rounded-full border ${
                                  isStarred
                                    ? 'bg-amber-500/25 text-amber-300 border-amber-400 shadow-sm shadow-amber-500/30'
                                    : 'bg-slate-900 text-slate-600 border-slate-800'
                                }`}
                              >
                                <Star
                                  className={`w-3.5 h-3.5 ${isStarred ? 'fill-amber-400 text-amber-400' : ''}`}
                                />
                              </span>
                            </div>
                          </div>

                          {/* 스테이지 제목 */}
                          <div className="text-xs font-bold text-slate-100 group-hover:text-white line-clamp-2 leading-snug">
                            {lesson.title}
                          </div>

                          {/* 하단 권장 Par 정보 */}
                          <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                            <span>권장 Par: ≤{parLen}자</span>
                            <span className="inline-flex items-center gap-0.5 text-indigo-400 font-sans font-semibold group-hover:translate-x-0.5 transition-transform">
                              도전하기 <ArrowRight className="w-3 h-3" />
                            </span>
                          </div>
                        </button>
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
