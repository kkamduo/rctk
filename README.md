# RCTK — Industrial Remote Control Toolkit

## 프로젝트 개요

산업용 장비 리모컨의 버튼 레이아웃과 디스플레이 화면 UI를 세트로 자동 생성하는 작화툴킷.
예시 화면(이미지 또는 텍스트)을 입력하면 비슷한 스타일로 리모컨 UI를 생성해준다.

| 항목 | 내용 |
|------|------|
| 개발자 | DAS |
| 개발 방식 | 바이브코딩 (Claude Code + claude.ai) |
| 저장소 | GitHub |

---

## 기술 스택

| 분류 | 기술 |
|------|------|
| Runtime | Electron + Chromium |
| Frontend | React + TypeScript |
| Styling | Tailwind CSS |
| 상태 관리 | Zustand |
| AI 분석 | Claude API — `claude-sonnet-4-6` (기본) / Groq `llama-4-scout` (fallback) |
| AI 이미지 생성 | Stability AI (예정) |
| 번들러 | Vite + vite-plugin-electron |
| 패키징 | electron-builder (Windows portable / NSIS) |

---

## 주요 기능

### 구현 완료
- 텍스트 / 이미지 입력으로 스타일 지정
- 리모컨 버튼 그리드 레이아웃 생성 (2×3, 3×3, 3×4, 4×4 등)
- 디스플레이 화면 UI와 세트로 동시 생성
- 버튼 타입 설정: `momentary` / `toggle` / `hold` / `emergency` / `encoder` / `indicator`
- 강조 색상 커스터마이징 (5가지 테마 프리셋 + custom)
- 드래그&드롭 요소 편집 (정렬 가이드선, 그리드 스냅)
- HTML / JSON 내보내기
- Horyong 크레인 제어 시스템 UI 시뮬레이션

### 크롭 분석 (이미지 오브젝트 추출)
- 이미지 위에 크롭 영역을 직접 드래그하여 UI 요소 추출
- **배경 제거**: 테두리 픽셀 샘플링으로 배경색 자동 추정 → RGB 거리 기반 투명화 → PNG 출력
- **아이콘 / 텍스트 구분**: 각 크롭 영역을 `icon` 또는 `text` 타입으로 분류
  - `icon` → `image-crop` 요소로 캔버스에 배치 (PNG 이미지 데이터 포함)
  - `text` → `label` 요소로 배치 (동적 `value` 필드, 이벤트 기반 값 변경 예정)
- **OCR 지원**: 크롭 영역에서 텍스트 자동 읽기 ("값 읽기" / "텍스트 읽기")
- 복수 크롭 동시 관리, 캔버스 일괄 적용

### AI 이미지 분석 (Claude Vision / Groq fallback)
- **3단계 분석 플로우**: 영역 감지 → 구역 확인 → UI 생성
- AI가 인식한 영역을 이미지 위에 **바운딩 박스**로 시각화 (카테고리별 색상)
- 바운딩 박스 인터랙션:
  - 박스 드래그 → 위치 이동
  - 코너 핸들 드래그 → 리사이즈
  - 빈 공간 드래그 → 새 구역 직접 그리기 → 카테고리 선택
  - **AI 추가 탐지**: 그린 영역을 크롭해서 Groq 재분석 후 병합
  - 영역별 ON/OFF 토글 및 삭제
- **반응형 요소 배치**: 위치·크기를 `%` 단위로 저장 → 캔버스 크기 변경 시 자동 비례 재배치
  - 원본 이미지 비율 그대로 캔버스 크기 결정
  - 이미지 테두리 픽셀 분석으로 배경색 자동 추출
  - 요소 폰트·SVG 크기 캔버스 크기에 비례 자동 스케일
- **done 단계 비교 뷰**: 원본 이미지 vs UI 미리보기 나란히 표시, 요소 ON/OFF 실시간 반영
- `← 구역 확인으로` 버튼으로 이전 단계 되돌아가기
- 바운딩 박스 스케일 보정: `naturalWidth/offsetWidth` 비율 계산 + 콘솔 로그 출력
- 디스플레이 요소 타입 확장: `arc-gauge` (원형 게이지 SVG), `button` (아이콘 버튼)

### 바이브 코딩 (AI 대화 패널)
- **우측 상시 표시**: 토글 없이 항상 열려 있는 채팅 패널
- **대화형 인터페이스**: 메시지 히스토리 유지 → 이전 결과 기반 수정 요청 가능
  - 예: "배경을 더 어둡게 해줘", "비상정지 버튼 추가해줘"
- **이미지 첨부 지원**:
  - 패널 위에 이미지 드래그앤드롭
  - 📂 파일 경로 직접 입력 (`C:\images\display.png`)
  - 🖼 파일 선택 다이얼로그
  - 첨부된 이미지를 AI가 vision으로 분석하여 레이아웃 생성
- **생성 품질 개선**:
  - 이미지 배경색 직접 추출 적용
  - 원본 강조 색상 (초록·빨강·청록 등) 요소에 반영
  - 원형 계기판 → `arc-gauge` 자동 판별
  - 이미지 위치 비율 기반 배치
  - 밝은 전경색 강제 적용

### 자동 개선 (Auto-Improve) — 멀티 에이전트
- 생성된 UI를 자동으로 반복 평가·개선하는 루프
- **독립 평가 에이전트** (`evaluate-config` IPC): 현재 UI를 원본 이미지와 비교, 점수(색상/레이아웃/커버리지)와 개선 항목 리스트 반환
- **순수 수정 에이전트** (`refine-layout` IPC): 평가 피드백만 입력으로 받아 자체 판단 없이 피드백 그대로 적용
  - 생성기(generator)의 자체 판단 완전 차단 — `REFINE_PROMPT`에 명시
- 설정 가능한 반복 횟수(1~5회), 진행 상황 실시간 표시

### AI 기능 (예정)
- 시스템 프롬프트 커스터마이징 UI (브랜드 AI 성격 설정)
- Stability AI 이미지 생성 연동

---

## 프로젝트 구조

```
rctk_clone/
├── electron/
│   ├── main.ts          # Electron 메인 프로세스, IPC 핸들러, AI API 호출
│   └── preload.ts       # 렌더러-메인 프로세스 브릿지
├── src/
│   ├── App.tsx          # 루트 레이아웃 및 모달 제어
│   ├── components/
│   │   ├── remote/      # 리모컨 캔버스, 버튼 셀
│   │   ├── display/     # 디스플레이 편집기, 요소 렌더러, HoryongDisplay
│   │   ├── analyzer/    # 이미지 분석 (ImageAnalyzer), 텍스트 생성 (TextGenerator)
│   │   ├── editor/      # 버튼 편집, 스타일 패널, 그리드 설정
│   │   └── export/      # HTML / JSON 내보내기 모달
│   ├── stores/          # Zustand 스토어 (remote, display, style, api)
│   ├── types/           # TypeScript 타입 정의
│   └── utils/
│       └── exporter.ts  # 내보내기 로직
├── package.json
└── vite.config.ts
```

---

## 실행 방법

### 사전 요구사항
- [Node.js](https://nodejs.org) LTS 버전
- PowerShell 실행 정책 허용 (Windows):
  ```powershell
  Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
  ```

### AI 기능 사용 시
프로젝트 루트에 `.env` 파일 생성 (`.env.example` 참고):
```
ANTHROPIC_API_KEY=sk-ant-your_key_here   # Claude API (우선 사용)
GROQ_API_KEY=gsk_your_key_here           # Groq API (Claude 키 없을 때 fallback)
```
- Claude API 키: [console.anthropic.com](https://console.anthropic.com)에서 발급
- Groq API 키: [console.groq.com](https://console.groq.com)에서 무료 발급

### 개발 모드
```bash
npm install
npm run dev
```

### Windows 배포 빌드
```bash
npm run dist:win
```
빌드 결과물 → `release/` 폴더 (portable exe + NSIS 설치 파일)

---

## 버전 히스토리

| 버전 | 내용 |
|------|------|
| v0.1 | 프로젝트 기본 구조 |
| v0.2 | 버튼 그리드 레이아웃 완성 |
| v0.3 | 디스플레이 화면 연동 |
| v0.4 | 스타일 프리셋 추가 |
| v0.5 | Groq AI 이미지 분석 / Vibe Coding 텍스트 생성 연동 |
| v0.6 | HTML / JSON 내보내기, Horyong 시뮬레이션 |
| v0.7 | 바운딩 박스 인터랙션 (이동/리사이즈/그리기/AI 추가 탐지), arc-gauge·button 타입 추가, .env API 키 분리 |
| v0.8 | 바운딩 박스 스케일 보정, 원본 vs 미리보기 비교 뷰, 모달 배경 클릭 닫힘 버그 수정 |
| v0.9 | UI 생성 절대좌표 기반 전환 — 바운딩 박스 위치 그대로 적용, 배경색 자동 추출, 폰트 비례 설정 |
| v1.0 | 바이브 코딩 대화형 패널, 이미지 드래그앤드롭 첨부, AI 생성 품질 개선, 반응형 요소 배치 (% 단위) |
| v1.1 | Claude API 연동 (claude-sonnet-4-6), Groq fallback 유지, .env 듀얼 키 지원 |
| v1.2 | 멀티 에이전트 자동 개선 루프 (평가/수정 에이전트 분리), 크롭 배경 제거 (PNG 투명화), 아이콘/텍스트 크롭 타입 구분 |

---

## TODO

- [x] Groq API 키 `.env` 파일 분리
- [x] 이미지 분석 2단계 플로우 (영역 감지 → 확인 → UI 생성)
- [x] 바운딩 박스 인터랙션 (이동 / 리사이즈 / 그리기 / AI 추가 탐지)
- [x] arc-gauge (원형 게이지), button (아이콘 버튼) 타입 추가
- [x] 바운딩 박스 스케일 보정 (naturalWidth/offsetWidth 비율)
- [x] 원본 이미지 vs UI 미리보기 비교 뷰 (done 단계)
- [x] UI 생성 절대좌표 기반 전환 (AI 레이아웃 임의 변경 방지)
- [x] 이미지 배경색 자동 추출 (테두리 픽셀 최빈 색상)
- [x] 폰트 크기 박스 높이 비례 자동 설정
- [x] 바이브 코딩 대화형 채팅 패널 (우측 상시 표시)
- [x] 이미지 드래그앤드롭 · 파일 경로 입력 → vision 기반 레이아웃 생성
- [x] 생성 품질 개선 — 배경색 추출, 색상 매핑, arc-gauge 자동 판별, 밝은 전경색
- [x] 반응형 요소 배치 — 위치·크기 % 단위 저장, 캔버스 크기 변경 시 자동 재배치
- [x] Claude API 연동 (claude-sonnet-4-6, Groq fallback 유지)
- [x] 자동 개선 멀티 에이전트 분리 (평가 에이전트 / 수정 에이전트 독립 실행)
- [x] 크롭 분석 — 배경 제거 (RGB 거리 임계값 투명화, PNG 출력)
- [x] 크롭 타입 구분 — 아이콘(`image-crop`) / 텍스트(`label`, 동적 value 필드)
- [ ] 텍스트 크롭 이벤트 바인딩 (value 동적 업데이트 시스템)
- [ ] 시스템 프롬프트 커스터마이징 UI
- [ ] JSON import (프로젝트 불러오기 — 내보내기만 구현됨)
- [ ] Undo / Redo
- [ ] Stability AI 이미지 생성 연동
- [ ] CMOS 배터리 교체 (개발 PC)

---

## 인계 참고

- 이 프로젝트는 claude.ai 대화 기록에 전체 기획 내용 포함
- 바이브코딩 방식으로 진행 중 (Claude Code + claude.ai)
- **Claude Code 새 세션 시작 시 이 README 먼저 읽히면 맥락 파악 가능**
- AI 스택: Claude API (claude-sonnet-4-6) 기본, ANTHROPIC_API_KEY 없으면 Groq fallback
