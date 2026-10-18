/**
 * PyRegex Studio v2.0 — AST 기반 Step-by-Step NFA / Backtracking 트레이서 엔진
 *
 * 특징:
 * 1. JavaScript Generator (`function*`) 기반으로 정규식 AST 노드의 매칭 전진(advance),
 *    경계/탐색 검사(zero-width check), 실패(fail), 백트래킹 되감기(backtrack), 최종 매칭(match) 과정을
 *    스냅샷 배열(`steps[]`)로 생성하여 UI 슬라이더에서 O(1) 조회를 보장합니다.
 * 2. 최대 스텝 상한선(`MAX_TRACE_STEPS = 1000`)을 두어 재앙적 백트래킹(Catastrophic Backtracking) 시
 *    브라우저 프리징을 방지하고 즉시 경고 배너를 띄웁니다.
 * 3. `^`, `$`, `\b`, `(?=...)` 등 폭이 0인(Zero-width) 토큰은 `isZeroWidth: true`로 구분하여
 *    글자와 글자 사이의 I-beam(`|`) 포인터로 렌더링할 수 있게 지원합니다.
 */

import { parsePythonRegexAST } from './regexAstParser';
import { transpilePythonRegex } from './pythonRegexEngine';

export const MAX_TRACE_STEPS = 1000;

/**
 * 단일 AST 원자(Atom) 노드가 현재 텍스트 위치(pos)에서 매칭되는지 판별하는 헬퍼
 */
function matchSingleAtom(node, text, pos, flags) {
  const ignoreCase = Boolean(flags?.i);
  const multiline = Boolean(flags?.m);
  const dotAll = Boolean(flags?.s);

  // 1. 앵커 (^, $) 및 경계 (\b, \B, \A, \Z) -> Zero-width
  if (node.type === 'Anchor' || (node.type === 'Escape' && ['\\b', '\\B', '\\A', '\\Z'].includes(node.raw))) {
    const raw = node.raw;
    if (raw === '^') {
      const ok = pos === 0 || (multiline && text[pos - 1] === '\n');
      return { matched: ok, nextPos: pos, isZeroWidth: true };
    }
    if (raw === '$') {
      const ok = pos === text.length || (multiline && text[pos] === '\n');
      return { matched: ok, nextPos: pos, isZeroWidth: true };
    }
    if (raw === '\\A') {
      return { matched: pos === 0, nextPos: pos, isZeroWidth: true };
    }
    if (raw === '\\Z') {
      return { matched: pos === text.length, nextPos: pos, isZeroWidth: true };
    }
    if (raw === '\\b' || raw === '\\B') {
      const isWordChar = (ch) => ch !== undefined && /[\w가-힣]/.test(ch);
      const leftWord = pos > 0 && isWordChar(text[pos - 1]);
      const rightWord = pos < text.length && isWordChar(text[pos]);
      const isBoundary = leftWord !== rightWord;
      const ok = raw === '\\b' ? isBoundary : !isBoundary;
      return { matched: ok, nextPos: pos, isZeroWidth: true };
    }
  }

  // 2. 전방/후방 탐색 (Lookaround) -> Zero-width
  if (node.type === 'Lookaround') {
    let f = '';
    if (ignoreCase) f += 'i';
    if (multiline) f += 'm';
    if (dotAll) f += 's';

    try {
      const { jsPattern } = transpilePythonRegex(node.raw, flags);
      if (node.groupKind === 'posLookahead' || node.groupKind === 'negLookahead') {
        const subText = text.slice(pos);
        const re = new RegExp(`^${jsPattern}`, f);
        const ok = re.test(subText);
        return { matched: ok, nextPos: pos, isZeroWidth: true };
      } else {
        // Lookbehind: 현재 pos 위치에서 매칭되는지 검사
        const re = new RegExp(`${jsPattern}$`, f);
        const ok = re.test(text.slice(0, pos));
        return { matched: ok, nextPos: pos, isZeroWidth: true };
      }
    } catch {
      return { matched: false, nextPos: pos, isZeroWidth: true };
    }
  }

  // 3. 주석/플래그 노드는 항상 길이 0 통과
  if (node.type === 'Comment' || node.type === 'Flag') {
    return { matched: true, nextPos: pos, isZeroWidth: true };
  }

  // 텍스트 끝에 도달했으면 일반 문자 소비 노드는 실패
  if (pos >= text.length) {
    return { matched: false, nextPos: pos, isZeroWidth: false };
  }

  // 4. 와일드카드 점(.)
  if (node.type === 'Wildcard') {
    const ch = text[pos];
    const ok = dotAll ? true : ch !== '\n' && ch !== '\r';
    return { matched: ok, nextPos: ok ? pos + 1 : pos, isZeroWidth: false };
  }

  // 5. 리터럴 문자열
  if (node.type === 'Literal') {
    const target = node.raw.startsWith('\\') ? node.raw.slice(1) : node.raw;
    const slice = text.slice(pos, pos + target.length);
    const ok = ignoreCase
      ? slice.toLowerCase() === target.toLowerCase()
      : slice === target;
    return { matched: ok, nextPos: ok ? pos + target.length : pos, isZeroWidth: false };
  }

  // 6. 대괄호 문자 클래스 [...] 또는 이스케이프(\d, \w, \s 등)
  if (node.type === 'CharClass' || node.type === 'Escape') {
    let f = '';
    if (ignoreCase) f += 'i';
    try {
      // Python \w가 한글도 매칭하도록 보정
      let pat = node.raw;
      if (pat === '\\w') pat = '[\\w가-힣]';
      if (pat === '\\W') pat = '[^\\w가-힣]';
      const re = new RegExp(`^${pat}`, f);
      const m = text.slice(pos).match(re);
      if (m && m[0].length > 0) {
        return { matched: true, nextPos: pos + m[0].length, isZeroWidth: false };
      }
    } catch {
      // ignore invalid
    }
    return { matched: false, nextPos: pos, isZeroWidth: false };
  }

  return { matched: false, nextPos: pos, isZeroWidth: false };
}

/**
 * 수량자 객체에서 최소(min)/최대(max) 반복 횟수 및 Lazy 여부 파싱
 */
function parseQuantifierBounds(qObj) {
  if (!qObj) return { min: 1, max: 1, isLazy: false };
  const isLazy = Boolean(qObj.isLazy);
  const base = isLazy ? qObj.raw.slice(0, -1) : qObj.raw;

  if (base === '*') return { min: 0, max: Infinity, isLazy };
  if (base === '+') return { min: 1, max: Infinity, isLazy };
  if (base === '?') return { min: 0, max: 1, isLazy };

  const exact = base.match(/^\{(\d+)\}$/);
  if (exact) {
    const n = parseInt(exact[1], 10);
    return { min: n, max: n, isLazy };
  }
  const minOnly = base.match(/^\{(\d+),\}$/);
  if (minOnly) {
    return { min: parseInt(minOnly[1], 10), max: Infinity, isLazy };
  }
  const range = base.match(/^\{(\d+),(\d+)\}$/);
  if (range) {
    return { min: parseInt(range[1], 10), max: parseInt(range[2], 10), isLazy };
  }
  return { min: 1, max: 1, isLazy };
}

/**
 * Python 정규식 Step-by-Step 실행 추적기
 * @returns {{ steps: Array, totalSteps: number, exceededMaxSteps: boolean, backtrackCount: number, tokens: Array }}
 */
export function tracePythonRegexSteps(rawPattern, testText, flags = {}, maxSteps = MAX_TRACE_STEPS) {
  const text = testText ?? '';
  const { tokens, ast } = parsePythonRegexAST(rawPattern, Boolean(flags?.x));

  if (!rawPattern || tokens.length === 0) {
    return {
      steps: [],
      totalSteps: 0,
      exceededMaxSteps: false,
      backtrackCount: 0,
      tokens
    };
  }

  const steps = [];
  let backtrackCount = 0;
  let exceededMaxSteps = false;
  const confirmedMatches = [];

  function recordStep(payload) {
    if (steps.length >= maxSteps) {
      exceededMaxSteps = true;
      return false;
    }
    if (payload.status === 'backtrack') {
      backtrackCount++;
    }
    steps.push({
      stepIndex: steps.length + 1,
      confirmedMatches: [...confirmedMatches],
      ...payload
    });
    return true;
  }

  /**
   * 시퀀스(노드 배열)의 nodeIdx번째 노드부터 매칭을 시도하는 제너레이터
   */
  function* evalSequence(seq, nodeIdx, startPos, currentPos, groupCaptures) {
    if (exceededMaxSteps) return;

    // 시퀀스의 모든 노드를 통과했으면 현재 위치 반환(성공)
    if (nodeIdx >= seq.length) {
      yield currentPos;
      return;
    }

    const node = seq[nodeIdx];
    const { min, max, isLazy } = parseQuantifierBounds(node.quantifier);

    // 단일 노드(1회) 매칭 제너레이터
    function* matchOnce(pos) {
      if (exceededMaxSteps) return;

      // 그룹 노드인 경우 내부 브랜치들을 순회
      if (node.type === 'Group') {
        const capNum = node.groupNumber;
        for (let bIdx = 0; bIdx < node.branches.length; bIdx++) {
          const branch = node.branches[bIdx];
          if (node.branches.length > 1) {
            const ok = recordStep({
              status: 'check',
              tokenId: node.tokenId,
              tokenRaw: node.raw,
              tokenTitle: `${node.title} (분기 #${bIdx + 1})`,
              startPos,
              textIndex: pos,
              consumedSpan: [startPos, pos],
              isZeroWidth: true,
              description: `${node.title}의 선택 분기 #${bIdx + 1} 경로를 시도합니다.`
            });
            if (!ok) return;
          }

          for (const endPos of evalSequence(branch, 0, startPos, pos, groupCaptures)) {
            const prevCap = capNum ? groupCaptures[capNum] : undefined;
            if (capNum) {
              groupCaptures[capNum] = text.slice(pos, endPos);
            }
            yield endPos;
            if (capNum) {
              groupCaptures[capNum] = prevCap;
            }
          }
        }
        return;
      }

      // 역참조 노드(\1, (?P=name))인 경우
      if (node.type === 'Backref') {
        let refVal = '';
        const numMatch = node.raw.match(/^\\([1-9]\d?)/);
        if (numMatch) {
          refVal = groupCaptures[parseInt(numMatch[1], 10)] ?? '';
        }
        const slice = text.slice(pos, pos + refVal.length);
        const matched = flags?.i
          ? slice.toLowerCase() === refVal.toLowerCase()
          : slice === refVal;

        const nextP = matched ? pos + refVal.length : pos;
        const ok = recordStep({
          status: matched ? 'advance' : 'fail',
          tokenId: node.tokenId,
          tokenRaw: node.raw,
          tokenTitle: node.title,
          startPos,
          textIndex: nextP,
          consumedSpan: [startPos, nextP],
          isZeroWidth: refVal.length === 0,
          description: matched
            ? `역참조 ${node.raw}: 앞서 캡처된 "${refVal}"와 일치하여 ${refVal.length}글자 전진합니다.`
            : `역참조 ${node.raw}: 현재 위치 텍스트가 캡처된 "${refVal}"와 일치하지 않습니다.`
        });
        if (!ok) return;
        if (matched) yield nextP;
        return;
      }

      // 일반 원자 노드(리터럴, 문자 클래스, 이스케이프, 앵커, 탐색)
      const res = matchSingleAtom(node, text, pos, flags);
      const inspectedChar = pos < text.length ? `'${text[pos] === '\n' ? '\\n' : text[pos]}'` : '문자열 끝(EOF)';

      const ok = recordStep({
        status: res.matched ? (res.isZeroWidth ? 'check' : 'advance') : 'fail',
        tokenId: node.quantifier ? node.quantifier.tokenId : node.tokenId,
        tokenRaw: node.quantifier ? `${node.raw}${node.quantifier.raw}` : node.raw,
        tokenTitle: node.title,
        startPos,
        textIndex: res.nextPos,
        consumedSpan: [startPos, res.nextPos],
        isZeroWidth: res.isZeroWidth,
        description: res.matched
          ? res.isZeroWidth
            ? `[Zero-width 확인 성공] 인덱스 ${pos}에서 ${node.title} 조건이 성립합니다 (문자 소비 없음).`
            : `[매칭 전진] 인덱스 ${pos}(${inspectedChar})에서 ${node.title} 매칭 성공 → 커서 ${res.nextPos}로 이동`
          : `[매칭 실패] 인덱스 ${pos}(${inspectedChar})에서 ${node.title} 조건 불일치`
      });
      if (!ok) return;

      if (res.matched) {
        yield res.nextPos;
      }
    }

    // 수량자 반복 전개 (재귀적으로 가능한 소비 위치 수집)
    function* expandQuantifier(pos, count) {
      if (exceededMaxSteps) return;

      // Lazy 수량자(*?, +?): 최소 횟수(min) 도달 즉시 다음 노드로 먼저 양보!
      if (isLazy && count >= min) {
        for (const finalPos of evalSequence(seq, nodeIdx + 1, startPos, pos, groupCaptures)) {
          yield finalPos;
        }
        if (exceededMaxSteps) return;
        if (count < max) {
          // 이후 노드가 실패했을 때만 마지못해 1글자 더 확장 (Lazy 확장)
          for (const nextP of matchOnce(pos)) {
            if (nextP === pos && count >= min) break; // 빈 매칭 무한루프 방지
            yield* expandQuantifier(nextP, count + 1);
          }
        }
        return;
      }

      // Greedy 수량자(*, +, ?, {n,m}): 최대(max)까지 먼저 욕심내어 전진한 뒤, 실패 시 백트래킹!
      if (count < max) {
        for (const nextP of matchOnce(pos)) {
          // 길이 0 매칭이 반복되면 무한 루프 방지
          if (nextP === pos && count >= min) {
            break;
          }
          let yieldedAny = false;
          for (const finalPos of expandQuantifier(nextP, count + 1)) {
            yieldedAny = true;
            yield finalPos;
          }
          if (exceededMaxSteps) return;

          // 탐욕적으로 전진했으나 뒤따르는 노드에서 실패하여 되돌아올 때 백트래킹 기록!
          if (!yieldedAny && count + 1 >= min && seq.length > nodeIdx + 1) {
            const ok = recordStep({
              status: 'backtrack',
              tokenId: node.quantifier ? node.quantifier.tokenId : node.tokenId,
              tokenRaw: node.quantifier ? `${node.raw}${node.quantifier.raw}` : node.raw,
              tokenTitle: node.title,
              startPos,
              textIndex: pos,
              consumedSpan: [startPos, pos],
              isZeroWidth: false,
              description: `⏪ [백트래킹(되감기) 발생] 탐욕적 수량자(${node.quantifier?.raw || ''})가 양보하여 커서를 인덱스 ${nextP} → ${pos}로 되돌립니다.`
            });
            if (!ok) return;
          }
        }
      }

      // 최소 횟수(min) 이상을 만족하면 다음 시퀀스 노드로 진행
      if (count >= min) {
        for (const finalPos of evalSequence(seq, nodeIdx + 1, startPos, pos, groupCaptures)) {
          yield finalPos;
        }
      }
    }

    yield* expandQuantifier(currentPos, 0);
  }

  // 전체 텍스트에서 시작 인덱스(searchIdx)를 0부터 이동하며 탐색
  let searchIdx = 0;
  while (searchIdx <= text.length && !exceededMaxSteps) {
    let matchedAtThisStart = false;
    let matchedEndPos = searchIdx;

    for (let bIdx = 0; bIdx < ast.branches.length; bIdx++) {
      const branch = ast.branches[bIdx];
      const gen = evalSequence(branch, 0, searchIdx, searchIdx, {});
      const firstSuccess = gen.next();

      if (!firstSuccess.done && firstSuccess.value !== undefined) {
        matchedAtThisStart = true;
        matchedEndPos = firstSuccess.value;
        break;
      }
    }

    if (exceededMaxSteps) break;

    if (matchedAtThisStart) {
      const matchedStr = text.slice(searchIdx, matchedEndPos);
      confirmedMatches.push({
        start: searchIdx,
        end: matchedEndPos,
        text: matchedStr
      });

      recordStep({
        status: 'match',
        tokenId: null,
        tokenRaw: rawPattern,
        tokenTitle: '매칭 확정 (Match Found)',
        startPos: searchIdx,
        textIndex: matchedEndPos,
        consumedSpan: [searchIdx, matchedEndPos],
        isZeroWidth: matchedEndPos === searchIdx,
        description: `🎉 [매칭 #${confirmedMatches.length} 성공!] span(${searchIdx}, ${matchedEndPos}) 구간 "${matchedStr}" 매칭이 최종 확정되었습니다.`
      });

      // 다음 검색 위치로 점프 (빈 문자열 매칭 시 1칸 전진)
      searchIdx = matchedEndPos > searchIdx ? matchedEndPos : searchIdx + 1;
    } else {
      searchIdx++;
    }
  }

  return {
    steps,
    totalSteps: steps.length,
    exceededMaxSteps,
    backtrackCount,
    tokens
  };
}
