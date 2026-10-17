import React, { useState } from 'react';
import { Bookmark, Trash2, Play, PlusCircle } from 'lucide-react';

export default function BookmarksSidebar({
  bookmarks,
  onLoadBookmark,
  onDeleteBookmark,
  onCreateCurrentBookmark
}) {
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');

  const handleAdd = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onCreateCurrentBookmark(title.trim(), note.trim());
    setTitle('');
    setNote('');
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* 현재 패턴 빠른 저장 폼 */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3">
        <div className="flex items-center gap-2">
          <Bookmark className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-bold text-white">나만의 정규식 북마크 보관함</h2>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          업무 중 자주 사용하는 정규식 패턴과 테스트 문자열, 치환식(`re.sub`)을 브라우저에 영구 저장해 두고 언제든 꺼내 쓸 수 있습니다.
        </p>

        <form onSubmit={handleAdd} className="space-y-2 pt-1">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="저장할 북마크 제목 (예: 사내 설비 에러코드 추출)"
            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
          />
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="간단한 메모 (선택 사항)"
            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
          />
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            현재 플레이그라운드 패턴 저장하기
          </button>
        </form>
      </div>

      {/* 저장된 북마크 리스트 */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg flex-1 space-y-2.5 overflow-y-auto">
        <div className="text-xs font-bold text-slate-300">
          저장된 스니펫 ({bookmarks.length}개)
        </div>

        {bookmarks.length === 0 ? (
          <div className="text-xs text-slate-500 py-8 text-center">
            아직 저장된 북마크가 없습니다. 위 입력창에서 자주 쓰는 패턴을 추가해 보세요!
          </div>
        ) : (
          <div className="space-y-2">
            {bookmarks.map((bm) => (
              <div
                key={bm.id}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-xs font-bold text-amber-300">{bm.title}</div>
                    {bm.note && <div className="text-[11px] text-slate-400 mt-0.5">{bm.note}</div>}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onLoadBookmark(bm)}
                      className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold flex items-center gap-1"
                    >
                      <Play className="w-3 h-3" /> 불러오기
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteBookmark(bm.id)}
                      className="p-1 rounded bg-slate-900 hover:bg-red-950/60 text-slate-400 hover:text-red-400 border border-slate-800"
                      title="북마크 삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="font-mono text-[11px] text-indigo-200 bg-slate-900 px-2.5 py-1.5 rounded border border-slate-800 truncate">
                  r&apos;{bm.pattern}&apos;
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
