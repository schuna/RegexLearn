/**
 * 정규표현식 토크나이저 & 계층형 AST 파서 (시각적 블록 흐름도 & 한국어 자연어 해설 트리용)
 * Python `re` 문법((?P<name>...), (?P=name), (?#...) 등)을 완벽 지원합니다.
 */

export const TOKEN_CATEGORIES = {
  anchor: {
    id: 'anchor',
    label: '앵커/경계',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    blockClass: 'border-amber-500/50 bg-amber-950/40 text-amber-200',
    dotColor: 'bg-amber-400'
  },
  charClass: {
    id: 'charClass',
    label: '문자 집합',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    blockClass: 'border-emerald-500/50 bg-emerald-950/40 text-emerald-200',
    dotColor: 'bg-emerald-400'
  },
  escape: {
    id: 'escape',
    label: '메타/이스케이프',
    badgeClass: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
    blockClass: 'border-sky-500/50 bg-sky-950/40 text-sky-200',
    dotColor: 'bg-sky-400'
  },
  quantifier: {
    id: 'quantifier',
    label: '수량자(반복)',
    badgeClass: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40',
    blockClass: 'border-fuchsia-500/50 bg-fuchsia-950/40 text-fuchsia-200',
    dotColor: 'bg-fuchsia-400'
  },
  group: {
    id: 'group',
    label: '그룹/캡처',
    badgeClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    blockClass: 'border-indigo-500/50 bg-indigo-950/30 text-indigo-200',
    dotColor: 'bg-indigo-400'
  },
  lookaround: {
    id: 'lookaround',
    label: '전방/후방 탐색',
    badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    blockClass: 'border-rose-500/50 bg-rose-950/40 text-rose-200',
    dotColor: 'bg-rose-400'
  },
  backref: {
    id: 'backref',
    label: '역참조',
    badgeClass: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
    blockClass: 'border-teal-500/50 bg-teal-950/40 text-teal-200',
    dotColor: 'bg-teal-400'
  },
  alternation: {
    id: 'alternation',
    label: '선택(OR)',
    badgeClass: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
    blockClass: 'border-orange-500/50 bg-orange-950/40 text-orange-200',
    dotColor: 'bg-orange-400'
  },
  literal: {
    id: 'literal',
    label: '일반 문자',
    badgeClass: 'bg-slate-700/60 text-slate-200 border-slate-600',
    blockClass: 'border-slate-600 bg-slate-800/70 text-slate-100',
    dotColor: 'bg-slate-400'
  },
  comment: {
    id: 'comment',
    label: '주석/플래그',
    badgeClass: 'bg-slate-800 text-slate-400 border-slate-700',
    blockClass: 'border-slate-700 bg-slate-900/50 text-slate-400',
    dotColor: 'bg-slate-500'
  }
};

const ESCAPE_DESCRIPTIONS = {
  '\\d': { title: '숫자 (Digit)', desc: '0부터 9까지의 숫자와 매칭됩니다 ([0-9]와 동일).' },
  '\\D': { title: '숫자가 아닌 문자', desc: '숫자(0-9)를 제외한 모든 문자와 매칭됩니다 ([^0-9]와 동일).' },
  '\\w': { title: '단어 문자 (Word)', desc: '영문자, 숫자, 한글(유니코드), 언더스코어(_)와 매칭됩니다.' },
  '\\W': { title: '단어 문자가 아닌 것', desc: '공백, 구두점, 특수기호 등 단어 문자가 아닌 것과 매칭됩니다.' },
  '\\s': { title: '공백 문자 (Whitespace)', desc: '스페이스, 탭(\\t), 줄바꿈(\\n, \\r) 등 모든 공백과 매칭됩니다.' },
  '\\S': { title: '공백이 아닌 문자', desc: '공백 문자를 제외한 모든 가시적 문자와 매칭됩니다.' },
  '\\b': { title: '단어 경계 (Word Boundary)', desc: '단어 문자(\\w)와 비단어 문자(\\W) 사이의 경계 위치를 가리킵니다 (문자 소비 없음).' },
  '\\B': { title: '단어 경계 아님', desc: '단어 내부 등 단어 경계(\\b)가 아닌 위치를 가리킵니다.' },
  '\\A': { title: '문자열 절대 시작 (\\A)', desc: 'MULTILINE 모드와 무관하게 전체 문자열의 맨 처음 위치와 매칭됩니다 (Python 전용).' },
  '\\Z': { title: '문자열 절대 끝 (\\Z)', desc: '전체 문자열의 맨 끝 위치와 매칭됩니다 (Python 전용).' },
  '\\n': { title: '줄바꿈 (Newline)', desc: '줄바꿈 문자(Line Feed)와 매칭됩니다.' },
  '\\t': { title: '탭 (Tab)', desc: '탭 문자와 매칭됩니다.' },
  '\\r': { title: '캐리지 리턴 (CR)', desc: '캐리지 리턴 문자와 매칭됩니다.' }
};

/**
 * 대괄호 문자 클래스 [...] 내부 내용 한국어 요약 생성
 */
function describeCharClassContent(rawInside) {
  let content = rawInside;
  let isNegated = false;
  if (content.startsWith('^')) {
    isNegated = true;
    content = content.slice(1);
  }

  const parts = [];
  let i = 0;
  while (i < content.length) {
    if (content[i] === '\\' && i + 1 < content.length) {
      const esc = content.slice(i, i + 2);
      if (ESCAPE_DESCRIPTIONS[esc]) {
        parts.push(ESCAPE_DESCRIPTIONS[esc].title);
      } else {
        parts.push(`리터럴 '${content[i + 1]}'`);
      }
      i += 2;
      continue;
    }
    if (i + 2 < content.length && content[i + 1] === '-' && content[i + 2] !== ']') {
      parts.push(`'${content[i]}'~'${content[i + 2]}' 범위`);
      i += 3;
      continue;
    }
    parts.push(`'${content[i]}'`);
    i++;
  }

  const joined = parts.join(', ');
  if (isNegated) {
    return {
      title: `부정 문자 클래스 [^${content}]`,
      desc: `[${joined}] 중 어느 것에도 해당하지 않는 단일 문자 1개와 매칭됩니다.`
    };
  }
  return {
    title: `문자 클래스 [${content}]`,
    desc: `[${joined}] 중 하나에 해당하는 단일 문자 1개와 매칭됩니다.`
  };
}

/**
 * 수량자 문자열(+, *?, {2,4} 등)에 대한 한국어 설명 반환
 */
function describeQuantifier(qRaw) {
  const isLazy = qRaw.endsWith('?') && qRaw.length > 1;
  const base = isLazy ? qRaw.slice(0, -1) : qRaw;
  const modeLabel = isLazy ? '게으른(Lazy/최소) 매칭' : '탐욕적(Greedy/최대) 매칭';

  let countDesc = '';
  if (base === '*') countDesc = '0회 이상 반복';
  else if (base === '+') countDesc = '1회 이상 반복';
  else if (base === '?') countDesc = '0회 또는 1회 (선택적 존재)';
  else {
    const exact = base.match(/^\{(\d+)\}$/);
    const minOnly = base.match(/^\{(\d+),\}$/);
    const range = base.match(/^\{(\d+),(\d+)\}$/);
    if (exact) countDesc = `정확히 ${exact[1]}회 반복`;
    else if (minOnly) countDesc = `최소 ${minOnly[1]}회 이상 반복`;
    else if (range) countDesc = `${range[1]}회 이상 ~ ${range[2]}회 이하 반복`;
    else countDesc = `${base} 반복`;
  }

  return {
    raw: qRaw,
    isLazy,
    shortLabel: `${countDesc}${isLazy ? ' (최소)' : ''}`,
    title: `수량자 ${qRaw} — ${countDesc}`,
    desc: `직전 요소를 ${countDesc}합니다. [${modeLabel}: ${
      isLazy
        ? '조건을 만족하는 가장 짧은 구간에서 즉시 멈춥니다.'
        : '가능한 한 가장 긴 문자열을 매칭하려 시도합니다.'
    }]`
  };
}

/**
 * 정규표현식을 플랫 토큰 리스트(`tokens`)와 계층형 AST(`ast`)로 파싱합니다.
 */
export function parsePythonRegexAST(rawPattern, isVerbose = false) {
  if (!rawPattern) {
    return { tokens: [], ast: { type: 'Root', branches: [[]] } };
  }

  const tokens = [];
  let tokenIdSeq = 1;
  let groupCounter = 0;

  function addToken(category, raw, start, end, title, desc, extra = {}) {
    const token = {
      id: `tok-${tokenIdSeq++}`,
      category,
      raw,
      start,
      end,
      title,
      desc,
      ...extra
    };
    tokens.push(token);
    return token;
  }

  let pos = 0;
  const len = rawPattern.length;

  function parseExpression(stopOnCloseParen = false) {
    const branches = [];
    let currentSequence = [];

    while (pos < len) {
      const startPos = pos;
      const ch = rawPattern[pos];

      if (stopOnCloseParen && ch === ')') {
        break;
      }

      // 1. Verbose 모드일 때 공백 및 # 주석 처리
      if (isVerbose) {
        if (/\s/.test(ch)) {
          while (pos < len && /\s/.test(rawPattern[pos])) pos++;
          continue;
        }
        if (ch === '#') {
          while (pos < len && rawPattern[pos] !== '\n') pos++;
          const commentRaw = rawPattern.slice(startPos, pos);
          const tok = addToken('comment', commentRaw, startPos, pos, '주석 (re.X 모드)', `정규식 엔진이 무시하는 설명 주석입니다: ${commentRaw}`);
          currentSequence.push({ type: 'Comment', raw: commentRaw, tokenId: tok.id, title: tok.title, desc: tok.desc });
          continue;
        }
      }

      // 2. 선택 연산자 |
      if (ch === '|') {
        const tok = addToken(
          'alternation',
          '|',
          startPos,
           startPos + 1,
          '선택 연산자 (OR)',
          '왼쪽 패턴 또는 오른쪽 패턴 중 하나와 매칭됩니다.'
        );
        branches.push(currentSequence);
        currentSequence = [];
        pos++;
        continue;
      }

      // 3. 앵커 ^, $
      if (ch === '^') {
        const tok = addToken(
          'anchor',
          '^',
          startPos,
          startPos + 1,
          '시작 앵커 (^)',
          '문자열의 맨 처음(re.M 멀티라인 모드에서는 각 줄의 시작) 위치와 매칭됩니다.'
        );
        currentSequence.push({ type: 'Anchor', raw: '^', tokenId: tok.id, category: 'anchor', title: tok.title, desc: tok.desc });
        pos++;
        continue;
      }

      if (ch === '$') {
        const tok = addToken(
          'anchor',
          '$',
          startPos,
          startPos + 1,
          '끝 앵커 ($)',
          '문자열의 맨 끝(re.M 멀티라인 모드에서는 각 줄의 끝) 위치와 매칭됩니다.'
        );
        currentSequence.push({ type: 'Anchor', raw: '$', tokenId: tok.id, category: 'anchor', title: tok.title, desc: tok.desc });
        pos++;
        continue;
      }

      // 4. 와일드카드 점(.)
      if (ch === '.') {
        const tok = addToken(
          'escape',
          '.',
          startPos,
          startPos + 1,
          '모든 문자 (.)',
          '줄바꿈(\\n)을 제외한 모든 단일 문자 1개와 매칭됩니다 (re.S 플래그 사용 시 줄바꿈 포함).'
        );
        currentSequence.push({ type: 'Wildcard', raw: '.', tokenId: tok.id, category: 'escape', title: tok.title, desc: tok.desc });
        pos++;
        attachQuantifierIfPresent(currentSequence);
        continue;
      }

      // 5. 대괄호 문자 클래스 [...]
      if (ch === '[') {
        let endIdx = pos + 1;
        if (endIdx < len && rawPattern[endIdx] === '^') endIdx++;
        if (endIdx < len && rawPattern[endIdx] === ']') endIdx++;
        while (endIdx < len && rawPattern[endIdx] !== ']') {
          if (rawPattern[endIdx] === '\\') endIdx += 2;
          else endIdx++;
        }
        const closePos = endIdx < len ? endIdx + 1 : len;
        const rawClass = rawPattern.slice(startPos, closePos);
        const inside = rawClass.slice(1, rawClass.endsWith(']') ? -1 : undefined);
        const info = describeCharClassContent(inside);
        const tok = addToken('charClass', rawClass, startPos, closePos, info.title, info.desc);
        currentSequence.push({
          type: 'CharClass',
          raw: rawClass,
          tokenId: tok.id,
          category: 'charClass',
          title: info.title,
          desc: info.desc
        });
        pos = closePos;
        attachQuantifierIfPresent(currentSequence);
        continue;
      }

      // 6. 이스케이프 시퀀스 \...
      if (ch === '\\') {
        if (pos + 1 >= len) {
          const tok = addToken('literal', '\\', startPos, startPos + 1, '백슬래시', '불완전한 이스케이프 백슬래시입니다.');
          currentSequence.push({ type: 'Literal', raw: '\\', tokenId: tok.id, category: 'literal', title: tok.title, desc: tok.desc });
          pos++;
          continue;
        }

        // 번호 역참조 \1 ~ \99
        const numRef = rawPattern.slice(pos).match(/^\\([1-9]\d?)/);
        if (numRef) {
          const rawRef = numRef[0];
          const grpNum = numRef[1];
          const tok = addToken(
            'backref',
            rawRef,
            startPos,
            startPos + rawRef.length,
            `역참조 (${rawRef})`,
            `${grpNum}번 캡처 그룹에서 앞서 매칭된 것과 완전히 동일한 텍스트와 매칭됩니다.`
          );
          currentSequence.push({
            type: 'Backref',
            raw: rawRef,
            tokenId: tok.id,
            category: 'backref',
            title: tok.title,
            desc: tok.desc
          });
          pos += rawRef.length;
          attachQuantifierIfPresent(currentSequence);
          continue;
        }

        const escRaw = rawPattern.slice(pos, pos + 2);
        const escInfo = ESCAPE_DESCRIPTIONS[escRaw];
        if (escInfo) {
          const cat = ['\\b', '\\B', '\\A', '\\Z'].includes(escRaw) ? 'anchor' : 'escape';
          const tok = addToken(cat, escRaw, startPos, pos + 2, `${escInfo.title} (${escRaw})`, escInfo.desc);
          currentSequence.push({
            type: 'Escape',
            raw: escRaw,
            tokenId: tok.id,
            category: cat,
            title: tok.title,
            desc: tok.desc
          });
        } else {
          const escapedChar = rawPattern[pos + 1];
          const tok = addToken(
            'literal',
            escRaw,
            startPos,
            pos + 2,
            `이스케이프된 문자 '${escapedChar}'`,
            `메타문자가 아닌 실제 문자 '${escapedChar}' 자체와 매칭됩니다.`
          );
          currentSequence.push({
            type: 'Literal',
            raw: escRaw,
            tokenId: tok.id,
            category: 'literal',
            title: tok.title,
            desc: tok.desc
          });
        }
        pos += 2;
        attachQuantifierIfPresent(currentSequence);
        continue;
      }

      // 7. 괄호 그룹 / 탐색 / 인라인 플래그 (...)
      if (ch === '(') {
        const rest = rawPattern.slice(pos);

        // 7-a. 인라인 주석 (?#...)
        const commentMatch = rest.match(/^\(\?#([^)]*)\)/);
        if (commentMatch) {
          const rawC = commentMatch[0];
          const tok = addToken('comment', rawC, startPos, startPos + rawC.length, '인라인 주석 (?#...)', `설명 주석: ${commentMatch[1]}`);
          currentSequence.push({ type: 'Comment', raw: rawC, tokenId: tok.id, category: 'comment', title: tok.title, desc: tok.desc });
          pos += rawC.length;
          continue;
        }

        // 7-b. 인라인 플래그 (?imsx)
        const flagMatch = rest.match(/^\(\?([imsx]+)\)/);
        if (flagMatch) {
          const rawF = flagMatch[0];
          const tok = addToken('comment', rawF, startPos, startPos + rawF.length, `인라인 플래그 ${rawF}`, `패턴에 ${flagMatch[1].toUpperCase()} 플래그 옵션을 활성화합니다.`);
          currentSequence.push({ type: 'Flag', raw: rawF, tokenId: tok.id, category: 'comment', title: tok.title, desc: tok.desc });
          pos += rawF.length;
          continue;
        }

        // 7-c. Python 명명된 역참조 (?P=name)
        const pyBackrefMatch = rest.match(/^\(\?P=([a-zA-Z_][a-zA-Z0-9_]*)\)/);
        if (pyBackrefMatch) {
          const rawRef = pyBackrefMatch[0];
          const gName = pyBackrefMatch[1];
          const tok = addToken(
            'backref',
            rawRef,
            startPos,
            startPos + rawRef.length,
            `명명된 역참조 (?P=${gName})`,
            `'${gName}' 그룹에서 앞서 캡처된 문자열과 정확히 일치하는 텍스트를 다시 매칭합니다.`
          );
          currentSequence.push({
            type: 'Backref',
            raw: rawRef,
            tokenId: tok.id,
            category: 'backref',
            title: tok.title,
            desc: tok.desc
          });
          pos += rawRef.length;
          attachQuantifierIfPresent(currentSequence);
          continue;
        }

        // 7-d. 그룹 헤더 판별
        let groupKind = 'capture';
        let headerLen = 1;
        let groupName = null;
        let groupNumber = null;
        let groupTitle = '';
        let groupDesc = '';
        let category = 'group';

        const pyNamed = rest.match(/^\(\?P<([a-zA-Z_][a-zA-Z0-9_]*)>/);
        const jsNamed = rest.match(/^\(\?<([a-zA-Z_][a-zA-Z0-9_]*)>/);

        if (pyNamed) {
          groupKind = 'named';
          headerLen = pyNamed[0].length;
          groupName = pyNamed[1];
          groupCounter++;
          groupNumber = groupCounter;
          groupTitle = `명명된 캡처 그룹 #${groupNumber} '${groupName}'`;
          groupDesc = `괄호 안의 패턴을 매칭하고 '${groupName}' 이름(groupdict()['${groupName}']) 및 #${groupNumber}번 그룹으로 추출합니다.`;
        } else if (jsNamed) {
          groupKind = 'named';
          headerLen = jsNamed[0].length;
          groupName = jsNamed[1];
          groupCounter++;
          groupNumber = groupCounter;
          groupTitle = `명명된 캡처 그룹 #${groupNumber} '${groupName}'`;
          groupDesc = `Python에서는 (?P<${groupName}>...) 문법이 표준입니다. '${groupName}' 이름으로 캡처합니다.`;
        } else if (rest.startsWith('(?:')) {
          groupKind = 'nonCapture';
          headerLen = 3;
          groupTitle = '비캡처 그룹 (?:...)';
          groupDesc = '여러 요소를 하나의 단위로 묶어 수량자나 OR(|)를 적용하되, 캡처 그룹 번호는 할당하지 않습니다.';
        } else if (rest.startsWith('(?=')) {
          groupKind = 'posLookahead';
          headerLen = 3;
          category = 'lookaround';
          groupTitle = '긍정 전방탐색 (?=...)';
          groupDesc = '현재 위치 바로 오른쪽(뒤)에 이 패턴이 존재하는지 확인만 하고, 실제 매칭 문자열은 소비하지 않습니다.';
        } else if (rest.startsWith('(?!')) {
          groupKind = 'negLookahead';
          headerLen = 3;
          category = 'lookaround';
          groupTitle = '부정 전방탐색 (?!...)';
          groupDesc = '현재 위치 바로 오른쪽(뒤)에 이 패턴이 존재하지 않아야 매칭에 성공합니다 (문자 소비 없음).';
        } else if (rest.startsWith('(?<=')) {
          groupKind = 'posLookbehind';
          headerLen = 4;
          category = 'lookaround';
          groupTitle = '긍정 후방탐색 (?<=...)';
          groupDesc = '현재 위치 바로 왼쪽(앞)에 이 패턴이 존재하는지 확인만 하고, 문자는 소비하지 않습니다.';
        } else if (rest.startsWith('(?<!')) {
          groupKind = 'negLookbehind';
          headerLen = 4;
          category = 'lookaround';
          groupTitle = '부정 후방탐색 (?<!...)';
          groupDesc = '현재 위치 바로 왼쪽(앞)에 이 패턴이 존재하지 않아야 매칭에 성공합니다 (문자 소비 없음).';
        } else {
          groupKind = 'capture';
          headerLen = 1;
          groupCounter++;
          groupNumber = groupCounter;
          groupTitle = `캡처 그룹 #${groupNumber} (...)`;
          groupDesc = `괄호 안의 패턴을 하나로 묶고 매칭된 텍스트를 #${groupNumber}번 그룹(match.group(${groupNumber}))으로 추출합니다.`;
        }

        const openRaw = rawPattern.slice(pos, pos + headerLen);
        const openTok = addToken(category, openRaw, pos, pos + headerLen, groupTitle, groupDesc);
        pos += headerLen;

        const innerAst = parseExpression(true);

        let closeRaw = '';
        if (pos < len && rawPattern[pos] === ')') {
          closeRaw = ')';
          addToken(category, ')', pos, pos + 1, `${groupTitle} 닫기`, `${groupTitle}의 끝입니다.`);
          pos++;
        }

        const fullGroupRaw = rawPattern.slice(startPos, pos);
        currentSequence.push({
          type: category === 'lookaround' ? 'Lookaround' : 'Group',
          groupKind,
          groupNumber,
          groupName,
          raw: fullGroupRaw,
          tokenId: openTok.id,
          category,
          title: groupTitle,
          desc: groupDesc,
          branches: innerAst.branches
        });

        attachQuantifierIfPresent(currentSequence);
        continue;
      }

      // 8. 단독 수량자(앞에 대상이 없는 경우 방어)
      if (['*', '+', '?'].includes(ch)) {
        const tok = addToken('quantifier', ch, startPos, startPos + 1, `수량자 ${ch}`, '반복 수량자입니다.');
        currentSequence.push({ type: 'Quantifier', raw: ch, tokenId: tok.id, category: 'quantifier', title: tok.title, desc: tok.desc });
        pos++;
        continue;
      }

      // 9. 일반 리터럴 문자 (연속된 일반 문자는 묶어서 가독성 향상, 단 수량자가 뒤따르는 마지막 1글자는 분리)
      let litEnd = pos + 1;
      while (
        litEnd < len &&
        !['\\', '.', '^', '$', '[', ']', '(', ')', '|', '*', '+', '?', '{'].includes(rawPattern[litEnd]) &&
        !(isVerbose && (/\s/.test(rawPattern[litEnd]) || rawPattern[litEnd] === '#'))
      ) {
        litEnd++;
      }

      // 만약 litEnd 직후에 수량자(*, +, ?, {n,m})가 오고 리터럴 길이가 2 이상이면, 마지막 1글자만 수량자의 적용을 받으므로 분리
      if (litEnd - pos > 1 && litEnd < len && isQuantifierAt(rawPattern, litEnd)) {
        litEnd--;
      }

      const litRaw = rawPattern.slice(startPos, litEnd);
      const tok = addToken(
        'literal',
        litRaw,
        startPos,
        litEnd,
        `리터럴 문자열 '${litRaw}'`,
        `문자열 '${litRaw}'(대소문자 구분 기본)과 글자 그대로 정확히 일치해야 합니다.`
      );
      currentSequence.push({
        type: 'Literal',
        raw: litRaw,
        tokenId: tok.id,
        category: 'literal',
        title: tok.title,
        desc: tok.desc
      });
      pos = litEnd;
      attachQuantifierIfPresent(currentSequence);
    }

    branches.push(currentSequence);
    return { type: 'Expression', branches };
  }

  function isQuantifierAt(str, idx) {
    const rest = str.slice(idx);
    return /^(\*\?|\+\?|\?\?|\*|\+|\?|\{\d+(?:,\d*)?\}\??)/.test(rest);
  }

  function attachQuantifierIfPresent(sequence) {
    if (sequence.length === 0 || pos >= len) return;
    const rest = rawPattern.slice(pos);
    const qMatch = rest.match(/^(\*\?|\+\?|\?\?|\*|\+|\?|\{\d+(?:,\d*)?\}\??)/);
    if (!qMatch) return;

    const qRaw = qMatch[1];
    const qInfo = describeQuantifier(qRaw);
    const qTok = addToken('quantifier', qRaw, pos, pos + qRaw.length, qInfo.title, qInfo.desc);
    pos += qRaw.length;

    const prevNode = sequence[sequence.length - 1];
    prevNode.quantifier = {
      raw: qRaw,
      tokenId: qTok.id,
      isLazy: qInfo.isLazy,
      shortLabel: qInfo.shortLabel,
      title: qInfo.title,
      desc: qInfo.desc
    };
  }

  const ast = parseExpression(false);
  return { tokens, ast };
}
