/**
 * Python `re` 인터랙티브 치트시트 데이터
 * 클릭 시 플레이그라운드 입력창에 즉시 삽입하거나 예제를 확인할 수 있습니다.
 */

export const CHEATSHEET_SECTIONS = [
  {
    category: '문자 클래스 (Character Classes)',
    items: [
      { token: '.', label: '줄바꿈(\\n) 제외 모든 문자 1개', example: 'a.c → "abc", "a1c"' },
      { token: '\\d', label: '숫자 (Digit, [0-9])', example: '\\d{3} → "123"' },
      { token: '\\D', label: '숫자가 아닌 문자 ([^0-9])', example: '\\D+ → "abc "' },
      { token: '\\w', label: '단어 문자 (영문/숫자/한글/_)', example: '\\w+ → "user_01"' },
      { token: '\\W', label: '단어 문자가 아닌 것 (기호/공백)', example: '\\W → "@", " "' },
      { token: '\\s', label: '공백 문자 (스페이스, \\t, \\n)', example: '\\s+ → "   "' },
      { token: '\\S', label: '공백이 아닌 모든 문자', example: '\\S+ → "https://..."' },
      { token: '[abc]', label: 'a, b, c 중 한 글자', example: '[aeiou] → 모음 1개' },
      { token: '[^abc]', label: 'a, b, c를 제외한 한 글자 (부정)', example: '[^"] → 따옴표 아닌 문자' },
      { token: '[a-zA-Z0-9]', label: '범위 지정 (영문 대소문자 및 숫자)', example: '[0-9a-fA-F] → 16진수' }
    ]
  },
  {
    category: '수량자 (Quantifiers — Greedy vs Lazy)',
    items: [
      { token: '+', label: '1회 이상 반복 (탐욕적/최대)', example: '\\d+ → "12345"' },
      { token: '*', label: '0회 이상 반복 (탐욕적/최대)', example: 'a* → "", "aaa"' },
      { token: '?', label: '0회 또는 1회 (선택적 존재)', example: 'https? → "http", "https"' },
      { token: '{n}', label: '정확히 n회 반복', example: '\\d{4} → 연도 4자리' },
      { token: '{n,m}', label: 'n회 이상 ~ m회 이하 반복', example: '\\d{2,3} → 지역번호' },
      { token: '+?', label: '1회 이상 게으른(Lazy/최소) 반복', example: '<.+?> → 태그 1개만 매칭' },
      { token: '*?', label: '0회 이상 게으른(Lazy/최소) 반복', example: '".*?" → 따옴표 쌍 내부' }
    ]
  },
  {
    category: '앵커 및 경계 (Anchors & Boundaries)',
    items: [
      { token: '^', label: '문자열(또는 줄)의 시작', example: '^ERROR → 줄 맨 앞 ERROR' },
      { token: '$', label: '문자열(또는 줄)의 끝', example: '\\.py$ → .py로 끝남' },
      { token: '\\b', label: '단어 경계 (독립 단어 매칭)', example: '\\bcat\\b → "cat"만 매칭' },
      { token: '\\B', label: '단어 경계가 아닌 위치', example: '\\Bcat\\B → "scatter" 내 cat' },
      { token: '\\A', label: '[Python 전용] 문자열 절대 시작', example: 're.M과 무관하게 전체 맨 처음' },
      { token: '\\Z', label: '[Python 전용] 문자열 절대 끝', example: 're.M과 무관하게 전체 맨 끝' }
    ]
  },
  {
    category: '그룹 & Python 전용 문법 (Groups & Captures)',
    items: [
      { token: '(...)', label: '번호 캡처 그룹 (group(1), group(2))', example: '(\\d+)-(\\d+)' },
      { token: '(?P<name>...)', label: '[Python 핵심] 명명된 캡처 그룹', example: '(?P<yr>\\d{4}) → groupdict()' },
      { token: '(?:...)', label: '비캡처 그룹 (묶기만 하고 번호 생략)', example: '(?:http|https)://' },
      { token: 'A|B', label: '선택 연산자 (A 또는 B)', example: 'ERROR|WARN|FATAL' },
      { token: '\\1', label: '1번 캡처 그룹 역참조 (패턴/re.sub 공통)', example: '(\\w+) \\1 → 중복 단어' },
      { token: '(?P=name)', label: '[Python 전용] 명명된 그룹 패턴 내 역참조', example: '<(?P<t>\\w+)>.*?</(?P=t)>' },
      { token: '\\g<name>', label: '[Python re.sub] 명명/번호 그룹 치환 참조', example: 're.sub에서 \\g<yr>년, \\g<1>' }
    ]
  },
  {
    category: '전방 / 후방 탐색 (Lookaround — 소비 없음)',
    items: [
      { token: '(?=...)', label: '긍정 전방탐색 (오른쪽에 존재 확인)', example: '\\d+(?=원) → "원" 앞의 숫자만' },
      { token: '(?!...)', label: '부정 전방탐색 (오른쪽에 부재 확인)', example: '\\d+(?!원) → "원" 안 붙은 숫자' },
      { token: '(?<=...)', label: '긍정 후방탐색 (왼쪽에 존재 확인)', example: '(?<=\\$)\\d+ → "$" 뒤의 숫자만' },
      { token: '(?<!...)', label: '부정 후방탐색 (왼쪽에 부재 확인)', example: '(?<!\\$)\\d+ → "$" 안 붙은 숫자' }
    ]
  },
  {
    category: 'Python re 플래그 & 주요 함수',
    items: [
      { token: 're.I', label: 're.IGNORECASE — 대소문자 무시 매칭', example: '(?i) 인라인 플래그 동일' },
      { token: 're.M', label: 're.MULTILINE — ^, $가 각 줄의 시작/끝 매칭', example: '(?m) 다중 행 로그 처리 필수' },
      { token: 're.S', label: 're.DOTALL — 점(.)이 줄바꿈(\\n)까지 포함', example: '(?s) 여러 줄 HTML 태그 추출' },
      { token: 're.X', label: 're.VERBOSE — 공백 무시 및 # 주석 허용', example: '(?x) 복잡한 실무 정규식 문서화' }
    ]
  }
];
