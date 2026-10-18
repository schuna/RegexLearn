import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  GitBranch,
  ListTree,
  AlertTriangle,
  ShieldCheck,
  Repeat,
  Eye,
  Layers
} from 'lucide-react';
import { parsePythonRegexAST, TOKEN_CATEGORIES } from '../engine/regexAstParser';
import { analyzeBacktrackingRisk } from '../engine/pythonRegexEngine';

/**
 * Railroad / Visual Block 노드 렌더러 (재귀적 계층 시각화)
 */
function RailroadNode({ node, activeTokenId, onHoverToken }) {
  const isHovered = activeTokenId && (node.tokenId === activeTokenId || node.quantifier?.tokenId === activeTokenId);
  const catStyle = TOKEN_CATEGORIES[node.category] || TOKEN_CATEGORIES.literal;

  // 그룹 또는 전방/후방 탐색 컨테이너
  if (node.type === 'Group' || node.type === 'Lookaround') {
    const isLookaround = node.type === 'Lookaround';
    return (
      <div
        onMouseEnter={(e) => {
          e.stopPropagation();
          onHoverToken(node.tokenId);
        }}
        onMouseLeave={() => onHoverToken(null)}
        className={`relative flex flex-col rounded-xl border-2 p-2.5 transition-all ${
          isLookaround
            ? 'border-dashed border-rose-500/60 bg-rose-950/20'
            : 'border-indigo-500/60 bg-indigo-950/25'
        } ${isHovered ? 'ring-2 ring-amber-400 shadow-lg shadow-amber-500/10 scale-[1.02]' : ''}`}
      >
        {/* 그룹 헤더 배지 */}
        <div className="flex items-center justify-between gap-2 mb-2 px-1">
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border ${catStyle.badgeClass}`}
          >
            {isLookaround ? <Eye className="w-3 h-3" /> : <Layers className="w-3 h-3" />}
            {node.groupName
              ? `?P<${node.groupName}> (#${node.groupNumber})`
              : node.groupNumber
              ? `Group #${node.groupNumber}`
              : node.title}
          </span>
          {isLookaround && (
            <span className="text-[10px] text-rose-300/90 font-medium bg-rose-900/40 px-1.5 py-0.5 rounded">
              문자 소비 없음
            </span>
          )}
        </div>

        {/* 내부 분기(OR) 또는 시퀀스 */}
        <div className="flex flex-col gap-2">
          {node.branches.map((branch, bIdx) => (
            <div key={bIdx} className="flex items-center gap-1.5 flex-wrap">
              {node.branches.length > 1 && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-300 border border-orange-500/40">
                  {bIdx === 0 ? '경로 1' : `OR 경로 ${bIdx + 1}`}
                </span>
              )}
              {branch.length === 0 ? (
                <span className="text-xs text-slate-500 italic px-2 py-1">(빈 패턴)</span>
              ) : (
                branch.map((child, cIdx) => (
                  <React.Fragment key={cIdx}>
                    {cIdx > 0 && <span className="text-slate-600 font-mono text-xs">→</span>}
                    <RailroadNode
                      node={child}
                      activeTokenId={activeTokenId}
                      onHoverToken={onHoverToken}
                    />
                  </React.Fragment>
                ))
              )}
            </div>
          ))}
        </div>

        {/* 그룹에 붙은 수량자 배지 */}
        {node.quantifier && (
          <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center gap-1.5 text-[11px] text-fuchsia-300 font-medium">
            <Repeat className="w-3 h-3 text-fuchsia-400" />
            <span className="font-mono bg-fuchsia-500/20 px-1.5 py-0.2 rounded border border-fuchsia-500/40">
              {node.quantifier.raw}
            </span>
            <span>{node.quantifier.shortLabel}</span>
          </div>
        )}
      </div>
    );
  }

  // 일반 단일 노드 (문자 클래스, 이스케이프, 앵커, 리터럴, 역참조)
  return (
    <div
      onMouseEnter={(e) => {
        e.stopPropagation();
        onHoverToken(node.tokenId);
      }}
      onMouseLeave={() => onHoverToken(null)}
      className={`group relative flex flex-col justify-between rounded-lg border px-2.5 py-1.5 transition-all cursor-pointer select-none ${
        catStyle.blockClass
      } ${isHovered ? 'ring-2 ring-amber-400 shadow-lg scale-105 z-10' : 'hover:border-slate-400'}`}
    >
      <div className="flex items-center gap-1.5">
        <span className={`w-2 h-2 rounded-full ${catStyle.dotColor}`} />
        <code className="font-mono text-xs font-bold tracking-wide">{node.raw}</code>
      </div>
      <div className="text-[11px] opacity-85 mt-0.5 max-w-[160px] truncate" title={node.title}>
        {node.title.replace(/\s*\([^)]*\)$/, '')}
      </div>

      {/* 수량자 루프 배지 */}
      {node.quantifier && (
        <div
          onMouseEnter={(e) => {
            e.stopPropagation();
            onHoverToken(node.quantifier.tokenId);
          }}
          className={`mt-1.5 flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium border ${
            node.quantifier.isLazy
              ? 'bg-amber-500/20 text-amber-200 border-amber-500/40'
              : 'bg-fuchsia-500/20 text-fuchsia-200 border-fuchsia-500/40'
          }`}
        >
          <Repeat className="w-2.5 h-2.5 shrink-0" />
          <span className="font-mono font-bold">{node.quantifier.raw}</span>
          <span className="truncate">{node.quantifier.shortLabel}</span>
        </div>
      )}
    </div>
  );
}

/**
 * 한국어 자연어 해설 트리 재귀 아이템
 */
function ExplanationTreeItem({ node, depth = 0, activeTokenId, onHoverToken }) {
  const catStyle = TOKEN_CATEGORIES[node.category] || TOKEN_CATEGORIES.literal;
  const isHovered = activeTokenId && (node.tokenId === activeTokenId || node.quantifier?.tokenId === activeTokenId);

  return (
    <div className="flex flex-col">
      <div
        onMouseEnter={() => onHoverToken(node.tokenId)}
        onMouseLeave={() => onHoverToken(null)}
        style={{ marginLeft: `${depth * 16}px` }}
        className={`flex items-start gap-2.5 p-2 rounded-lg border transition-colors ${
          isHovered
            ? 'bg-slate-800/90 border-amber-400/60'
            : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-800/50'
        }`}
      >
        <span
          className={`shrink-0 font-mono text-xs font-semibold px-2 py-0.5 rounded border ${catStyle.badgeClass}`}
        >
          {node.raw.length > 24 ? `${node.raw.slice(0, 22)}…` : node.raw}
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-200">{node.title}</span>
            {node.quantifier && (
              <span className="inline-flex items-center gap-1 text-[11px] font-mono px-1.5 py-0.5 rounded bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40">
                <Repeat className="w-3 h-3" />
                {node.quantifier.raw} ({node.quantifier.shortLabel})
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{node.desc}</p>
          {node.quantifier && (
            <p className="text-[11px] text-fuchsia-300/90 mt-1 bg-fuchsia-950/30 px-2 py-1 rounded border border-fuchsia-800/30">
              ↳ <strong>반복 조건:</strong> {node.quantifier.desc}
            </p>
          )}
        </div>
      </div>

      {/* 하위 그룹 브랜치 */}
      {node.branches &&
        node.branches.map((branch, bIdx) => (
          <div key={bIdx} className="mt-1 space-y-1">
            {node.branches.length > 1 && (
              <div
                style={{ marginLeft: `${(depth + 1) * 16}px` }}
                className="text-[11px] font-semibold text-orange-300 flex items-center gap-1 py-0.5"
              >
                <GitBranch className="w-3 h-3" /> 선택 분기 #{bIdx + 1} (OR)
              </div>
            )}
            {branch.map((child, cIdx) => (
              <ExplanationTreeItem
                key={cIdx}
                node={child}
                depth={depth + 1}
                activeTokenId={activeTokenId}
                onHoverToken={onHoverToken}
              />
            ))}
          </div>
        ))}
    </div>
  );
}

export default function VisualPatternAnalyzer({ pattern, flags, externalActiveTokenId = null }) {
  const [activeTab, setActiveTab] = useState('railroad'); // 'railroad' | 'tree'
  const [hoveredTokenId, setHoveredTokenId] = useState(null);
  const activeTokenId = hoveredTokenId || externalActiveTokenId;

  const { tokens, ast } = useMemo(
    () => parsePythonRegexAST(pattern, Boolean(flags?.x)),
    [pattern, flags?.x]
  );

  const riskAnalysis = useMemo(() => analyzeBacktrackingRisk(pattern), [pattern]);

  const activeTokenObj = useMemo(
    () => tokens.find((t) => t.id === activeTokenId) || null,
    [tokens, activeTokenId]
  );

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
      {/* 상단 헤더 & 시각화 뷰 전환 탭 */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            시각적 패턴 분석기 (Visual Pattern Analyzer)
          </h3>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            — 토큰에 마우스를 올리면 구조와 해설이 연동됩니다
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* 백트래킹 안전도 배지 */}
          {riskAnalysis.level === 'safe' ? (
            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              <ShieldCheck className="w-3.5 h-3.5" /> 백트래킹 안전
            </span>
          ) : (
            <span
              className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium border ${
                riskAnalysis.level === 'danger'
                  ? 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              {riskAnalysis.level === 'danger' ? '백트래킹 위험 감지' : '성능 최적화 권장'}
            </span>
          )}

          <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 ml-1">
            <button
              type="button"
              onClick={() => setActiveTab('railroad')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'railroad'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" /> 블록 흐름도
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('tree')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'tree'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ListTree className="w-3.5 h-3.5" /> 한국어 해설 트리
            </button>
          </div>
        </div>
      </div>

      {/* 1. 토큰별 컬러 하이라이팅 바 */}
      <div className="px-4 py-2.5 bg-slate-950/70 border-b border-slate-800/80">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-semibold text-slate-400">
            토큰 분해 & 컬러 코딩 ({tokens.length}개 토큰)
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            {Object.values(TOKEN_CATEGORIES)
              .slice(0, 6)
              .map((cat) => (
                <span key={cat.id} className="inline-flex items-center gap-1 text-[10px] text-slate-400">
                  <span className={`w-2 h-2 rounded-full ${cat.dotColor}`} />
                  {cat.label}
                </span>
              ))}
          </div>
        </div>

        {tokens.length === 0 ? (
          <div className="text-xs text-slate-500 py-1">정규표현식을 입력하면 토큰별로 색상이 분해됩니다.</div>
        ) : (
          <div className="flex items-center gap-1 flex-wrap py-1">
            {tokens.map((tok) => {
              const cat = TOKEN_CATEGORIES[tok.category] || TOKEN_CATEGORIES.literal;
              const isSelected = activeTokenId === tok.id;
              return (
                <button
                  key={tok.id}
                  type="button"
                  onMouseEnter={() => setHoveredTokenId(tok.id)}
                  onMouseLeave={() => setHoveredTokenId(null)}
                  onClick={() => setHoveredTokenId(tok.id === activeTokenId ? null : tok.id)}
                  className={`font-mono text-xs px-2 py-0.5 rounded border transition-all ${cat.badgeClass} ${
                    isSelected ? 'ring-2 ring-amber-400 scale-110 z-10' : 'hover:opacity-90'
                  }`}
                >
                  {tok.raw}
                </button>
              );
            })}
          </div>
        )}

        {/* 현재 호버/선택된 토큰 즉시 설명 툴팁 바 */}
        {activeTokenObj && (
          <div className="mt-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-amber-500/40 flex items-center gap-2 text-xs animate-fadeIn">
            <code className="font-mono font-bold text-amber-300 bg-amber-950/60 px-1.5 py-0.5 rounded">
              {activeTokenObj.raw}
            </code>
            <span className="font-semibold text-slate-200">{activeTokenObj.title}:</span>
            <span className="text-slate-300">{activeTokenObj.desc}</span>
          </div>
        )}
      </div>

      {/* 백트래킹 경고 알림창 (이슈가 있을 때 표시) */}
      {riskAnalysis.issues.length > 0 && (
        <div className="px-4 py-2.5 bg-amber-950/30 border-b border-amber-500/30 space-y-1.5">
          {riskAnalysis.issues.map((issue, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs">
              <AlertTriangle
                className={`w-4 h-4 shrink-0 mt-0.5 ${
                  issue.severity === 'high' ? 'text-red-400' : 'text-amber-400'
                }`}
              />
              <div>
                <span
                  className={`font-bold ${
                    issue.severity === 'high' ? 'text-red-300' : 'text-amber-300'
                  }`}
                >
                  {issue.title}:{' '}
                </span>
                <span className="text-slate-300">{issue.description}</span>
                <div className="text-emerald-300 font-medium mt-0.5">
                  💡 <strong>최적화 팁:</strong> {issue.suggestion}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 2. 메인 시각화 영역: 블록 흐름도 (Railroad View) vs 한국어 해설 트리 */}
      <div className="p-4 max-h-[290px] overflow-y-auto">
        {activeTab === 'railroad' ? (
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {/* 시작 단자 */}
            <div className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-[11px] font-semibold text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              START
            </div>
            <span className="text-slate-600 font-mono">──▶</span>

            {/* 최상위 브랜치 렌더링 */}
            <div className="flex flex-col gap-2.5">
              {ast.branches.map((branch, bIdx) => (
                <div key={bIdx} className="flex items-center gap-1.5">
                  {ast.branches.length > 1 && (
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-orange-500/20 text-orange-300 border border-orange-500/40 shrink-0">
                      {bIdx === 0 ? '분기 1' : `OR 분기 ${bIdx + 1}`}
                    </span>
                  )}
                  {branch.length === 0 ? (
                    <span className="text-xs text-slate-500 italic px-3 py-1 bg-slate-900 rounded border border-slate-800">
                      패턴을 입력하세요
                    </span>
                  ) : (
                    branch.map((node, nIdx) => (
                      <React.Fragment key={nIdx}>
                        {nIdx > 0 && <span className="text-slate-600 font-mono text-xs">──▶</span>}
                        <RailroadNode
                          node={node}
                          activeTokenId={activeTokenId}
                          onHoverToken={setHoveredTokenId}
                        />
                      </React.Fragment>
                    ))
                  )}
                </div>
              ))}
            </div>

            <span className="text-slate-600 font-mono">──▶</span>
            {/* 종료 단자 */}
            <div className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-950/80 border border-indigo-500/50 text-[11px] font-semibold text-indigo-200">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 border-2 border-white" />
              MATCH
            </div>
          </div>
        ) : (
          <div className="space-y-1.5">
            {ast.branches.map((branch, bIdx) => (
              <div key={bIdx} className="space-y-1.5">
                {ast.branches.length > 1 && (
                  <div className="text-xs font-bold text-orange-300 flex items-center gap-1.5 py-1">
                    <GitBranch className="w-3.5 h-3.5" /> 선택 분기 #{bIdx + 1} (OR 조건)
                  </div>
                )}
                {branch.map((node, nIdx) => (
                  <ExplanationTreeItem
                    key={nIdx}
                    node={node}
                    depth={0}
                    activeTokenId={activeTokenId}
                    onHoverToken={setHoveredTokenId}
                  />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
