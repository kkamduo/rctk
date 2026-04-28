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
1. **이미지 분석**: 기존 HMI 화면 사진을 AI가 4단계로 분석 → 레이아웃 자동 추출
2. **대화형 생성**: 사용자가 AI와 대화하며 새 레이아웃을 직접 설계

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
| AI 이미지 분석 | Gemini (`gemini-2.5-flash`) |
| AI 레이아웃 생성/수정 | Claude API (`claude-sonnet-4-6`) |
| 번들러 | Vite + vite-plugin-electron |
| 패키징 | electron-builder (Windows portable / NSIS) |

---

## AI 파이프라인

### 이미지 분석 (4단계)

```
이미지 업로드
→ Stage 1: Gemini Vision — 전체 파악 (해상도·배경색·레이아웃)
→ Stage 2: Gemini Vision — 영역 분할 (존 3~8개)
→ Stage 3: Gemini Vision — 요소 추출 (위치·색상·dynamic 여부 통합)
→ Stage 4: 코드 조합 (AI 없음) — DisplayConfig 완성
→ 자동 개선 루프: 평가(layout 60% + coverage 40%) → refine → 반복 (최대 99회, 90점 조기종료)
```

### 대화형 생성

```
사용자 대화 입력 → Claude AI → 레이아웃 JSON 생성 → 캔버스 반영 → 대화로 수정 반복
```

---

## 주요 기능

### 이미지 분석 모드
- 화면 사진 업로드 → 4단계 AI 분석으로 레이아웃 자동 추출
- 분석 진행 상황 실시간 표시 (Stage 1~4)
- `dynamic` 판별: 실시간 센서값 vs 고정 텍스트 자동 구분
- `confident` 판별: AI 불확실 요소 플래그 → 사용자 확인 유도

### 대화형 생성 모드
- Claude AI와 자연어 대화로 레이아웃 설계
- 이미지 첨부 지원 (드래그앤드롭, 파일 선택)
- 멀티턴 대화: 이전 결과 기반 수정 요청 가능

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

---

## 프로젝트 구조

```
rctk/
├── electron/
│   ├── main.ts              # IPC 핸들러 (analyze-image-staged, evaluate-config, refine-layout 등)
│   ├── preload.ts           # renderer-main 브릿지
│   ├── api/
│   │   └── gemini.ts        # Gemini Vision API (thinkingBudget:0, responseMimeType:json)
│   ├── prompts/
│   │   ├── analyze5/        # Stage1~3 프롬프트 + 토큰 설정
│   │   └── evaluate.ts      # 평가 프롬프트
│   └── utils/
│       └── cache.ts         # 분석 캐시 (같은 이미지 재분석 방지)
├── src/
│   ├── components/
│   │   ├── analyzer/        # AutoImproveModal (분석→평가→수정 루프 UI)
│   │   ├── display/         # ElementPanel, 캔버스 렌더러
│   │   └── export/          # ExportModal
│   ├── stores/              # Zustand 스토어
│   └── types/
│       └── display.ts       # DisplayElement 타입 (dynamic, confident 포함)
└── vite.config.ts
```

---

## 실행 방법

### 사전 요구사항
- [Node.js](https://nodejs.org) LTS 버전

### 환경변수 설정
프로젝트 루트에 `.env` 파일 생성:
```
GEMINI_API_KEY=your_gemini_key      # 이미지 분석 (Stage 1~3)
ANTHROPIC_API_KEY=sk-ant-your_key   # 대화형 생성 / refine
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
| v1.1 | Claude API 연동, Groq fallback |
| v1.2 | 멀티 에이전트 자동 개선 루프, 크롭 배경 제거 |
| v1.3 | Gemini 이미지 분석 분리, 4단계 파이프라인, dynamic/confident UI, Gemini 안정화 (thinkingBudget:0) |

---

## TODO (우선순위 순)

- [ ] responseSchema 적용 (Gemini JSON 안정성 추가 강화)
- [ ] 자동 루프 완전 자동화 (사용자 개입 없이 평가→수정 자동 반복)
- [ ] confident=false 요소 사용자 확인 UI
- [ ] displayStore / displayEditorStore 혼재 정리
- [ ] 다중 화면 지원 (프로젝트 단위 관리)
