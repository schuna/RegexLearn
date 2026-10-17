/**
 * Python `re` 모듈 호환 정규표현식 변환, 실행, 치환(re.sub), 백트래킹 위험 분석 및 코드 생성 엔진
 */

/**
 * Python Verbose 모드(re.X / re.VERBOSE) 전처리:
 * 문자 클래스([...]) 외부의 공백과 # 주석을 제거합니다.
 */
export function stripVerboseRegex(pattern) {
  let result = '';
  let inCharClass = false;
  let i = 0;

  while (i < pattern.length) {
    const ch = pattern[i];

    // 이스케이프 처리
    if (ch === '\\') {
      if (i + 1 < pattern.length) {
        result += ch + pattern[i + 1];
        i += 2;
        continue;
      } else {
        result += ch;
        i++;
        continue;
      }
    }

    // 문자 클래스 진입/탈출
    if (ch === '[' && !inCharClass) {
      inCharClass = true;
      result += ch;
      i++;
      // [^] 또는 []] 케이스 처리
      if (i < pattern.length && pattern[i] === '^') {
        result += pattern[i];
        i++;
      }
      if (i < pattern.length && pattern[i] === ']') {
        result += pattern[i];
        i++;
      }
      continue;
    }

    if (ch === ']' && inCharClass) {
      inCharClass = false;
      result += ch;
      i++;
      continue;
    }

    if (!inCharClass) {
      // # 주석: 줄 끝까지 무시
      if (ch === '#') {
        while (i < pattern.length && pattern[i] !== '\n') {
          i++;
        }
        continue;
      }
      // 공백 문자 무시
      if (/\s/.test(ch)) {
        i++;
        continue;
      }
    }

    result += ch;
    i++;
  }

  return result;
}

/**
 * Python 정규식 문법을 JS RegExp 호환 문법으로 변환하고 캡처 그룹 메타데이터를 추출합니다.
 * 지원 문법:
 * - (?P<name>...) -> (?<name>...)
 * - (?P=name) -> \k<name>
 * - (?#...) -> 인라인 주석 제거
 * - (?imsx) -> 인라인 플래그 추출
 * - \A -> ^, \Z -> $
 */
export function transpilePythonRegex(rawPattern, flagsObj = { i: false, m: false, s: false, x: false }) {
  if (!rawPattern) {
    return {
      jsPattern: '',
      jsFlags: 'g',
      effectiveFlags: { ...flagsObj },
      groupMeta: [],
      warnings: []
    };
  }

  const effectiveFlags = { ...flagsObj };
  let working = rawPattern;
  const warnings = [];

  // 1. 패턴 선두 인라인 플래그 (?imsx) 감지
  const inlineFlagMatch = working.match(/^\(\?([imsx]+)\)/);
  if (inlineFlagMatch) {
    const flagChars = inlineFlagMatch[1];
    if (flagChars.includes('i')) effectiveFlags.i = true;
    if (flagChars.includes('m')) effectiveFlags.m = true;
    if (flagChars.includes('s')) effectiveFlags.s = true;
    if (flagChars.includes('x')) effectiveFlags.x = true;
    working = working.slice(inlineFlagMatch[0].length);
  }

  // 2. re.X (VERBOSE) 모드 처리
  if (effectiveFlags.x) {
    working = stripVerboseRegex(working);
  }

  // 3. 인라인 주석 (?#...) 제거
  working = working.replace(/\(\?#[^)]*\)/g, '');

  // 4. 캡처 그룹 순서 및 이름 추출 (문자 클래스 외부의 여는 괄호 스캔)
  const groupMeta = [];
  let inCharClass = false;
  let groupIndex = 0;
  for (let i = 0; i < working.length; i++) {
    const ch = working[i];
    if (ch === '\\') {
      i++;
      continue;
    }
    if (ch === '[' && !inCharClass) {
      inCharClass = true;
      if (working[i + 1] === '^') i++;
      if (working[i + 1] === ']') i++;
      continue;
    }
    if (ch === ']' && inCharClass) {
      inCharClass = false;
      continue;
    }
    if (!inCharClass && ch === '(') {
      const rest = working.slice(i);
      // 비캡처 / 탐색 / 플래그 확인
      if (rest.startsWith('(?:') || rest.startsWith('(?=') || rest.startsWith('(?!') || rest.startsWith('(?<=') || rest.startsWith('(?<!') || rest.startsWith('(?P=')) {
        continue;
      }
      const pyNamed = rest.match(/^\(\?P<([a-zA-Z_][a-zA-Z0-9_]*)>/);
      const jsNamed = rest.match(/^\(\?<([a-zA-Z_][a-zA-Z0-9_]*)>/);
      if (pyNamed) {
        groupIndex++;
        groupMeta.push({ index: groupIndex, name: pyNamed[1], syntax: 'python' });
      } else if (jsNamed) {
        groupIndex++;
        groupMeta.push({ index: groupIndex, name: jsNamed[1], syntax: 'js' });
        warnings.push(`Python re 모듈에서는 (?<${jsNamed[1]}>...) 대신 (?P<${jsNamed[1]}>...) 문법을 사용합니다. (자동 호환 처리됨)`);
      } else if (!rest.startsWith('(?')) {
        groupIndex++;
        groupMeta.push({ index: groupIndex, name: null, syntax: 'numbered' });
      }
    }
  }

  // 5. Python 고유 문법 변환
  // (?P<name>...) -> (?<name>...)
  let jsPattern = working.replace(/\(\?P<([a-zA-Z_][a-zA-Z0-9_]*)>/g, '(?<$1>');
  // (?P=name) -> \k<name>
  jsPattern = jsPattern.replace(/\(\?P=([a-zA-Z_][a-zA-Z0-9_]*)\)/g, '\\k<$1>');
  // \A -> ^ (문자열 시작), \Z -> $ (문자열 끝)
  jsPattern = jsPattern.replace(/\\A/g, '^').replace(/\\Z/g, '$');

  // 6. JS 플래그 조립
  let jsFlags = 'g';
  if (effectiveFlags.i) jsFlags += 'i';
  if (effectiveFlags.m) jsFlags += 'm';
  if (effectiveFlags.s) jsFlags += 's';

  return {
    jsPattern,
    jsFlags,
    effectiveFlags,
    groupMeta,
    warnings
  };
}

/**
 * Python `re.sub(pattern, repl, string)` 호환 치환 문자열 처리기
 * 지원 문법:
 * - \g<name> : 명명된 그룹 치환
 * - \g<0> : 전체 매칭(group(0)) 치환
 * - \g<1>, \g<2> : 번호 그룹 치환
 * - \1, \2 ... \99 : 번호 그룹 치환
 * - \n, \t : 개행, 탭
 */
export function applyPythonSub(matchObj, replacementTemplate) {
  if (replacementTemplate === undefined || replacementTemplate === null) return '';

  let result = '';
  let i = 0;
  const tpl = String(replacementTemplate);

  while (i < tpl.length) {
    if (tpl[i] === '\\' && i + 1 < tpl.length) {
      const next = tpl[i + 1];

      // \\ 이스케이프된 백슬래시
      if (next === '\\') {
        result += '\\';
        i += 2;
        continue;
      }

      // \n, \t
      if (next === 'n') {
        result += '\n';
        i += 2;
        continue;
      }
      if (next === 't') {
        result += '\t';
        i += 2;
        continue;
      }

      // \g<name> 또는 \g<number>
      const gMatch = tpl.slice(i).match(/^\\g<([a-zA-Z0-9_]+)>/);
      if (gMatch) {
        const key = gMatch[1];
        if (key === '0') {
          result += matchObj.fullMatch ?? '';
        } else if (/^\d+$/.test(key)) {
          const idx = parseInt(key, 10);
          const found = matchObj.groups.find((g) => g.index === idx);
          result += found && found.value !== undefined ? found.value : '';
        } else {
          result += matchObj.groupdict[key] !== undefined ? matchObj.groupdict[key] : '';
        }
        i += gMatch[0].length;
        continue;
      }

      // \1 ~ \99 번호 역참조
      const numMatch = tpl.slice(i).match(/^\\([1-9]\d?)/);
      if (numMatch) {
        const idx = parseInt(numMatch[1], 10);
        const found = matchObj.groups.find((g) => g.index === idx);
        result += found && found.value !== undefined ? found.value : '';
        i += numMatch[0].length;
        continue;
      }
    }

    result += tpl[i];
    i++;
  }

  return result;
}

/**
 * 정규식 실행 및 매칭/치환 결과 반환
 */
export function executePythonRegex(rawPattern, testText, flagsObj = { i: false, m: false, s: false, x: false }, replacementTemplate = '') {
  const startTime = performance.now();

  if (!rawPattern) {
    return {
      isValid: true,
      error: null,
      matches: [],
      subResult: testText || '',
      subSegments: [{ type: 'plain', text: testText || '' }],
      execTimeMs: 0,
      effectiveFlags: flagsObj,
      groupMeta: [],
      warnings: []
    };
  }

  const { jsPattern, jsFlags, effectiveFlags, groupMeta, warnings } = transpilePythonRegex(rawPattern, flagsObj);

  if (!jsPattern && effectiveFlags.x) {
    return {
      isValid: true,
      error: null,
      matches: [],
      subResult: testText || '',
      subSegments: [{ type: 'plain', text: testText || '' }],
      execTimeMs: 0,
      effectiveFlags,
      groupMeta,
      warnings
    };
  }

  let regex;
  try {
    regex = new RegExp(jsPattern, jsFlags);
  } catch (err) {
    return {
      isValid: false,
      error: translateRegexError(err.message, rawPattern),
      matches: [],
      subResult: testText || '',
      subSegments: [{ type: 'plain', text: testText || '' }],
      execTimeMs: 0,
      effectiveFlags,
      groupMeta,
      warnings
    };
  }

  const text = testText ?? '';
  const matches = [];
  let match;
  let safetyCounter = 0;
  const MAX_MATCHES = 500;

  try {
    while ((match = regex.exec(text)) !== null) {
      safetyCounter++;
      if (safetyCounter > MAX_MATCHES) {
        warnings.push(`매칭 건수가 ${MAX_MATCHES}건을 초과하여 일부만 표시합니다.`);
        break;
      }

      const fullMatch = match[0];
      const start = match.index;
      const end = start + fullMatch.length;

      const groups = [];
      const groupdict = {};

      for (let idx = 1; idx < match.length; idx++) {
        const val = match[idx];
        const meta = groupMeta[idx - 1] || { index: idx, name: null };
        groups.push({
          index: idx,
          name: meta.name,
          value: val !== undefined ? val : null
        });
        if (meta.name) {
          groupdict[meta.name] = val !== undefined ? val : null;
        }
      }

      matches.push({
        matchIndex: matches.length,
        fullMatch,
        start,
        end,
        span: [start, end],
        groups,
        groupdict
      });

      // 빈 문자열 매칭 시 무한 루프 방지 (RegExp 표준 동작)
      if (fullMatch.length === 0) {
        regex.lastIndex++;
        if (regex.lastIndex > text.length) break;
      }
    }
  } catch (execErr) {
    return {
      isValid: false,
      error: translateRegexError(execErr.message, rawPattern),
      matches: [],
      subResult: text,
      subSegments: [{ type: 'plain', text }],
      execTimeMs: 0,
      effectiveFlags,
      groupMeta,
      warnings
    };
  }

  // re.sub 결과 및 세그먼트 생성
  let subResult = '';
  const subSegments = [];
  let lastCursor = 0;

  for (const m of matches) {
    if (m.start > lastCursor) {
      const plainChunk = text.slice(lastCursor, m.start);
      subResult += plainChunk;
      subSegments.push({ type: 'plain', text: plainChunk });
    }
    const replacedChunk = applyPythonSub(m, replacementTemplate);
    subResult += replacedChunk;
    subSegments.push({
      type: 'replaced',
      original: m.fullMatch,
      text: replacedChunk,
      matchIndex: m.matchIndex
    });
    lastCursor = m.end;
  }

  if (lastCursor < text.length) {
    const tail = text.slice(lastCursor);
    subResult += tail;
    subSegments.push({ type: 'plain', text: tail });
  }

  const execTimeMs = Number((performance.now() - startTime).toFixed(2));

  return {
    isValid: true,
    error: null,
    matches,
    subResult,
    subSegments,
    execTimeMs,
    effectiveFlags,
    groupMeta,
    warnings
  };
}

/**
 * 영문 RegExp 문법 오류를 이해하기 쉬운 한국어 안내로 변환
 */
function translateRegexError(msg, rawPattern) {
  if (msg.includes('Unterminated group')) {
    return '닫히지 않은 그룹 괄호 `(`가 있습니다. 짝이 맞는 `)`를 확인하거나 리터럴 괄호는 `\\(`로 이스케이프하세요.';
  }
  if (msg.includes('missing /') || msg.includes('Unterminated character class')) {
    return '닫히지 않은 대괄호 문자 클래스 `[`가 있습니다. `]`로 닫아주세요.';
  }
  if (msg.includes('Nothing to repeat')) {
    return '반복 수량자(`*`, `+`, `?`, `{n}`) 앞에 반복할 대상 토큰이 없습니다.';
  }
  if (msg.includes('numbers out of order in {} quantifier')) {
    return '수량자 `{n,m}`에서 최소값(n)이 최대값(m)보다 큽니다.';
  }
  if (msg.includes('Invalid group') || msg.includes('Invalid capture group name')) {
    return '잘못된 그룹 문법이거나 그룹 이름 규칙(영문자/언더스코어로 시작)에 어긋납니다. Python 명명된 그룹은 `(?P<name>...)` 형식을 사용하세요.';
  }
  if (msg.includes('Invalid escape') || msg.includes('\\ at end of pattern')) {
    return '패턴 끝에 단독 백슬래시 `\\`가 있거나 잘못된 이스케이프 시퀀스입니다.';
  }
  return `정규식 문법 오류 (${rawPattern}): ${msg}`;
}

/**
 * 백트래킹(Catastrophic Backtracking) 위험도 및 성능 최적화 분석기 (Lv 5 연계)
 */
export function analyzeBacktrackingRisk(rawPattern) {
  if (!rawPattern) {
    return { level: 'safe', score: 100, issues: [] };
  }

  const issues = [];

  // 1. 중첩된 수량자 (Nested Quantifiers): (a+)+, (\w+)*, (.*)+ 등 - 재앙적 백트래킹 1순위 원인
  const nestedQuantifierRegex = /\([^()]*[+*][^()]*\)[+*]|\([^()]*\{[0-9,]+\}[^()]*\)[+*]/;
  if (nestedQuantifierRegex.test(rawPattern)) {
    issues.push({
      severity: 'high',
      title: '중첩된 수량자 감지 (재앙적 백트래킹 위험!)',
      description: '그룹 내부의 `+` 또는 `*` 반복에 이어 그룹 외부에도 `+`/`*`가 중첩되어 있습니다 (예: `(a+)+`, `(\\w+)+`). 매칭 실패 시 경우의 수가 지수($2^n$) 단위로 폭발하여 CPU가 멈출 수 있습니다.',
      suggestion: '내부 또는 외부 중 불필요한 수량자 하나를 제거하거나, 구분자가 있다면 `\\w+(?:,\\w+)*`와 같이 경계를 명확히 분리하세요.'
    });
  }

  // 2. 인접하거나 중복된 .* 패턴
  if (/\.\*.*\.\*/.test(rawPattern)) {
    issues.push({
      severity: 'medium',
      title: '복수의 탐욕적 와일드카드(`.*`) 사용',
      description: '하나의 패턴 안에 `.*`가 여러 번 등장하면 엔진이 문자열 끝까지 갔다가 되돌아오는 백트래킹(Backtracking)을 반복 수행합니다.',
      suggestion: '게으른 수량자(`.*?`)로 변경하거나, 부정 문자 클래스(예: `[^"\\n]*`, `[^,]*`)로 매칭 범위를 좁혀주세요.'
    });
  }

  // 3. 따옴표나 괄호/태그 안에서 탐욕적 .* 또는 .+ 사용
  if (/["'<]\.[+*]["'>]/.test(rawPattern)) {
    issues.push({
      severity: 'medium',
      title: '구분자(따옴표/태그) 내부의 탐욕적(`.*` / `.+`) 매칭 주의',
      description: '`"..."` 또는 `<...>` 안에 탐욕적 `.*`를 쓰면 첫 번째 닫는 기호에서 멈추지 않고 문장의 가장 마지막 기호까지 한꺼번에 삼켜버립니다.',
      suggestion: '게으른 수량자(`".*?"`, `<.+?>`)를 사용하거나, 닫는 기호를 제외한 부정 문자 클래스(`"[^"]*"`, `<[^>]+>`)를 사용하면 백트래킹 없이 훨씬 빠르게 동작합니다!'
    });
  }

  let level = 'safe';
  if (issues.some((i) => i.severity === 'high')) level = 'danger';
  else if (issues.length > 0) level = 'warning';

  return {
    level,
    issues
  };
}

/**
 * Python `re` 실무 코드 스니펫 자동 생성기
 */
export function generatePythonCode(rawPattern, testText, flagsObj = {}, replacementTemplate = '', mode = 'finditer') {
  const flagList = [];
  if (flagsObj.i) flagList.push('re.IGNORECASE');
  if (flagsObj.m) flagList.push('re.MULTILINE');
  if (flagsObj.s) flagList.push('re.DOTALL');
  if (flagsObj.x) flagList.push('re.VERBOSE');

  const flagExpr = flagList.length > 0 ? `, ${flagList.join(' | ')}` : '';
  const safePattern = (rawPattern || '').replace(/'/g, "\\'");
  const isMultilinePattern = (rawPattern || '').includes('\n');
  const patternLiteral = isMultilinePattern ? `r'''${rawPattern}'''` : `r'${safePattern}'`;

  const safeText = (testText || '').replace(/'''/g, "\\'\\'\\'");
  const textLiteral = (testText || '').includes('\n') ? `'''${safeText}'''` : `'${(testText || '').replace(/'/g, "\\'")}'`;

  if (mode === 'sub') {
    const safeRepl = (replacementTemplate || '').replace(/'/g, "\\'");
    return `import re

# 1. 정규식 패턴 컴파일
pattern = re.compile(${patternLiteral}${flagExpr})

text = ${textLiteral}

# 2. re.sub()로 패턴 치환 실행
result = pattern.sub(r'${safeRepl}', text)
print(result)`;
  }

  if (mode === 'findall') {
    return `import re

# 1. 정규식 패턴 컴파일
pattern = re.compile(${patternLiteral}${flagExpr})

text = ${textLiteral}

# 2. re.findall() 실행 (캡처 그룹이 있으면 그룹 튜플/문자열 리스트 반환)
matches = pattern.findall(text)
for item in matches:
    print(item)`;
  }

  if (mode === 'search') {
    return `import re

# 1. 정규식 패턴 컴파일
pattern = re.compile(${patternLiteral}${flagExpr})

text = ${textLiteral}

# 2. re.search()로 첫 번째 매칭 검색
match = pattern.search(text)
if match:
    print("전체 매칭:", match.group(0))
    print("위치(span):", match.span())
    print("번호 그룹:", match.groups())
    print("명명된 그룹(dict):", match.groupdict())`;
  }

  // 기본값: 실무 활용도가 가장 높은 finditer
  return `import re

# 1. 정규식 패턴 컴파일 (반복 사용 시 성능 최적화)
pattern = re.compile(${patternLiteral}${flagExpr})

text = ${textLiteral}

# 2. re.finditer()로 모든 매칭 객체 순회
for idx, match in enumerate(pattern.finditer(text), 1):
    print(f"[매칭 #{idx}] span={match.span()} -> {match.group(0)!r}")
    if match.groups():
        print("  - groups():", match.groups())
    if match.groupdict():
        print("  - groupdict():", match.groupdict())`;
}
