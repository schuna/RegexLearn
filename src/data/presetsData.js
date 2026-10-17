/**
 * 실무 학습용 가상 예제 데이터 프리셋 (피드백 보고서 반영: 3대 핵심 실무 영역 + 알짜 시나리오)
 */

export const WORK_PRESETS = [
  // 카테고리 1: 시스템/서버 로그 데이터
  {
    id: 'log-was-error',
    category: '시스템/서버 로그 분석',
    badge: '로그 파싱',
    title: 'WAS/애플리케이션 에러 로그 구조화 추출',
    description: '타임스탬프, 로그 레벨([ERROR]/[WARN]), 클라이언트 IP, 에러 코드 및 메시지를 Python 명명된 그룹(?P<name>...)으로 한 번에 파싱합니다.',
    pattern: '\\[(?P<timestamp>\\d{4}-\\d{2}-\\d{2}\\s\\d{2}:\\d{2}:\\d{2})\\]\\s\\[(?P<level>ERROR|WARN)\\]\\s\\[(?P<ip>\\d{1,3}(?:\\.\\d{1,3}){3})\\]\\s\\((?P<code>E\\d{4})\\)\\s(?P<msg>.+)',
    replacement: '[\\g<level>] IP:\\g<ip> | 코드:\\g<code> | 내용:\\g<msg>',
    flags: { i: false, m: true, s: false, x: false },
    sampleText: `[2026-10-17 14:02:11] [INFO] [192.168.10.12] (I0001) User login succeeded: user=jiyong
[2026-10-17 14:03:45] [ERROR] [10.24.118.92] (E5002) Database connection timeout after 3000ms
[2026-10-17 14:05:09] [WARN] [172.16.0.204] (E4029) Memory usage exceeded 85% threshold
[2026-10-17 14:06:51] [ERROR] [192.168.10.88] (E5019) Unhandled NullPointerException in PaymentService`,
    tips: [
      '`INFO` 로그는 자동으로 건너뛰고 `ERROR`와 `WARN` 레벨만 선별하도록 `(?P<level>ERROR|WARN)`을 사용했습니다.',
      '`match.groupdict()`를 호출하면 곧바로 JSON/DB 적재가 가능한 딕셔너리가 생성됩니다.'
    ]
  },
  {
    id: 'log-nginx-access',
    category: '시스템/서버 로그 분석',
    badge: '웹 서버 로그',
    title: 'Nginx / Apache Access Log 상태코드 & 응답시간 추출',
    description: '표준 웹 액세스 로그에서 IP, HTTP 메서드, 요청 경로(URI), 상태 코드(4xx/5xx 등), 응답 시간(ms)을 추출합니다.',
    pattern: '^(?P<ip>\\S+)\\s-\\s-\\s\\[(?P<time>[^\\]]+)\\]\\s"(?P<method>GET|POST|PUT|DELETE)\\s(?P<uri>\\S+)\\sHTTP/[\\d.]+"\\s(?P<status>\\d{3})\\s(?P<bytes>\\d+)\\s"(?P<rt>[\\d.]+)s"',
    replacement: '\\g<status> | \\g<method> \\g<uri> (\\g<rt>s) from \\g<ip>',
    flags: { i: false, m: true, s: false, x: false },
    sampleText: `203.0.113.45 - - [17/Oct/2026:13:55:01 +0900] "GET /api/v2/users?page=1 HTTP/1.1" 200 4512 "0.042s"
198.51.100.19 - - [17/Oct/2026:13:55:04 +0900] "POST /api/v2/orders HTTP/1.1" 502 128 "2.510s"
192.0.2.88 - - [17/Oct/2026:13:55:10 +0900] "DELETE /api/v2/session HTTP/1.1" 401 64 "0.008s"`,
    tips: [
      '대괄호 내부 시간은 `\\[.*?\\]` 대신 부정 문자 클래스 `\\[(?P<time>[^\\]]+)\\]`를 사용하여 백트래킹 없이 고속 파싱합니다.'
    ]
  },
  {
    id: 'log-python-traceback',
    category: '시스템/서버 로그 분석',
    badge: '디버깅 로그',
    title: 'Python Traceback 에러 파일명 · 라인 번호 · 함수명 추출',
    description: '배치 스크립트나 서버 장애 로그에 남은 Python Traceback에서 실제 에러가 발생한 파일 경로, 줄 번호, 함수 이름을 캡처합니다.',
    pattern: 'File "(?P<file>[^"]+)", line (?P<line>\\d+), in (?P<func>\\w+)',
    replacement: '📄 \\g<file> (Line \\g<line>) -> \\g<func>()',
    flags: { i: false, m: true, s: false, x: false },
    sampleText: `Traceback (most recent call last):
  File "/app/services/pipeline.py", line 142, in run_batch
    records = parse_payload(raw_data)
  File "/app/utils/parser.py", line 87, in parse_payload
    raise ValueError("Invalid delimiter in row 42")
ValueError: Invalid delimiter in row 42`,
    tips: [
      '`File "[^"]+"` 패턴으로 파일 경로 안에 공백이나 특수기호가 있어도 안전하게 추출합니다.'
    ]
  },

  // 카테고리 2: 개인정보 및 보안 마스킹 (re.sub)
  {
    id: 'mask-phone-rrn',
    category: '개인정보 및 보안 마스킹',
    badge: '보안 마스킹',
    title: '주민등록번호 뒷자리 비식별화 마스킹 (re.sub)',
    description: '로그나 텍스트에 포함된 주민등록번호(성별코드 뒤 6자리)를 `******`로 안전하게 마스킹 처리합니다.',
    pattern: '(?P<birth>\\d{6})-(?P<gender>[1-4])\\d{6}',
    replacement: '\\g<birth>-\\g<gender>******',
    flags: { i: false, m: false, s: false, x: false },
    sampleText: `신청자1: 홍길동 (901225-1234567), 연락처: 010-2345-6789
신청자2: 이영희 (010512-4123987), 연락처: 010-8765-4321
관리번호: 880101-9999999 (성별코드 1~4 아님 - 제외됨)`,
    tips: [
      '성별코드 첫 자리는 `[1-4]`로 제한하여 일반 관리번호(`9999999`)가 잘못 마스킹되는 오탐을 방지했습니다.',
      '`re.sub` 시뮬레이터 탭에서 Before / After 결과를 바로 확인해 보세요!'
    ]
  },
  {
    id: 'mask-email-phone',
    category: '개인정보 및 보안 마스킹',
    badge: '보안 마스킹',
    title: '이메일 아이디 부분 마스킹 (앞 2글자만 유지)',
    description: '이메일 주소에서 아이디의 앞 2글자와 `@도메인`은 유지하고 나머지 아이디 문자열을 `***`로 비식별화합니다.',
    pattern: '\\b(?P<prefix>[a-zA-Z0-9._%+-]{2})[a-zA-Z0-9._%+-]+@(?P<domain>[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,})\\b',
    replacement: '\\g<prefix>***@\\g<domain>',
    flags: { i: false, m: false, s: false, x: false },
    sampleText: `담당자: jiyong.dev@company.co.kr
고객문의: support_team@service.io, vip_user99@naver.com`,
    tips: [
      '`(?P<prefix>...{2})`로 앞 두 글자만 캡처하고, 이어지는 아이디 문자는 캡처하지 않은 뒤 `@(?P<domain>...)`을 캡처해 `\\g<prefix>***@\\g<domain>`으로 치환합니다.'
    ]
  },

  // 카테고리 3: 텍스트 추출/정제 (HTML/CSV/코드)
  {
    id: 'extract-html-tags',
    category: '텍스트 추출 및 데이터 정제',
    badge: 'HTML/XML 추출',
    title: 'HTML/XML 태그 쌍 및 내부 데이터 안전 추출 (역참조 + Lazy)',
    description: '여는 태그 이름을 캡처(`(?P<tag>...)`)하고 닫는 태그에서 역참조(`(?P=tag)`)하여 짝이 맞는 태그와 내부 텍스트만 정확히 추출합니다.',
    pattern: '<(?P<tag>h[1-3]|span|p)(?:\\s[^>]*)?>(?P<content>.*?)</(?P=tag)>',
    replacement: '[\\g<tag>] \\g<content>',
    flags: { i: true, m: false, s: true, x: false },
    sampleText: `<div class="card">
  <h1>2026년 4분기 서버 점검 안내</h1>
  <p class="desc">점검 시간: 02:00 ~ 05:00</p>
  <span id="owner">인프라팀</span>
</div>`,
    tips: [
      '`(?P=tag)` 역참조를 통해 `<h1>`은 반드시 `</h1>`과 짝지어지도록 보장합니다.',
      '내부 콘텐츠는 게으른 수량자 `.*?`를 사용해 다음 동일 태그까지 과다 매칭되는 현상을 막았습니다.'
    ]
  },
  {
    id: 'extract-csv-quoted',
    category: '텍스트 추출 및 데이터 정제',
    badge: 'CSV/데이터 정제',
    title: '따옴표 내부 콤마(,)가 포함된 CSV 라인 정밀 파싱',
    description: '단순 `split(",")`으로는 깨지는 `"서울시 강남구, 테헤란로"`나 `"1,250,000"` 같은 따옴표 포함 CSV 필드를 개별 추출합니다.',
    pattern: '(?:^|,)(?:"(?P<quoted>[^"]*)"|(?P<unquoted>[^,\\n]*))',
    replacement: '[필드: \\g<quoted>\\g<unquoted>] ',
    flags: { i: false, m: true, s: false, x: false },
    sampleText: `1001,"김철수 (개발팀, 선임)","서울시 강남구, 역삼동","1,450,000",ACTIVE
1002,이영희,"부산시 해운대구, 우동","980,000",PENDING`,
    tips: [
      '따옴표로 감싸진 필드(`"[^"]*"`)와 일반 필드(`[^,\\n]*`)를 선택 연산자(`|`)로 분기하여 필드 내부의 콤마에 의해 쪼개지지 않게 처리합니다.'
    ]
  },
  {
    id: 'extract-Verbose-spec',
    category: '텍스트 추출 및 데이터 정제',
    badge: 're.X 주석 모드',
    title: '[re.X 활용] 설비/부품 시리얼 번호 규격 검증 및 파싱',
    description: 'Python `re.VERBOSE (re.X)` 모드를 사용하여 복잡한 사내 시리얼 번호 규칙에 줄 단위 주석을 달아 가독성과 유지보수성을 높인 예제입니다.',
    pattern: `^
(?P<plant>[A-Z]{2})      # 1. 공장 코드 (대문자 2자리: KR, US 등)
-
(?P<year>20\\d{2})       # 2. 생산 연도 (2000~2099)
(?P<month>0[1-9]|1[0-2]) # 3. 생산 월 (01~12)
-
(?P<lot>[A-Z0-9]{4})     # 4. LOT 번호 (영문/숫자 4자리)
$`,
    replacement: '공장:\\g<plant> | 생산년월:\\g<year>.\\g<month> | LOT:\\g<lot>',
    flags: { i: false, m: true, s: false, x: true },
    sampleText: `KR-202610-A901
US-202604-X12B
KR-202613-A901
JP-202512-99`,
    tips: [
      '`re.X` 플래그가 켜져 있어 정규식 내부의 줄바꿈과 `# 주석`이 모두 무시됩니다.',
      '세 번째 줄(`202613`)은 월(`0[1-9]|1[0-2]`) 조건에 어긋나고, 네 번째 줄(`99`)은 LOT 4자리 조건에 어긋나 자동 필터링됩니다.'
    ]
  }
];
