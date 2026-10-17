/**
 * 5단계 인터랙티브 정규표현식 커리큘럼 (Python `re` 특화, 총 16개 핵심 실습 강의)
 */

export const CURRICULUM_LEVELS = [
  {
    level: 1,
    title: 'Lv 1. 기초 다지기',
    subtitle: '메타문자, 이스케이프, 문자 클래스',
    badgeColor: 'from-emerald-500 to-teal-600',
    lessons: [
      {
        id: 'lv1-1',
        level: 1,
        step: '1-1',
        title: '와일드카드 점(.)과 리터럴 이스케이프(\.)',
        concept: '정규표현식에서 점(`.`)은 **줄바꿈을 제외한 모든 문자 1개**를 뜻하는 강력한 메타문자입니다. 만약 실제 마침표(`.`) 자체를 찾고 싶다면 앞에 백슬래시를 붙여 `\\.`으로 **이스케이프(Escape)** 해야 합니다.\n\n> 💡 **Python 실무 팁**: Python에서는 문자열 앞에 `r`을 붙이는 **Raw String(`r"..."`)**을 항상 사용하는 습관을 들이세요! 그렇지 않으면 Python 문자열 자체가 `\\`를 먼저 해석해 버립니다.',
        missionDesc: '파일 목록에서 확장자가 정확히 `.py`인 Python 소스 파일(`app.py`, `uti.py`, `v12.py`)만 매칭하고, 마침표가 아닌 `app_py`나 `appXpy`는 매칭되지 않도록 정규식을 작성하세요.',
        initialPattern: '...',
        initialFlags: { i: false, m: false, s: false, x: false },
        sampleText: 'app.py\nuti.py\nv12.py\napp_py\nappXpy',
        validation: {
          type: 'match',
          mustMatch: ['app.py', 'uti.py', 'v12.py'],
          mustNotMatch: ['app_py', 'appXpy']
        },
        hints: [
          '파일명 앞의 3글자는 어떤 문자든 올 수 있으므로 점 3개(`...`)를 사용할 수 있습니다.',
          '실제 마침표(.)를 매칭하려면 `.`이 아니라 `\\.`을 사용해야 `app_py`를 걸러낼 수 있습니다.'
        ],
        solution: '...\\.py',
        solutionExplanation: '`...`은 앞의 임의의 3글자를 매칭하고, `\\.py`는 실제 마침표와 `py`를 정확히 매칭합니다.'
      },
      {
        id: 'lv1-2',
        level: 1,
        step: '1-2',
        title: '핵심 단축 문자 클래스 (\\d, \\w, \\s)',
        concept: '자주 쓰는 문자 종류는 짧은 이스케이프 기호로 표현합니다.\n- `\\d` (Digit): 숫자 `[0-9]` (대문자 `\\D`는 숫자가 아닌 것)\n- `\\w` (Word): 영문자, 숫자, 한글, 언더스코어 `_` (대문자 `\\W`는 단어 문자가 아닌 기호/공백)\n- `\\s` (Space): 스페이스, 탭(`\\t`), 줄바꿈(`\\n`) 등 공백 (대문자 `\\S`는 공백이 아닌 것)',
        missionDesc: '설비 센서 코드 중에서 **`EMP_` 또는 `SEN_`처럼 단어문자 3개 + 언더스코어(`_`) + 숫자 2자리** 형식(`EMP_01`, `SEN_42`, `DEV_99`)만 매칭하세요.',
        initialPattern: '\\w\\w\\w_',
        initialFlags: { i: false, m: false, s: false, x: false },
        sampleText: 'EMP_01\nSEN_42\nDEV_99\nEMP_AB\n---_01',
        validation: {
          type: 'match',
          mustMatch: ['EMP_01', 'SEN_42', 'DEV_99'],
          mustNotMatch: ['EMP_AB', '---_01']
        },
        hints: [
          '앞의 3글자는 단어 문자(`\\w\\w\\w`), 이어서 `_`, 마지막 2글자는 숫자(`\\d\\d`)입니다.',
          '`\\w\\w\\w_\\d\\d`를 입력해 보세요.'
        ],
        solution: '\\w\\w\\w_\\d\\d',
        solutionExplanation: '`\\w` 3개로 앞 코드를, `_`로 구분자를, `\\d` 2개로 뒤의 2자리 숫자를 정확히 매칭하여 `EMP_AB`와 `---_01`을 제외합니다.'
      },
      {
        id: 'lv1-3',
        level: 1,
        step: '1-3',
        title: '대괄호 문자 집합 [...]과 부정 [^...]',
        concept: '`\\w`나 `\\d`보다 더 좁은 범위의 문자만 허용하고 싶을 때 대괄호 `[...]`를 씁니다.\n- `[abc]`: `a`, `b`, `c` 중 **한 글자**\n- `[A-Z0-9]`: 대문자 A~Z 또는 숫자 0~9 중 한 글자\n- `[^0-9]`: 대괄호 **맨 앞에 `^`**가 오면 **부정(Negation)**을 뜻합니다 (숫자가 아닌 문자 1개).',
        missionDesc: '로그 등급 중에서 `[WARN]`과 `[ERRO]`는 제외하고, 모음(`a, e, i, o, u`)이 아닌 **`v1`, `v2`, `v3` 버전 태그만** 매칭하고, `v0`, `v4`, `va`는 매칭하지 마세요.',
        initialPattern: 'v[0-9]',
        initialFlags: { i: false, m: false, s: false, x: false },
        sampleText: 'v1\nv2\nv3\nv0\nv4\nva',
        validation: {
          type: 'match',
          mustMatch: ['v1', 'v2', 'v3'],
          mustNotMatch: ['v0', 'v4', 'va']
        },
        hints: [
          '대괄호 안에 `1`부터 `3`까지의 범위만 지정하면 됩니다.',
          '`[1-3]` 또는 `[123]`을 사용해 보세요.'
        ],
        solution: 'v[1-3]',
        solutionExplanation: '`v[1-3]`은 첫 글자 `v` 뒤에 `1`, `2`, `3` 중 하나가 오는 경우만 정확히 매칭합니다.'
      }
    ]
  },
  {
    level: 2,
    title: 'Lv 2. 수량자와 앵커',
    subtitle: '반복 매칭, Greedy vs Lazy, 경계 지정',
    badgeColor: 'from-sky-500 to-indigo-600',
    lessons: [
      {
        id: 'lv2-1',
        level: 2,
        step: '2-1',
        title: '기본 수량자 (+, *, ?) 다루기',
        concept: '같은 문자 패턴을 여러 번 반복할 때 **수량자(Quantifier)**를 붙입니다.\n- `+` : **1회 이상** 반복 (최소 1개 필수)\n- `*` : **0회 이상** 반복 (없어도 되고 많아도 됨)\n- `?` : **0회 또는 1회** (있어도 그만, 없어도 그만인 옵션 기호)',
        missionDesc: '`http://` 또는 `https://`로 시작하는 도메인 주소(`http://api.dev`, `https:// regex.kr` 제외, `https://core.io`, `http://db.local`)를 모두 매칭하세요 (`s`는 있을 수도, 없을 수도 있습니다).',
        initialPattern: 'http://\\w+\\.\\w+',
        initialFlags: { i: false, m: false, s: false, x: false },
        sampleText: 'http://api.dev\nhttps://core.io\nhttp://db.local\nftp://files.net\nhttps://.io',
        validation: {
          type: 'match',
          mustMatch: ['http://api.dev', 'https://core.io', 'http://db.local'],
          mustNotMatch: ['ftp://files.net', 'https://.io']
        },
        hints: [
          '`http` 뒤의 `s`는 0개 또는 1개이므로 `s?`로 표현할 수 있습니다.',
          '도메인 이름과 확장자는 최소 1글자 이상이어야 하므로 `\\w+`를 사용합니다.'
        ],
        solution: 'https?://\\w+\\.\\w+',
        solutionExplanation: '`s?`로 `http`와 `https`를 동시에 처리하고, `\\w+\\.\\w+`로 1글자 이상인 호스트명과 도메인 확장자를 매칭합니다.'
      },
      {
        id: 'lv2-2',
        level: 2,
        step: '2-2',
        title: '정밀 수량자 {n}, {n,m}으로 자릿수 통제하기',
        concept: '`+`는 1글자부터 100글자까지 모두 매칭합니다. 실무 데이터(날짜, 전화번호, 사번, 우편번호)에서는 **정확한 자릿수**를 지정해야 오탐을 막을 수 있습니다.\n- `{4}`: 정확히 4회 반복\n- `{2,4}`: 2회 이상 ~ 4회 이하 반복\n- `{3,}`: 최소 3회 이상 반복',
        missionDesc: '정상적인 전화번호 형식(`010-1234-5678`, `02-987-6543`, `031-1234-0000`)만 매칭하고, 자릿수가 잘못된 `010-12-5678`이나 `0101-1234-5678`은 제외하세요.',
        initialPattern: '^\\d+-\\d+-\\d+$',
        initialFlags: { i: false, m: true, s: false, x: false },
        sampleText: '010-1234-5678\n02-987-6543\n031-1234-0000\n010-12-5678\n0101-1234-5678',
        validation: {
          type: 'match',
          mustMatch: ['010-1234-5678', '02-987-6543', '031-1234-0000'],
          mustNotMatch: ['010-12-5678', '0101-1234-5678']
        },
        hints: [
          '지역번호/식별번호는 2~3자리(`\\d{2,3}`), 가운데 번호는 3~4자리(`\\d{3,4}`), 끝 번호는 정확히 4자리(`\\d{4}`)입니다.',
          '줄의 시작(`^`)과 끝(`$`) 앵커를 유지한 채로 각 `\\d+`를 `{n,m}`으로 바꿔보세요.'
        ],
        solution: '^\\d{2,3}-\\d{3,4}-\\d{4}$',
        solutionExplanation: '`\\d{2,3}`(2~3자리), `\\d{3,4}`(3~4자리), `\\d{4}`(4자리)와 `^`, `$` 경계를 결합해 비정상 자릿수를 완벽히 차단합니다.'
      },
      {
        id: 'lv2-3',
        level: 2,
        step: '2-3',
        title: '[핵심] 탐욕적(Greedy) vs 게으른(Lazy *?, +?) 매칭',
        concept: '실무에서 가장 많이 겪는 실수가 바로 `.*` 또는 `.+`의 **탐욕적(Greedy) 매칭**입니다.\n- `<b>.+</b>`를 `<b>공지</b> 및 <b>안내</b>`에 적용하면, 첫 `<b>`부터 **맨 마지막 `</b>`까지 통째로 1개로** 묶어버립니다!\n- 수량자 뒤에 `?`를 붙여 **`+?` 또는 `*?` (게으른/Lazy 수량자)**로 만들면, **가장 먼저 만나는 닫는 태그에서 즉시 멈춥니다.**',
        missionDesc: '아래 HTML 문장에서 전체 문장이 한 덩어리로 묶이지 않고, **`<b>공지사항</b>`과 `<b>시스템점검</b>` 두 개의 태그가 각각 따로 매칭**되도록 게으른 수량자(`+?` 또는 `*?`)를 사용해 수정하세요.',
        initialPattern: '<b>.+</b>',
        initialFlags: { i: false, m: false, s: false, x: false },
        sampleText: '안내: <b>공지사항</b> 및 <b>시스템점검</b> 일정',
        validation: {
          type: 'exactMatches',
          expectedMatches: ['<b>공지사항</b>', '<b>시스템점검</b>']
        },
        hints: [
          '현재 `<b>.+</b>`는 탐욕적(Greedy)이라 두 태그와 그 사이의 ` 및 `까지 한 번에 삼켜버립니다.',
          '`.+` 뒤에 `?`를 붙여 `.+?`로 바꾸거나 `[^<]+`를 사용해 보세요!'
        ],
        solution: '<b>.+?</b>',
        solutionExplanation: '`.+?`는 최소 매칭(Lazy)을 수행하여 첫 번째 `</b>`를 만나는 순간 매칭을 완료하므로 두 개의 `<b>...</b>` 태그를 개별 추출합니다.'
      },
      {
        id: 'lv2-4',
        level: 2,
        step: '2-4',
        title: '단어 경계(\\b)로 부분 일치 오탐 막기',
        concept: '단순히 `cat`을 검색하면 `category`, `scatter`, `tomcat` 안에 들어있는 `cat`까지 모두 찾아버립니다.\n- `\\b` (Word Boundary): 단어 문자(`\\w`)와 비단어 문자 사이의 **경계 위치**를 의미합니다.\n- `\\bcat\\b`라고 쓰면 오직 독립된 단어 `cat`만 정확히 찾아냅니다.',
        missionDesc: '로그 메시지에서 `ERROR_CODE`나 `MY_ERROR` 내부의 글자는 건드리지 않고, **독립된 단어 `ERROR`만** 정확히 매칭하세요.',
        initialPattern: 'ERROR',
        initialFlags: { i: false, m: false, s: false, x: false },
        sampleText: 'CRITICAL ERROR occurred in module (ERROR_CODE: 500, MY_ERROR_FLAG)',
        validation: {
          type: 'exactMatches',
          expectedMatches: ['ERROR']
        },
        hints: [
          '`ERROR_CODE`에서는 `_`도 단어 문자(`\\w`)이기 때문에 `ERROR`와 `_` 사이는 단어 경계(`\\b`)가 아닙니다!',
          '`ERROR` 앞뒤를 `\\b`로 감싸보세요.'
        ],
        solution: '\\bERROR\\b',
        solutionExplanation: '`\\bERROR\\b`는 앞뒤가 공백이나 구두점 등으로 분리된 독립 단어 `ERROR` 1건만 정확히 찾아냅니다.'
      }
    ]
  },
  {
    level: 3,
    title: 'Lv 3. 그룹과 캡처 (실무 핵심)',
    subtitle: '부분 추출, 비캡처 그룹, Python (?P<name>...), 역참조',
    badgeColor: 'from-indigo-500 to-purple-600',
    lessons: [
      {
        id: 'lv3-1',
        level: 3,
        step: '3-1',
        title: '캡처 그룹 (...)으로 알맹이만 추출하기',
        concept: '소괄호 `(...)`는 두 가지 역할을 합니다.\n1. 여러 문자를 하나의 덩어리로 묶어 수량자(`+`, `?`)나 `|`를 적용합니다.\n2. **매칭된 전체 텍스트 중에서 괄호 안의 알맹이만 따로 뽑아냅니다(`match.group(1)`, `match.groups()`).**',
        missionDesc: '로그의 `user_id=kim_dev`, `user_id=lee99` 항목을 매칭하면서, **`=` 뒤의 실제 아이디 값(`kim_dev`, `lee99`)만 1번 캡처 그룹(`Group #1`)으로 추출**하세요.',
        initialPattern: 'user_id=\\w+',
        initialFlags: { i: false, m: false, s: false, x: false },
        sampleText: '[LOGIN] user_id=kim_dev status=ok\n[LOGIN] user_id=lee99 status=ok',
        validation: {
          type: 'capture',
          expectedGroup1: ['kim_dev', 'lee99']
        },
        hints: [
          '전체 매칭은 `user_id=\\w+`를 유지하되, 추출하고 싶은 `\\w+` 부분만 소괄호 `(...)`로 감싸주면 됩니다.'
        ],
        solution: 'user_id=(\\w+)',
        solutionExplanation: '`user_id=(\\w+)`를 사용하면 전체 매칭(`group(0)`)은 `user_id=kim_dev`가 되고, 1번 그룹(`group(1)`)에는 순수 아이디 `kim_dev`만 깔끔하게 담깁니다!'
      },
      {
        id: 'lv3-2',
        level: 3,
        step: '3-2',
        title: '비캡처 그룹 (?:...)과 선택 연산자(|)',
        concept: '`http` 또는 `https`처럼 선택지(`|`)를 묶으려고 `(http|https)`라고 쓰면, 원치 않게 1번 캡처 그룹 번호를 차지해 버립니다.\n- **`(?:패턴)` (비캡처 그룹)**: 괄호로 묶어 그룹 연산은 수행하되, **캡처 그룹 목록(`groups()`)에는 포함하지 않을 때** 사용합니다.',
        missionDesc: '`ID: 1024` 또는 `NO: 2048` 형식의 문자열에서 앞의 접두사는 **비캡처 그룹 `(?:ID|NO)`**으로 묶고, 뒤의 **숫자(`1024`, `2048`)만 1번 캡처 그룹(`Group #1`)**이 되도록 작성하세요.',
        initialPattern: '(ID|NO): (\\d+)',
        initialFlags: { i: false, m: false, s: false, x: false },
        sampleText: 'Item ID: 1024, Serial NO: 2048, TAG: 9999',
        validation: {
          type: 'capture',
          expectedGroup1: ['1024', '2048']
        },
        hints: [
          '현재 `(ID|NO)`가 1번 그룹을 차지하고 있어서 숫자가 2번 그룹으로 밀려나 있습니다.',
          '앞 괄호를 `(?:ID|NO)`로 바꾸면 숫자가 `Group #1`이 됩니다!'
        ],
        solution: '(?:ID|NO): (\\d+)',
        solutionExplanation: '`(?:ID|NO)`는 그룹 번호를 소비하지 않으므로, 정말로 필요한 `(\\d+)`가 깔끔하게 1번 캡처 그룹(`match.group(1)`)이 됩니다.'
      },
      {
        id: 'lv3-3',
        level: 3,
        step: '3-3',
        title: '[Python 꽃] 명명된 캡처 그룹 (?P<name>...)',
        concept: '괄호가 5개, 10개로 늘어나면 `match.group(3)`이 무엇을 의미하는지 헷갈리고 유지보수가 힘들어집니다.\n- Python `re` 모듈은 **`(?P<이름>패턴)`** 문법으로 그룹에 이름을 붙일 수 있습니다!\n- 추출 결과를 **`match.groupdict()`** 로 호출하면 `{"year": "2026", "month": "10"}` 형태의 **Python 딕셔너리(dict)** 로 바로 얻을 수 있어 실무 생산성이 극대화됩니다.',
        missionDesc: '날짜 `2026-10-17`에서 연도 4자리를 **`year`**, 월 2자리를 **`month`**, 일 2자리를 **`day`**라는 이름의 Python 명명된 그룹(`(?P<name>...)`)으로 각각 캡처하세요.',
        initialPattern: '(?P<year>\\d{4})-(\\d{2})-(\\d{2})',
        initialFlags: { i: false, m: false, s: false, x: false },
        sampleText: '배포일: 2026-10-17, 마감일: 2026-12-31',
        validation: {
          type: 'namedCapture',
          expectedGroupDict: {
            year: '2026',
            month: '10',
            day: '17'
          }
        },
        hints: [
          'Python 명명된 그룹 문법은 대문자 `P`를 포함한 `(?P<이름>패턴)` 입니다.',
          '두 번째와 세 번째 괄호도 `(?P<month>\\d{2})`와 `(?P<day>\\d{2})`로 작성해 보세요.'
        ],
        solution: '(?P<year>\\d{4})-(?P<month>\\d{2})-(?P<day>\\d{2})',
        solutionExplanation: '우측 매칭 결과 테이블의 `groupdict()`를 확인해 보세요! 인덱스가 바뀌어도 이름으로 안전하게 참조할 수 있습니다.'
      },
      {
        id: 'lv3-4',
        level: 3,
        step: '3-4',
        title: '역참조 (\\1 및 (?P=name))로 중복/짝꿍 찾기',
        concept: '앞서 캡처 그룹에서 매칭된 **실제 텍스트와 똑같은 텍스트**가 뒤에 또 나오는지 확인할 때 **역참조(Backreference)**를 씁니다.\n- `\\1`: 1번 캡처 그룹이 방금 찾은 문자열과 동일한 문자열\n- `(?P=name)`: Python 명명된 그룹 `name`이 찾은 문자열과 동일한 문자열',
        missionDesc: '문서 교정 중 실수로 **같은 단어가 공백을 사이에 두고 연속 두 번 반복된 구간**(`the the`, `is is`, `data data`)만 찾아내세요 (`the cat`이나 `is good`은 매칭되면 안 됩니다).',
        initialPattern: '\\b(\\w+)\\s+\\w+\\b',
        initialFlags: { i: false, m: false, s: false, x: false },
        sampleText: 'This is is a test of the the system and data data pipeline.',
        validation: {
          type: 'exactMatches',
          expectedMatches: ['is is', 'the the', 'data data']
        },
        hints: [
          '첫 번째 단어를 `(\\w+)`로 캡처했다면, 공백 `\\s+` 뒤에 오는 두 번째 단어 자리에 `\\1`을 넣으면 첫 단어와 똑같은 단어만 매칭됩니다!'
        ],
        solution: '\\b(\\w+)\\s+\\1\\b',
        solutionExplanation: '`(\\w+)`가 캡처한 단어를 `\\1`로 그대로 재참조하여, 연속 중복된 단어 쌍만 귀신같이 찾아냅니다.'
      }
    ]
  },
  {
    level: 4,
    title: 'Lv 4. 전방/후방 탐색 (Lookaround)',
    subtitle: '문자 소비 없이 앞/뒤 조건만 확인하여 원하는 값만 쏙 뽑기',
    badgeColor: 'from-rose-500 to-orange-600',
    lessons: [
      {
        id: 'lv4-1',
        level: 4,
        step: '4-1',
        title: '긍정 전방탐색 (?=...) — 단위 앞의 숫자만 추출하기',
        concept: '`1500원`에서 `원`이 붙은 숫자만 찾되, 매칭 결과에는 `원`을 빼고 **`1500`만 깔끔하게 얻고 싶을 때** 전방탐색을 씁니다.\n- **`(?=패턴)` (긍정 전방탐색)**: 내 바로 오른쪽(앞날)에 `패턴`이 있는지 **조건만 확인**하고, 실제로는 그 문자를 삼키지(소비하지) 않습니다!',
        missionDesc: '문장에서 일반 숫자(`3개`, `10시`)는 무시하고, **뒤에 `원`이 붙어 있는 금액 숫자(`15000`, `4500`)만 단위(`원`) 없이 숫자만** 매칭하세요.',
        initialPattern: '\\d+원',
        initialFlags: { i: false, m: false, s: false, x: false },
        sampleText: '사과 3개 가격은 15000원이며 배송비 4500원이 10시에 결제됨',
        validation: {
          type: 'exactMatches',
          expectedMatches: ['15000', '4500']
        },
        hints: [
          '`\\d+원`으로 쓰면 매칭 결과에 `원` 글자까지 포함됩니다.',
          '`원`을 긍정 전방탐색 기호 `(?=원)`으로 감싸보세요!'
        ],
        solution: '\\d+(?=원)',
        solutionExplanation: '`(?=원)`은 뒤에 `원`이 오는지 확인만 하고 소비하지 않으므로, `re.findall()` 실행 시 `[\'15000\', \'4500\']`처럼 순수 숫자만 바로 얻을 수 있습니다.'
      },
      {
        id: 'lv4-2',
        level: 4,
        step: '4-2',
        title: '긍정 후방탐색 (?<=...) — 접두사 뒤의 값만 추출하기',
        concept: '전방탐색의 반대 방향입니다.\n- **`(?<=패턴)` (긍정 후방탐색)**: 내 바로 **왼쪽(과거/앞쪽)**에 `패턴`이 있는지만 확인하고, 매칭 결과에는 포함하지 않습니다.\n- 예: `(?<=\\$)\\d+`는 `$100`에서 `$`는 빼고 `100`만 매칭합니다.',
        missionDesc: '서버 설정 텍스트에서 `PORT=` 또는 `TIMEOUT=` 같은 다른 숫자는 빼고, 오직 **`PRICE=$` 바로 뒤에 오는 숫자(`250`, `99`)만** 기호 없이 매칭하세요.',
        initialPattern: 'PRICE=\\$\\d+',
        initialFlags: { i: false, m: false, s: false, x: false },
        sampleText: 'PORT=8080, PRICE=$250, TIMEOUT=30, SPECIAL_PRICE=$99',
        validation: {
          type: 'exactMatches',
          expectedMatches: ['250', '99']
        },
        hints: [
          '앞에 와야 하는 조건인 `PRICE=\\$`를 긍정 후방탐색 `(?<=...)` 안에 넣어보세요.',
          '`(?<=PRICE=\\$)\\d+` 형식으로 작성하면 됩니다.'
        ],
        solution: '(?<=PRICE=\\$)\\d+',
        solutionExplanation: '`(?<=PRICE=\\$)`가 앞의 접두사를 검사만 하고 소비하지 않아, 뒤따르는 숫자 `250`, `99`만 정확히 매칭됩니다.'
      },
      {
        id: 'lv4-3',
        level: 4,
        step: '4-3',
        title: '부정 탐색 (?!...) & (?<!...) — 특정 조건 제외하기',
        concept: '특정 패턴이 **오지 않는 경우**만 찾고 싶을 때 부정 탐색을 사용합니다.\n- **`(?!패턴)` (부정 전방탐색)**: 오른쪽에 해당 패턴이 **없어야** 매칭 성공\n- **`(?<!패턴)` (부정 후방탐색)**: 왼쪽에 해당 패턴이 **없어야** 매칭 성공',
        missionDesc: '파일 목록(`report.pdf`, `summary.xlsx`, `backup.bak`, `temp.bak`)에서 **`.bak` 확장자가 아닌 파일의 이름 부분(`report`, `summary`)만** 매칭하세요 (점`.` 직전에 위치하며, 뒤에 `.bak`이 오지 않는 단어).',
        initialPattern: '\\w+(?=\\.\\w+)',
        initialFlags: { i: false, m: false, s: false, x: false },
        sampleText: 'report.pdf\nsummary.xlsx\nbackup.bak\ntemp.bak',
        validation: {
          type: 'exactMatches',
          expectedMatches: ['report', 'summary']
        },
        hints: [
          '파일명 단어(`\\b\\w+\\b`) 뒤에 `.bak`이 오지 않는다는 조건 `(?!\\.bak)`과, 확장자 점(`(?=\\.)`)이 온다는 조건을 함께 사용할 수 있습니다.',
          '또는 `\\b\\w+(?=\\.(?!bak)\\w+)` 형태로 작성해 보세요!'
        ],
        solution: '\\b\\w+(?=\\.(?!bak)\\w+)',
        solutionExplanation: '점(`.`) 뒤에 `bak`이 오지 않는(`(?!bak)`) 확장자를 가진 파일의 이름만 전방탐색으로 깔끔하게 골라냅니다.'
      }
    ]
  },
  {
    level: 5,
    title: 'Lv 5. 실무 마스터 & 성능 최적화',
    subtitle: 're.sub 치환, re.X 주석 모드, 백트래킹(Backtracking) 방지',
    badgeColor: 'from-amber-500 to-red-600',
    lessons: [
      {
        id: 'lv5-1',
        level: 5,
        step: '5-1',
        title: 're.sub 역참조 치환 (\\1, \\g<name>)으로 개인정보 마스킹',
        concept: 'Python의 `re.sub(패턴, 치환문자열, 원본)`는 캡처한 그룹을 그대로 재조립할 수 있습니다.\n- 번호 그룹 참조: `\\1`, `\\2` 또는 숫자와 이어질 때 안전한 **`\\g<1>`**\n- 명명된 그룹 참조: **`\\g<이름>`**\n\n이 기능을 쓰면 전화번호나 주민번호의 일부만 `****`로 가리는 마스킹 작업을 단 한 줄로 처리할 수 있습니다!',
        missionDesc: '휴대폰 번호 `010-1234-5678`과 `010-9876-5432`에서 가운데 번호만 `****`로 가려 **`010-****-5678`** 형태가 되도록 정규식과 **치환 문자열(Replacement)**을 완성하세요.',
        initialPattern: '(\\d{3})-\\d{4}-(\\d{4})',
        initialReplacement: '\\1-****-\\2',
        initialFlags: { i: false, m: false, s: false, x: false },
        sampleText: '고객A: 010-1234-5678 / 고객B: 010-9876-5432',
        validation: {
          type: 'sub',
          expectedSubResult: '고객A: 010-****-5678 / 고객B: 010-****-5432'
        },
        hints: [
          '앞의 3자리를 1번 그룹 `(\\d{3})`, 뒤의 4자리를 2번 그룹 `(\\d{4})`으로 캡처합니다.',
          '치환 문자열(Replacement) 입력창에 `\\1-****-\\2` 또는 `\\g<1>-****-\\g<2>`를 입력하세요.'
        ],
        solution: '(\\d{3})-\\d{4}-(\\d{4})',
        solutionReplacement: '\\1-****-\\2',
        solutionExplanation: '보존할 앞/뒤 번호만 캡처 그룹으로 묶고, 마스킹할 가운데 번호는 괄호 밖에 두어 `\\1-****-\\2`로 감쪽같이 치환합니다.'
      },
      {
        id: 'lv5-2',
        level: 5,
        step: '5-2',
        title: 're.X (VERBOSE) 모드와 백트래킹(Backtracking) 성능 최적화',
        concept: '### 1️⃣ `re.X` (`re.VERBOSE`) 주석 모드\n실무 정규식이 길어지면 암호처럼 읽기가 불가능해집니다. `re.X` 플래그를 켜면 **정규식 안의 공백과 줄바꿈이 무시**되고 **`# 주석`**을 자유롭게 달 수 있습니다!\n\n### 2️⃣ 백트래킹(Catastrophic Backtracking) 주의사항과 최적화\n- **위험 패턴**: `(a+)+`나 `(\\w+)*`처럼 **수량자가 중첩**되거나, 따옴표 추출 시 `".*"`처럼 탐욕적 와일드카드를 남발하면 엔진이 수만 번 되돌아가는 **백트래킹 폭발**이 발생합니다.\n- **최적화 정석**: `"[^"]*"` 또는 `<[^>]+>`처럼 **닫는 기호를 제외한 부정 문자 클래스(`[^...]`)**를 쓰면 백트래킹이 **0회**로 줄어들어 속도와 정확도가 비약적으로 향상됩니다!',
        missionDesc: '`re.X` 플래그가 켜진 상태에서, 큰따옴표(`"..."`)로 감싸진 문자열 값들을 백트래킹 없이 가장 빠르고 안전하게 추출하는 **`"[^"]+"`** 패턴(주석 포함 가능)으로 완성하세요.',
        initialPattern: '# 큰따옴표 내부 문자열 안전 추출\n"[^"]+"',
        initialFlags: { i: false, m: false, s: false, x: true },
        sampleText: 'config = {"host": "192.168.0.1", "env": "production"}',
        validation: {
          type: 'exactMatches',
          expectedMatches: ['"host"', '"192.168.0.1"', '"env"', '"production"']
        },
        hints: [
          '`re.X` 모드가 활성화되어 있으므로 `# 주석`은 무시되고 `"[^"]+"`가 실행됩니다.',
          '`"[^"]+"`는 여는 따옴표 뒤에서 닫는 따옴표가 아닌 문자(`[^"]`)만 1개 이상 매칭하므로 백트래킹 없이 즉시 매칭됩니다.'
        ],
        solution: '# 큰따옴표 내부 문자열 안전 추출\n"[^"]+"',
        solutionExplanation: '`".*?"`보다 `"[^"]+"`가 백트래킹 측면에서 훨씬 효율적이며, 줄바꿈을 넘어 과다 매칭되는 사고도 예방해 줍니다.'
      }
    ]
  }
];
