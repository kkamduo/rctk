# RCTK — HMI Display Layout Automation Tool

## 프로젝트 개요

산업용 HMI/TFT 디스플레이 레이아웃을 AI로 자동 생성·개선하는 Electron 앱.

| 항목 | 내용 |
|------|------|
| 개발자 | DAS |
| 개발 방식 | 바이브코딩 (Claude Code + claude.ai) |
| 저장소 | GitHub |

**해결하는 문제**: 기존 Visual TFT 툴로 화면을 재현하려면 사람이 직접 하나하나 작업해야 해서 인력 낭비가 심함.

**두 가지 생성 경로**:
1. **이미지 분석**: 기존 HMI 화면 사진을 AI가 5단계로 분석 → 레이아웃 자동 추출
2. **대화형 생성·수정**: 사용자가 AI와 채팅하며 새 레이아웃을 설계하거나 특정 요소만 수정

**최종 출력**: TFT 파일 → 산업용 모니터링·임베디드 장비에 연동

**대상 사용자**: 비개발자 포함 회사 전체 범용 사용

---

## 기술 스택

| 분류 | 기술 |
|------|------|
| Runtime | Electron + Chromium |
| Frontend | React + TypeScript |
| Styling | Tailwind CSS |
| 상태 관리 | Zustand |
| AI (이미지 분석 + 생성 + 평가) | Gemini (`gemini-2.5-flash`) |
| AI fallback (텍스트 생성) | Groq |
| 번들러 | Vite + vite-plugin-electron |
| 패키징 | electron-builder (Windows portable / NSIS) |

---

## AI 파이프라인

### 이미지 분석 (5단계 레이어드)

```
이미지 업로드
→ Stage 1: Gemini Vision — 전체 파악 (해상도·배경색·레이아웃명)         [2048 tokens]
→ Stage 2: Gemini Vision — 영역 분할 (존 3~8개, 좌표 포함)              [2048 tokens]
→ Stage 3A: Gemini Vision — 시각 요소 추출 (image-crop 전용: 로고·다이어그램)  [4096 tokens]
→ Stage 3B: Gemini Vision — UI 컴포넌트 추출 (container+children 구조)  [8192 tokens]
→ Stage 4: 코드 조합 (AI 없음) — 3A + 3B 병합, ID 재부여 → DisplayConfig 완성
→ 자동 개선 루프: 평가(layout 60% + coverage 40%) → refine → 반복 (최대 99회, 90점 조기종료)
```

**레이어드 구조 의도**: TFT z-order와 일치 — 그래픽 배경(3A) 먼저, UI 오버레이(3B) 위에 렌더링

### 대화형 생성·수정

```
채팅 입력 (이미지 첨부 선택)
→ 새 레이아웃 생성: Gemini Chat (요구사항→레이아웃→상세 3단계) → 캔버스 반영
→ 요소 수정: Gemini Chat (현재 요소 목록 컨텍스트 전달) → 지정 요소만 업데이트
```

---

## 주요 기능

### 이미지 분석 모드
- 화면 사진 업로드 → 5단계 AI 분석으로 레이아웃 자동 추출
- 분석 진행 상황 실시간 표시 (Stage 1~5)
- `dynamic` 판별: 실시간 센서값 vs 고정 텍스트 자동 구분
- `confident` 판별: AI 불확실 요소 플래그 → 사용자 확인 유도
- 캔버스 요소에 번호 뱃지 표시 → 채팅으로 번호 참조 수정 가능

### 대화형 생성·수정 모드 (바이브 코딩 패널)
- Gemini AI와 자연어 채팅으로 레이아웃 설계
- 이미지 첨부 지원 (드래그앤드롭, 파일 선택, 경로 직접 입력)
- **스마트 교체**: AI 생성 요소만 교체, 사용자 추가 요소 보존 (`replaceAiElements`)
- **요소 수정**: "3번, 5번 색상 바꿔줘" → 해당 요소만 업데이트 (`updateElements`)
- 멀티턴 대화: 이전 결과 기반 수정 요청 가능
- 결과 버튼: 교체 / 전체추가 / 선택 추가 / 자동 개선

### 자동 개선 루프 (Auto-Improve)
- 생성된 UI를 원본 이미지와 자동 비교·평가·수정 반복
- 평가 기준: layout 배치(60%) + 요소 커버리지(40%)
- 설정 가능한 반복 횟수, 90점 도달 시 조기 종료

### 요소 편집기 (ElementPanel)
- 요소별 타입·위치·색상·레이블 편집
- `dynamic` 뱃지·토글 (실시간 센서값 여부)
- `confident` 뱃지 (AI 불확실 요소 표시)

### 내보내기 (5종)
- JSON / HTML / 디스플레이 HTML / TFT / ZIP
- TFT: 요소 높이 기반 폰트 자동 선택 (타입별 분리 — numeric/arc-gauge vs text)

---

## 요소 타입

| 타입 | 설명 |
|------|------|
| `indicator` | LED 상태 표시 (on/off) |
| `gauge` | 수평 바 게이지 |
| `arc-gauge` | 반원형 아날로그 게이지 |
| `numeric` | 숫자 수치 표시 |
| `label` | 텍스트 레이블 |
| `title` | 헤더 타이틀 |
| `logo` | 로고/브랜드명 |
| `button` | 버튼 |
| `icon` | 아이콘/심볼 |
| `image-crop` | 원본 이미지에서 크롭한 그래픽 영역 |
| `container` | 배경 패널 (Stage 3B 위젯 컨테이너) |

---

## 프로젝트 구조

```
rctk/
├── electron/
│   ├── main.ts              # IPC 핸들러 (analyze-image-staged, modify-elements, evaluate-config 등)
│   ├── preload.ts           # renderer-main 브릿지
│   ├── api/
│   │   ├── gemini.ts        # geminiVision / geminiChat (thinkingBudget:0, responseMimeType:json)
│   │   └── groq.ts          # groqVision / groqChat (fallback)
│   ├── prompts/
│   │   ├── analyze5/
│   │   │   ├── overview.ts  # Stage 1 프롬프트 (2048 tokens)
│   │   │   ├── zones.ts     # Stage 2 프롬프트 + ZONES_SCHEMA (2048 tokens)
│   │   │   ├── elementsA.ts # Stage 3A 프롬프트 + ELEMENTS_A_SCHEMA (4096 tokens)
│   │   │   └── elementsB.ts # Stage 3B 프롬프트 + ELEMENTS_B_SCHEMA (8192 tokens)
│   │   ├── evaluate.ts      # 평가 프롬프트 (layout + coverage)
│   │   ├── refine.ts        # 수정 프롬프트
│   │   └── generate.ts      # 대화형 생성 프롬프트 (요구사항→레이아웃→상세)
│   └── utils/
│       ├── cache.ts         # 분석 캐시 (overview, zones, zoneElementsA, zoneElementsB)
│       └── parseJson.ts     # JSON 파싱 유틸
├── src/
│   ├── components/
│   │   ├── analyzer/
│   │   │   ├── TextGenerator.tsx     # 채팅 패널 (생성·수정 분기, 교체/추가/선택/자동개선)
│   │   │   └── AutoImproveModal.tsx  # 자동 개선 루프 UI
│   │   ├── display/
│   │   │   ├── DisplayEditor.tsx     # 캔버스 (드래그, 번호 뱃지, 정렬 가이드선)
│   │   │   ├── ElementRenderer.tsx   # 요소 렌더러 (11개 타입)
│   │   │   └── ElementPanel.tsx      # 요소 목록 + 에디터
│   │   └── export/
│   │       └── ExportModal.tsx       # 내보내기 (JSON/HTML/TFT/ZIP)
│   ├── stores/
│   │   └── displayEditorStore.ts     # 캔버스 상태 (aiElementIds, replaceAiElements, updateElements)
│   ├── types/
│   │   ├── display.ts       # DisplayElement, DisplayConfig, ElementType
│   │   └── electron.d.ts    # Electron IPC 타입 정의
│   └── utils/
│       ├── exporter.ts      # generateTFT (pickFont 타입별 분기)
│       └── imageCrop.ts     # cropElement, splitValueUnit
└── vite.config.ts
```

---

## 실행 방법

### 사전 요구사항
- [Node.js](https://nodejs.org) LTS 버전

### 환경변수 설정
프로젝트 루트에 `.env` 파일 생성:
```
GEMINI_API_KEY=your_gemini_key   # 이미지 분석 + 레이아웃 생성 + 평가 (필수)
GROQ_API_KEY=your_groq_key       # 텍스트 생성 fallback (선택)
```

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
| v0.1~v0.9 | 기본 구조, 버튼 그리드, 디스플레이 연동, AI 분석 초기 버전 |
| v1.0 | 대화형 AI 패널, 이미지 첨부, 반응형 요소 배치 (% 단위) |
| v1.1 | Gemini 연동, Groq fallback |
| v1.2 | 멀티 에이전트 자동 개선 루프, 크롭 배경 제거 |
| v1.3 | 4단계 파이프라인, dynamic/confident UI, Gemini 안정화 (thinkingBudget:0) |
| v1.4 | 5단계 레이어드 파이프라인 (Stage3A/3B 분리), container 타입, ZONES_SCHEMA 좌표화 |
| v1.5 | 채팅 기반 요소 수정 (번호 참조), 스마트 교체 (aiElementIds), pickFont 타입별 개선 |

---

## TODO (우선순위 순)

- [ ] **채팅 요소 수정** — DisplayEditor 번호 뱃지 + `updateElements` + `modify-elements` IPC + TextGenerator 분기
- [ ] **TFT export 개선** — `type="image"` PNG 저장 + url 참조, 해상도 정확 반영
- [ ] **confident=false 요소** 사용자 확인 UI
- [ ] **다중 화면 지원** — 프로젝트 단위 관리 (`.tftprj` Pages 블록)
- [ ] **LVGL (C) 코드 출력** — 임베디드 타겟용, ExportModal 옵션 추가

## Current Focus: Non-Text Geometry 90%

The current project target is to extract every non-text visual element from an HMI/TFT screenshot with at least 90% position and size fidelity. Text/OCR is secondary for this phase.

See `docs/non-text-geometry-90.md` and `AGENTS.md` before implementing extraction, prompt, renderer, or export changes related to this target.
