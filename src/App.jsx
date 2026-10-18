import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  GraduationCap,
  Briefcase,
  FlaskConical,
  Bookmark,
  BookOpen,
  Terminal,
  CheckCircle2
} from 'lucide-react';
import { CURRICULUM_LEVELS } from './data/curriculumData';
import { WORK_PRESETS } from './data/presetsData';
import { executePythonRegex } from './engine/pythonRegexEngine';
import VisualPatternAnalyzer from './components/VisualPatternAnalyzer';
import PlaygroundPanel from './components/PlaygroundPanel';
import CurriculumSidebar from './components/CurriculumSidebar';
import PresetsSidebar from './components/PresetsSidebar';
import BookmarksSidebar from './components/BookmarksSidebar';
import CheatsheetModal from './components/CheatsheetModal';

const STORAGE_KEYS = {
  COMPLETED_LESSONS: 'pyregex_completed_lessons_v1',
  BOOKMARKS: 'pyregex_bookmarks_v1'
};

const DEFAULT_BOOKMARKS = [
  {
    id: 'bm-default-1',
    title: '날짜 연-월-일 Named 캡처',
    note: 'match.groupdict()로 year, month, day 딕셔너리 즉시 추출',
    pattern: '(?P<year>\\d{4})-(?P<month>\\d{2})-(?P<day>\\d{2})',
    replacement: '\\g<year>년 \\g<month>월 \\g<day>일',
    flags: { i: false, m: false, s: false, x: false },
    sampleText: '회의 일정: 2026-10-17, 배포 예정일: 2026-11-05'
  },
  {
    id: 'bm-default-2',
    title: '휴대폰 번호 가운데 4자리 마스킹',
    note: 're.sub 개인정보 비식별화 기본 패턴',
    pattern: '(?P<head>01[016789])-\\d{3,4}-(?P<tail>\\d{4})',
    replacement: '\\g<head>-****-\\g<tail>',
    flags: { i: false, m: false, s: false, x: false },
    sampleText: '연락처: 010-1234-5678 / 비상연락처: 010-987-6543'
  }
];

export default function App() {
  const firstLesson = CURRICULUM_LEVELS[0].lessons[0];

  // 상단 메인 모드: 'learn' | 'presets' | 'playground' | 'bookmarks'
  const [activeMode, setActiveMode] = useState('learn');
  const [currentLesson, setCurrentLesson] = useState(firstLesson);
  const [currentPresetId, setCurrentPresetId] = useState(WORK_PRESETS[0].id);

  // 정규식 실행 상태
  const [pattern, setPattern] = useState(firstLesson.initialPattern);
  const [flags, setFlags] = useState(firstLesson.initialFlags);
  const [testText, setTestText] = useState(firstLesson.sampleText);
  const [replacement, setReplacement] = useState(firstLesson.initialReplacement || '');
  const [activeWorkbenchTab, setActiveWorkbenchTab] = useState('matches');

  // 치트시트 모달 상태 및 트레이서 활성 토큰 연동 상태
  const [isCheatsheetOpen, setIsCheatsheetOpen] = useState(false);
  const [tracerTokenId, setTracerTokenId] = useState(null);

  // 학습 완료 진도 (localStorage 연동)
  const [completedIds, setCompletedIds] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.COMPLETED_LESSONS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 북마크 목록 (localStorage 연동)
  const [bookmarks, setBookmarks] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BOOKMARKS);
      return saved ? JSON.parse(saved) : DEFAULT_BOOKMARKS;
    } catch {
      return DEFAULT_BOOKMARKS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.COMPLETED_LESSONS, JSON.stringify(completedIds));
    } catch {
      // ignore storage errors
    }
  }, [completedIds]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(bookmarks));
    } catch {
      // ignore storage errors
    }
  }, [bookmarks]);

  // 실시간 Python 정규식 실행 결과 계산
  const execResult = useMemo(
    () => executePythonRegex(pattern, testText, flags, replacement),
    [pattern, testText, flags, replacement]
  );

  // 레슨 선택 핸들러
  const handleSelectLesson = useCallback((lesson) => {
    setCurrentLesson(lesson);
    setPattern(lesson.initialPattern);
    setFlags(lesson.initialFlags || { i: false, m: false, s: false, x: false });
    setTestText(lesson.sampleText);
    setReplacement(lesson.initialReplacement || '');
    if (lesson.validation?.type === 'sub') {
      setActiveWorkbenchTab('sub');
    } else {
      setActiveWorkbenchTab('matches');
    }
  }, []);

  // 레슨 정답 적용 핸들러
  const handleApplySolution = useCallback((lesson) => {
    setPattern(lesson.solution);
    if (lesson.solutionReplacement !== undefined) {
      setReplacement(lesson.solutionReplacement);
      setActiveWorkbenchTab('sub');
    }
  }, []);

  // 레슨 완료 기록 핸들러
  const handleMarkCompleted = useCallback((lessonId) => {
    setCompletedIds((prev) => (prev.includes(lessonId) ? prev : [...prev, lessonId]));
  }, []);

  // 실무 프리셋 선택 핸들러
  const handleSelectPreset = useCallback((preset) => {
    setCurrentPresetId(preset.id);
    setPattern(preset.pattern);
    setFlags(preset.flags || { i: false, m: false, s: false, x: false });
    setTestText(preset.sampleText);
    setReplacement(preset.replacement || '');
  }, []);

  // 북마크 불러오기 핸들러
  const handleLoadBookmark = useCallback((bm) => {
    setPattern(bm.pattern);
    setFlags(bm.flags || { i: false, m: false, s: false, x: false });
    setTestText(bm.sampleText || '');
    setReplacement(bm.replacement || '');
  }, []);

  // 북마크 저장 핸들러
  const handleCreateBookmark = useCallback(
    (title, note) => {
      const newBm = {
        id: `bm-${Date.now()}`,
        title,
        note,
        pattern,
        replacement,
        flags,
        sampleText: testText
      };
      setBookmarks((prev) => [newBm, ...prev]);
    },
    [pattern, replacement, flags, testText]
  );

  const handleQuickSaveBookmark = useCallback(() => {
    setActiveMode('bookmarks');
  }, []);

  const handleDeleteBookmark = useCallback((id) => {
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const handleInsertCheatsheetToken = useCallback((token) => {
    if (['re.I', 're.M', 're.S', 're.X'].includes(token)) {
      const key = token.split('.')[1].toLowerCase();
      setFlags((prev) => ({ ...prev, [key]: true }));
      setIsCheatsheetOpen(false);
      return;
    }
    setPattern((prev) => `${prev || ''}${token}`);
    setIsCheatsheetOpen(false);
  }, []);

  const totalLessonsCount = useMemo(
    () => CURRICULUM_LEVELS.reduce((acc, lv) => acc + lv.lessons.length, 0),
    []
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* 상단 네비게이션 헤더 */}
      <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-4 lg:px-6 py-3">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4 flex-wrap">
          {/* 로고 & 타이틀 */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Terminal className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold tracking-tight text-white">
                  PyRegex Studio
                </h1>
                <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Python re Edition
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                시각적 정규표현식 구조 분석 · 단계별 커리큘럼 · 실무 로그/마스킹 실습 워크벤치
              </p>
            </div>
          </div>

          {/* 중앙 모드 전환 탭 */}
          <nav className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveMode('learn')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeMode === 'learn'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>단계별 학습</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveMode('presets');
                const preset = WORK_PRESETS.find((p) => p.id === currentPresetId) || WORK_PRESETS[0];
                handleSelectPreset(preset);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeMode === 'presets'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>실무 예제 프리셋</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMode('playground')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeMode === 'playground'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FlaskConical className="w-4 h-4" />
              <span>자유 플레이그라운드</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMode('bookmarks')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeMode === 'bookmarks'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Bookmark className="w-4 h-4" />
              <span>내 북마크 ({bookmarks.length})</span>
            </button>
          </nav>

          {/* 우측 진도율 & 치트시트 버튼 */}
          <div className="flex items-center gap-2.5">
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-400">학습 진도:</span>
              <span className="font-bold text-emerald-300">
                {completedIds.length}/{totalLessonsCount}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsCheatsheetOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/40 text-xs font-bold transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              <span>Python re 치트시트</span>
            </button>
          </div>
        </div>
      </header>

      {/* 메인 대시보드 콘텐츠 영역 */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 lg:p-6">
        <div
          className={`grid grid-cols-1 gap-5 ${
            activeMode === 'playground' ? 'lg:grid-cols-1' : 'lg:grid-cols-12'
          }`}
        >
          {/* 좌측 패널 (학습 가이드 / 실무 프리셋 / 북마크) - 자유 플레이그라운드 모드일 때는 숨김하여 전체 화면 활용 */}
          {activeMode !== 'playground' && (
            <div className="lg:col-span-5 xl:col-span-4 flex flex-col">
              {activeMode === 'learn' && (
                <CurriculumSidebar
                  currentLesson={currentLesson}
                  onSelectLesson={handleSelectLesson}
                  completedIds={completedIds}
                  onMarkCompleted={handleMarkCompleted}
                  execResult={execResult}
                  onApplySolution={handleApplySolution}
                  onResetLesson={() => handleSelectLesson(currentLesson)}
                />
              )}

              {activeMode === 'presets' && (
                <PresetsSidebar
                  currentPresetId={currentPresetId}
                  onSelectPreset={handleSelectPreset}
                />
              )}

              {activeMode === 'bookmarks' && (
                <BookmarksSidebar
                  bookmarks={bookmarks}
                  onLoadBookmark={handleLoadBookmark}
                  onDeleteBookmark={handleDeleteBookmark}
                  onCreateCurrentBookmark={handleCreateBookmark}
                />
              )}
            </div>
          )}

          {/* 우측(또는 전체) 패널: 실시간 플레이그라운드 + 시각적 패턴 분석기 */}
          <div
            className={`${
              activeMode === 'playground' ? 'col-span-1' : 'lg:col-span-7 xl:col-span-8'
            } flex flex-col gap-4`}
          >
            {/* 1. 시각적 패턴 분석기 (토큰 컬러링 + 블록 흐름도 + 한국어 해설 트리 + 백트래킹 진단) */}
            <VisualPatternAnalyzer
              pattern={pattern}
              flags={flags}
              externalActiveTokenId={tracerTokenId}
            />

            {/* 2. 실시간 플레이그라운드 & 결과 워크벤치 */}
            <PlaygroundPanel
              pattern={pattern}
              setPattern={setPattern}
              flags={flags}
              setFlags={setFlags}
              testText={testText}
              setTestText={setTestText}
              replacement={replacement}
              setReplacement={setReplacement}
              execResult={execResult}
              onSaveBookmark={handleQuickSaveBookmark}
              activeWorkbenchTab={activeWorkbenchTab}
              setActiveWorkbenchTab={setActiveWorkbenchTab}
              onActiveTokenChange={setTracerTokenId}
              activeLesson={activeMode === 'learn' ? currentLesson : null}
            />
          </div>
        </div>
      </main>

      {/* 치트시트 슬라이드오버 모달 */}
      <CheatsheetModal
        isOpen={isCheatsheetOpen}
        onClose={() => setIsCheatsheetOpen(false)}
        onInsertToken={handleInsertCheatsheetToken}
      />
    </div>
  );
}
