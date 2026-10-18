# PyRegex Studio v2.0 — Python `re` 정규표현식 시각적 학습 & 실습 웹 앱

**PyRegex Studio v2.0**은 업무에서 사용하는 **Python (`re` 모듈)** 정규표현식 활용 능력을 기초부터 고급(그룹 캡처, 명명된 그룹, 전방/후방 탐색, 치환 및 백트래킹 성능 최적화)까지 체계적으로 향상시키기 위해 제작된 인터랙티브 학습 및 실습 웹 애플리케이션입니다.

> 🚀 **v2.0 메이저 업그레이드 (`Learn Git Branching` 벤치마킹 반영)**
> * 🔥 **Step-by-Step 매칭 트레이서 (애니메이션 디버거)**: 정규식 토큰 포인터와 텍스트 탐색 커서, Zero-width(`|`) 포인터, 백트래킹(되감기) 과정을 스텝 단위로 추적
> * 🎬 **인터랙티브 개념 시연 위젯**: 레슨별 흔한 실수(`Before`) vs 정석 패턴(`After`)의 엔진 동작을 미니 애니메이션 플레이어로 비교 시연
> * 🎯 **시각적 목표(Goal) Diff 대조 뷰**: 목표 매칭 구간(초록 점선)과 내 현재 매칭 구간(배경 하이라이트)을 이중 레이어로 대조하고 과다 매칭(`Over-matching`) / 부분 매칭(`Under-matching`) / 오탐(`Mismatch`) 자동 진단
> * 🗺️ **시각적 스테이지 월드맵 & 마스터 별점(`★`) 시스템**: 권장 패턴 길이(`Par`) 및 탐색 스텝 수 기준을 만족하면 마스터 별점(`★`) 부여 및 완성된 Python 코드 원클릭 복사 지원

---

## ✨ 주요 기능 (Key Features)

### 1. 🔬 Step-by-Step 매칭 트레이서 & 시각적 패턴 분석기
* **Step-by-Step 매칭 트레이서 ([StepByStepTracer.jsx](src/components/StepByStepTracer.jsx))**:
  * 제너레이터(`function*`) 기반 AST 추적 엔진으로 `[⏮ 처음] [◀ 이전] [▶ 재생/일시정지] [다음 ▶] [끝 ⏭]` 및 `O(1)` 슬라이더, 재생 속도(`0.5x ~ 4x`), 키보드 단축키(`←`, `→`, `Space`)를 지원합니다.
  * `^`, `$`, `\b`, `(?=...)` 등 문자를 소비하지 않는 **Zero-width 탐색**은 글자 사이의 **I-beam(`|`) 포인터**로 구분하여 렌더링하며, 최대 추적 상한선(`1,000 스텝`) 초과 시 재앙적 백트래킹 경고를 표시합니다.
* **블록 흐름도 (Railroad View) & 한국어 해설 트리 ([VisualPatternAnalyzer.jsx](src/components/VisualPatternAnalyzer.jsx))**:
  * 정규식 토큰별 컬러 코딩, 좌→우 매칭 블록 흐름도(트레이서 활성 토큰 실시간 연동), 계층형 한국어 해설 트리를 제공합니다.

### 2. 🎯 시각적 목표(Goal) Diff 비교 뷰 & 인터랙티브 시연 위젯
* **Goal Diff 비교 뷰어 ([GoalDiffViewer.jsx](src/components/GoalDiffViewer.jsx))**:
  * 학습 모드에서 **🎯 목표 영역(초록색 점선 테두리)**과 **⚡ 내 현재 매칭(배경 하이라이트)**을 겹쳐 보여주고, 과다 매칭(Greedy 주의)이나 누락 매칭 원인을 실시간으로 진단합니다.
* **개념 시연 위젯 ([ConceptDemoWidget.jsx](src/components/ConceptDemoWidget.jsx))**:
  * 각 강의 상단에서 버튼 하나로 잘못된 패턴과 올바른 패턴의 매칭 차이를 애니메이션으로 직접 비교할 수 있습니다.

### 3. 🗺️ 5단계 인터랙티브 커리큘럼 & 스테이지 월드맵 ([StageMapModal.jsx](src/components/StageMapModal.jsx))
* **Lv 1. 기초 다지기**: 와일드카드(`.`)와 리터럴 이스케이프(`\.`), 단축 문자 클래스(`\d`, `\w`, `\s`), 대괄호 문자 집합(`[...]`, `[^...]`)
* **Lv 2. 수량자와 앵커**: 기본 수량자(`+`, `*`, `?`), 정밀 수량자(`{n,m}`), **탐욕적(Greedy) vs 게으른(Lazy `*?`, `+?`) 매칭**, 단어 경계(`\b`)
* **Lv 3. 그룹과 캡처 (실무 핵심)**: 번호 캡처 그룹(`(...)`), 비캡처 그룹(`(?:...)`), **Python 명명된 그룹(`(?P<name>...)`)**, 역참조(`\1`, `(?P=name)`)
* **Lv 4. 전방/후방 탐색 (Lookaround)**: 긍정 전방탐색(`(?=...)`), 긍정 후방탐색(`(?<=...)`), 부정 탐색(`(?!...)`, `(?<!...)`)
* **Lv 5. 실무 마스터 & 성능 최적화**: `re.sub` 역참조 개인정보 마스킹, `re.X` (`VERBOSE`) 주석 모드, 백트래킹 방지 최적화

### 4. 🧪 실시간 플레이그라운드 & 💼 실무 예제 프리셋 & 📖 치트시트
* **Python 고유 문법 완벽 호환**: `(?P<name>...)`, `(?P=name)`, `\g<name>`, `\1`, `re.I / re.M / re.S / re.X`
* **3대 실무 카테고리 가상 프리셋 기본 탑재**:
  1. 시스템/서버 로그 분석 (WAS 에러 로그, Nginx Access Log, Python Traceback)
  2. 개인정보 및 보안 마스킹 (주민등록번호 뒷자리 비식별화, 이메일 부분 마스킹)
  3. 텍스트 추출 및 데이터 정제 (HTML 짝꿍 태그 추출, 따옴표 포함 CSV 파싱, `re.X` 시리얼 번호 검증)

---

## 🚀 설치 및 실행 방법 (Getting Started)

```bash
# 1. 의존성 패키지 설치
npm install

# 2. 로컬 개발 서버 실행 (기본 포트: 5188)
npm run dev

# 3. 프로덕션 빌드
npm run build
```
* 브라우저 접속 주소: `http://localhost:5188`

---

## 📂 프로젝트 디렉토리 구조

```text
RegexLearn/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── src/
    ├── App.jsx                         # 3-영역 통합 대시보드 & 모드/모달 관리
    ├── main.jsx
    ├── index.css
    ├── engine/
    │   ├── pythonRegexEngine.js        # Python re 문법 변환, 실행, re.sub, 백트래킹 진단, 코드 생성
    │   ├── regexAstParser.js           # 정규식 토크나이저 및 계층형 AST 파서
    │   └── regexStepTracer.js          # [v2.0] Generator 기반 Step-by-Step 매칭/백트래킹 추적 엔진
    ├── components/
    │   ├── VisualPatternAnalyzer.jsx   # 토큰 컬러링, 블록 흐름도(Railroad), 한국어 해설 트리
    │   ├── StepByStepTracer.jsx        # [v2.0] Step-by-Step 애니메이션 디버거 & 미니 플레이어
    │   ├── GoalDiffViewer.jsx          # [v2.0] 시각적 목표(Goal) 이중 오버레이 & 자동 Diff 진단기
    │   ├── ConceptDemoWidget.jsx       # [v2.0] 레슨별 Before/After 인터랙티브 개념 시연 위젯
    │   ├── StageMapModal.jsx           # [v2.0] 전체 코스 스테이지 월드맵 & 마스터 별점(★) 모달
    │   ├── PlaygroundPanel.jsx         # 정규식 에디터, Edit/Trace 모드 전환, groupdict/re.sub 워크벤치
    │   ├── CurriculumSidebar.jsx       # Lv 1~5 커리큘럼, 별점(★) 판정 및 완성 Python 코드 복사기
    │   ├── PresetsSidebar.jsx          # 실무 예제 프리셋 로더
    │   ├── BookmarksSidebar.jsx        # 개인 정규식 스니펫 북마크 관리
    │   └── CheatsheetModal.jsx         # Python re 인터랙티브 치트시트
    └── data/
        ├── curriculumData.js           # 5단계 커리큘럼 및 실습 미션 데이터
        ├── presetsData.js              # 실무 가상 데이터 프리셋
        └── cheatsheetData.js           # 치트시트 항목 데이터
```
