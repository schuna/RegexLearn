# Antigravity App 멀티 PC 동기화 & GitHub 자동화 가이드

여러 대의 PC(예: 회사 PC, 집 PC, 노트북)에서 **Antigravity App**을 사용할 때 **① 프로젝트 소스 코드**, **② 프로젝트별 에이전트 규칙/스킬**, **③ 모든 프로젝트 공통(전역) 스킬/설정**을 끊김 없이 동기화하는 방법 정리 문서입니다.

---

## 1. 동기화 대상별 저장 구조 이해하기

Antigravity가 참조하는 데이터는 크게 3가지 위치에 저장됩니다.

| 구분 | 저장 위치 | 특징 및 권장 동기화 방식 |
| :--- | :--- | :--- |
| **① 프로젝트 코드 & 전용 규칙/스킬** | `<프로젝트폴더>\AGENTS.md`<br>`<프로젝트폴더>\.agents\skills\...` | **GitHub (`git` + `gh` CLI)** 로 소스 코드와 함께 커밋/푸시하여 동기화 (가장 안정적) |
| **② 전역(Global) 스킬 & MCP 설정** | `C:\Users\<사용자>\.gemini\config\` | **구글 드라이브 심볼릭 링크(`mklink`)** 또는 별도 Private Git 레포지토리로 동기화 |
| **③ 채팅 대화 기록 & 로컬 캐시** | `C:\Users\<사용자>\.gemini\antigravity\brain\` | 각 PC 로컬 전용. 핵심 맥락은 프로젝트 내 `AGENTS.md` 및 `implementation_plan.md`로 문서화하여 공유 |

---

## 2. GitHub CLI (`gh`) 연동으로 프로젝트 & 에이전트 규칙 자동 동기화

웹 브라우저에서 수동으로 레포지토리를 만들 필요 없이, 각 PC에 **GitHub CLI (`gh`)**를 최초 1회 로그인해 두면 Antigravity 채팅창에서 말로 지시하여 전 과정을 자동화할 수 있습니다.

### Step 1. 새로운 PC에서 최초 1회 세팅 (PowerShell)

```powershell
# 1. GitHub CLI 설치 (Windows winget 활용)
winget install --id GitHub.cli

# 2. GitHub 계정 인증 (브라우저 로그인 1회)
& "C:\Program Files\GitHub CLI\gh.exe" auth login

# 3. Git 작성자 기본 정보 등록
git config --global user.name "schuna"
git config --global user.email "jiyong1972@gmail.com"
```

> 💡 **승인 버튼 생략 팁**:
> Antigravity의 **Settings → Permission Grants / Command Allowlist**에 `git`, `gh` 명령어를 등록해 두면 에이전트가 명령어를 실행할 때 매번 승인 버튼을 누르지 않아도 즉시 자동 실행됩니다.

---

### Step 2. 새 프로젝트를 GitHub에 자동 생성 및 업로드할 때

프로젝트 폴더에 `.gitignore` (`node_modules/`, `dist/` 제외), `AGENTS.md`(프로젝트 규칙), `.agents/skills/`(프로젝트 스킬)가 포함된 상태에서 에이전트에게 **"GitHub에 새 레포 만들어서 동기화해줘"**라고 지시하면 아래 과정이 자동 수행됩니다.

```powershell
git init
git config user.name "schuna"
git config user.email "jiyong1972@gmail.com"
git add .
git commit -m "feat: 초기 프로젝트 구현"
git branch -M main
& "C:\Program Files\GitHub CLI\gh.exe" repo create <레포지토리명> --private --source=. --remote=origin --push
```

---

### Step 3. 다른 PC에서 프로젝트를 이어서 작업할 때

1. **다른 PC에서 최초 1회 가져오기**:
   ```powershell
   git clone https://github.com/schuna/<레포지토리명>.git
   cd <레포지토리명>
   npm install
   ```
2. **작업 시작 전 (최신화)**:
   * Antigravity 채팅창에 *"GitHub에서 최신 변경사항 받아와줘 (`git pull`)"* 지시
3. **작업 종료 후 (업로드)**:
   * Antigravity 채팅창에 *"오늘 작업한 내용 커밋하고 푸시해줘"* 지시

> **핵심 장점**: 프로젝트 안에 `AGENTS.md`와 `.agents/skills/`가 함께 들어 있으므로, `git pull`만 받으면 다른 PC의 Antigravity도 **동일한 규칙과 스킬을 즉시 인식**합니다.

---

## 3. 구글 드라이브(Google Drive)를 활용한 동기화 방법과 주의사항

### ⚠️ 주의사항: `node_modules`가 있는 웹 프로젝트를 구글 드라이브에 직접 넣을 때의 문제점
React / Vite / Node.js 프로젝트는 `npm install` 시 `node_modules/` 폴더에 수만 개의 파일이 생성됩니다. 프로젝트 폴더 전체를 구글 드라이브 안에 두고 실행하면:
1. 수만 개 파일을 실시간 감시·업로드하느라 동기화가 멈추거나 PC가 느려집니다.
2. 구글 드라이브가 파일을 읽는 중 빌드 도구가 파일을 수정하려다 **파일 잠금 오류(`EPERM`, `EBUSY`)**가 발생할 수 있습니다.

---

### ⭐ 추천 아키텍처: 코드는 GitHub으로 + 전역 스킬(`.gemini\config`)은 구글 드라이브로 실시간 연동

모든 프로젝트에서 공통으로 쓰는 **내 전역 스킬(`C:\Users\<사용자>\.gemini\config`)** 폴더를 구글 드라이브와 **윈도우 심볼릭 링크(`mklink /D`)**로 연결해 두면, 한 PC에서 `/learn`으로 학습시킨 전역 스킬이 다른 모든 PC에 실시간으로 자동 반영됩니다.

#### ① 1번 PC (최초 설정 PC — 관리자 권한 PowerShell 또는 CMD)
```powershell
# 1. 기존 .gemini\config 폴더를 구글 드라이브로 이동
Move-Item "C:\Users\Jiyong\.gemini\config" "G:\내 드라이브\AntigravityConfig"

# 2. 원래 경로에 구글 드라이브 폴더를 가리키는 심볼릭 링크 생성
cmd /c mklink /D "C:\Users\Jiyong\.gemini\config" "G:\내 드라이브\AntigravityConfig"
```

#### ② 2번 PC (집/노트북 등 다른 PC)
```powershell
# 1. 기존 빈 config 폴더가 있다면 삭제 후 구글 드라이브 폴더와 연결
Remove-Item -Recurse -Force "C:\Users\<사용자명>\.gemini\config" -ErrorAction SilentlyContinue
cmd /c mklink /D "C:\Users\<사용자명>\.gemini\config" "G:\내 드라이브\AntigravityConfig"
```

---

## 4. 등록된 스킬(Skill) 및 규칙(Rule) 확인 방법

1. **Antigravity UI에서 확인**:
   * 좌측 사이드바의 **Skills & Customizations** 클릭 → 활성화된 Skills, Rules, Plugins, MCP Servers 확인
   * 채팅창에 `@` 또는 `/` 입력 시 목록에서 검색 가능
2. **에이전트에게 질문하여 확인**:
   * 채팅창에 *"현재 활성화된 스킬과 규칙 목록 보여줘"*라고 입력
3. **파일 경로에서 직접 확인**:
   * **전역 스킬**: `C:\Users\<사용자>\.gemini\config\skills\<스킬명>\SKILL.md`
   * **프로젝트 스킬**: `<프로젝트폴더>\.agents\skills\<스킬명>\SKILL.md`
   * **프로젝트 규칙**: `<프로젝트폴더>\AGENTS.md` (또는 `GEMINI.md`)
