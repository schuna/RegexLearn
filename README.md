# PyRegex Studio — Python `re` 정규표현식 시각적 학습 & 실습 웹 앱

**PyRegex Studio**는 업무에서 사용하는 **Python (`re` 모듈)** 정규표현식 활용 능력을 기초부터 고급(그룹 캡처, 명명된 그룹, 전방/후방 탐색, 치환 및 백트래킹 성능 최적화)까지 체계적으로 향상시키기 위해 제작된 인터랙티브 학습 및 실습 웹 애플리케이션입니다.

---

## ✨ 주요 기능 (Key Features)

### 1. 🔍 시각적 패턴 분석기 (Visual Pattern Analyzer)
* **토큰 분해 & 컬러 코딩**: 입력한 정규식을 앵커/경계(`^`, `\b`), 문자 집합(`[...]`), 메타/이스케이프(`\d`, `\w`), 수량자(`+`, `*?`), 그룹(`(...)`, `(?P<name>...)`), 전방/후방 탐색(`(?=...)`) 단위로 색상을 구분해 표시합니다.
* **블록 흐름도 (Railroad View)**: 정규식이 왼쪽(`START`)에서 오른쪽(`MATCH`)으로 어떻게 평가되는지, 선택 분기(`|`)와 반복 루프, 문자 소비 없는 탐색 구간을 시각적인 블록 다이어그램으로 보여줍니다.
* **한국어 자연어 해설 트리**: 중첩된 그룹과 수량자 조건을 계층 구조의 한국어 설명으로 풀어줍니다.
* **백트래킹(Catastrophic Backtracking) 위험 진단**: 중첩된 수량자(`(a+)+`)나 구분자 내부의 탐욕적 와일드카드(`.*`) 사용을 감지하고 최적화 방향을 안내합니다.

### 2. 🧪 실시간 플레이그라운드 (Python `re` Playground)
* **Python 고유 문법 완벽 호환**:
  * 명명된 캡처 그룹 `(?P<name>...)` 및 패턴 내 역참조 `(?P=name)`
  * `re.sub` 전용 치환 문법 `\g<name>`, `\g<0>`, `\g<1>`, `\1` ~ `\99`
  * 플래그 토글 지원: `re.I` (`IGNORECASE`), `re.M` (`MULTILINE`), `re.S` (`DOTALL`), `re.X` (`VERBOSE` 주석 모드)
* **실시간 매칭 하이라이트 & 상세 테이블**: 테스트 문자열 내 매칭 위치를 실시간 하이라이트하고, 각 매칭 건별 `match.group(0)`, `match.groups()`, `match.groupdict()`, `match.span()` 결과를 표 형태로 제공합니다.
* **`re.sub` 치환 시뮬레이터**: 캡처 그룹 빠른 삽입 버튼과 함께 치환 전/후 결과를 실시간으로 비교합니다.
* **Python 코드 스니펫 원클릭 생성**: 현재 작성한 정규식과 플래그를 기반으로 실무에 바로 붙여넣을 수 있는 `re.finditer()`, `re.findall()`, `re.search()`, `re.sub()` Python 코드를 자동 생성합니다.

### 3. 🎓 5단계 인터랙티브 커리큘럼 (Lv 1 ~ Lv 5)
각 단계별 개념 설명과 함께 **실시간 자동 채점 미션**, **단계별 힌트**, **정답 비교** 기능을 제공합니다.
* **Lv 1. 기초 다지기**: 와일드카드(`.`)와 리터럴 이스케이프(`\.`), 단축 문자 클래스(`\d`, `\w`, `\s`), 대괄호 문자 집합(`[...]`, `[^...]`)
* **Lv 2. 수량자와 앵커**: 기본 수량자(`+`, `*`, `?`), 정밀 수량자(`{n,m}`), **탐욕적(Greedy) vs 게으른(Lazy `*?`, `+?`) 매칭**, 단어 경계(`\b`)
* **Lv 3. 그룹과 캡처 (실무 핵심)**: 번호 캡처 그룹(`(...)`), 비캡처 그룹(`(?:...)`), **Python 명명된 그룹(`(?P<name>...)`)**, 역참조(`\1`, `(?P=name)`)
* **Lv 4. 전방/후방 탐색 (Lookaround)**: 긍정 전방탐색(`(?=...)`), 긍정 후방탐색(`(?<=...)`), 부정 탐색(`(?!...)`, `(?<!...)`)
* **Lv 5. 실무 마스터 & 성능 최적화**: `re.sub` 역참조 개인정보 마스킹, `re.X` (`VERBOSE`) 주석 모드, 백트래킹 방지 최적화

### 4. 💼 실무 예제 프리셋 & 📖 인터랙티브 치트시트 & ⭐ 내 북마크
* **시스템/서버 로그 분석**: WAS 에러 로그 구조화 파싱, Nginx Access Log 상태코드/응답시간 추출, Python Traceback 에러 위치 추출
* **개인정보 및 보안 마스킹**: 주민등록번호 뒷자리 비식별화, 이메일 아이디 부분 마스킹
* **텍스트 추출 및 데이터 정제**: HTML 짝꿍 태그 추출, 따옴표 내부 콤마가 포함된 CSV 파싱, `re.X` 기반 시리얼 번호 규격 검증
* **나만의 북마크 & 치트시트**: 자주 쓰는 업무용 정규식을 브라우저(`localStorage`)에 저장해 두고 언제든 불러오거나 치트시트에서 토큰을 클릭해 즉시 삽입할 수 있습니다.

---

## 🛠️ 기술 스택 (Tech Stack)

* **Frontend**: React 18, Vite
* **Styling**: Tailwind CSS, Lucide Icons
* **Engine**: Custom Python `re` Transpiler & Regex AST Parser (`src/engine/`)

---

## 🚀 설치 및 실행 방법 (Getting Started)

### 1. 의존성 패키지 설치
```bash
npm install
```

### 2. 로컬 개발 서버 실행
```bash
npm run dev
```
* 실행 후 브라우저에서 `http://localhost:5188` 접속

### 3. 프로덕션 빌드
```bash
npm run build
```

---

## 📂 프로젝트 디렉토리 구조

```text
RegexLearn/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── src/
    ├── App.jsx                         # 3-영역 통합 대시보드 레이아웃
    ├── main.jsx
    ├── index.css
    ├── engine/
    │   ├── pythonRegexEngine.js        # Python re 문법 변환, 실행, re.sub, 백트래킹 진단, 코드 생성
    │   └── regexAstParser.js           # 정규식 토크나이저 및 계층형 AST 파서
    ├── components/
    │   ├── VisualPatternAnalyzer.jsx   # 토큰 컬러링, 블록 흐름도(Railroad), 한국어 해설 트리
    │   ├── PlaygroundPanel.jsx         # 정규식 에디터, 하이라이터, groupdict 테이블, re.sub 시뮬레이터
    │   ├── CurriculumSidebar.jsx       # Lv 1~5 커리큘럼 가이드 및 실시간 미션 채점기
    │   ├── PresetsSidebar.jsx          # 실무 예제 프리셋 로더
    │   ├── BookmarksSidebar.jsx        # 개인 정규식 스니펫 북마크 관리
    │   └── CheatsheetModal.jsx         # Python re 인터랙티브 치트시트
    └── data/
        ├── curriculumData.js           # 5단계 커리큘럼 및 실습 미션 데이터
        ├── presetsData.js              # 실무 가상 데이터 프리셋
        └── cheatsheetData.js           # 치트시트 항목 데이터
```
