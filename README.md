# RCTK — HMI Display Layout Automation Tool

산업용 HMI/TFT 디스플레이 레이아웃을 AI로 자동 생성·추출·개선하는 Electron 앱.

**해결하는 문제**: Visual TFT 툴로 화면을 재현하려면 사람이 요소 하나하나 직접 배치해야 해서 인력 낭비가 심함. RCTK는 기존 화면 사진 한 장으로 레이아웃을 자동 추출하거나, AI와 대화해 새 화면을 설계한다.

---

## 기술 스택

| 분류 | 기술 |
|------|------|
| Runtime | Electron + Chromium |
| Frontend | React + TypeScript + Tailwind CSS |
| 상태 관리 | Zustand |
| AI — 이미지 분석·생성·평가 | Gemini `gemini-2.5-flash` |
| AI — 텍스트 생성 fallback | Groq |
| 번들러 | Vite + vite-plugin-electron |
| 패키징 | electron-builder (Windows portable / NSIS) |

---

## AI 파이프라인

### 이미지 분석 (5단계 레이어드)

```
이미지 업로드
→ Stage 1: Gemini Vision — 전체 파악 (해상도·배경색·레이아웃명)             [2048 tokens]
→ Stage 2: Gemini Vision — 영역 분할 (존 3~8개, 좌표 포함)                  [2048 tokens]
→ Stage 3A: Gemini Vision — 시각 요소 추출 (image-crop: 로고·다이어그램)     [4096 tokens]
→ Stage 3B: Gemini Vision — UI 컴포넌트 추출 (텍스트·수치·위젯, 3A 컨텍스트 전달) [8192 tokens]
→ Stage 4: 코드 조합 (AI 없음) — 3A + 3B 병합, ID 재부여 → DisplayConfig
→ 자동 개선 루프: 평가(layout 60% + coverage 40%) → refine → 반복 (최대 99회, 90점 조기종료)
```

> **레이어드 구조 의도**: TFT z-order와 일치 — 그래픽 배경(3A)을 먼저, UI 오버레이(3B)를 위에 렌더링

### 대화형 생성·수정

```
채팅 입력 (이미지 첨부 선택)
→ 신규 레이아웃: Gemini Chat (요구사항→레이아웃→상세 3단계) → 캔버스 반영
→ 요소 수정:    Gemini Chat (현재 요소 목록 컨텍스트 전달) → 지정 요소만 업데이트
```

---

## 주요 기능

### 이미지 분석 모드
- 화면 사진 업로드 → 5단계 AI 분석으로 레이아웃 자동 추출
- `dynamic` 판별: 실시간 센서값 vs 고정 텍스트 자동 구분
- `confident` 판별: AI 불확실 요소 플래그 → 사용자 확인 유도

### 대화형 생성·수정 모드
- Gemini AI와 자연어 채팅으로 레이아웃 설계
- 이미지 첨부 지원 (드래그앤드롭·파일 선택)
- **스마트 교체**: AI 생성 요소만 교체, 사용자 수동 요소 보존 (`replaceAiElements`)
- **요소 수정**: "3번, 5번 색상 바꿔줘" → 해당 요소만 업데이트 (`updateElements`)
- 결과 적용 방식: 교체 / 전체추가 / 선택추가 / 자동 개선

### 자동 개선 루프 (Auto-Improve)
- 생성된 UI를 원본 이미지와 자동 비교·평가·수정 반복
- 평가 기준: layout 배치(60%) + 요소 커버리지(40%)
- 90점 도달 시 조기 종료, 최대 99회

### 내보내기 (5종)
- JSON / HTML / 디스플레이 HTML / TFT / ZIP
- TFT: 요소 높이 기반 폰트 자동 선택 (타입별 분기)

---

## 요소 타입

| 타입 | 설명 | TFT 매핑 |
|------|------|----------|
| `indicator` | LED 상태 표시 | `animation` |
| `gauge` | 수평 바 게이지 | `progress` |
| `arc-gauge` | 반원형 아날로그 게이지 | `meter` |
| `numeric` | 숫자 수치 표시 | `text_display` |
| `label` / `title` / `logo` / `icon` | 텍스트/심볼 | `text` |
| `button` | 텍스트 버튼 | `text` |
| `button-nav` | 화면 전환 버튼 | `button` + `switch` |
| `image-crop` | 원본에서 크롭한 그래픽 | `image` |
| `container` | 배경 패널 | `rectangle` |
| `rectangle` | 단순 사각형 배경 | `rectangle` |
| `rtc` | 실시간 시계 위젯 | `rtc` |

---

## 프로젝트 구조

```
rctk/
├── electron/
│   ├── main.ts              # IPC 핸들러 (analyze-image-staged, evaluate-config 등)
│   ├── preload.ts           # renderer ↔ main 브릿지
│   ├── api/
│   │   ├── gemini.ts        # geminiVision / geminiChat
│   │   └── groq.ts          # groqVision / groqChat (fallback)
│   ├── prompts/
│   │   ├── analyze5/
│   │   │   ├── overview.ts  # Stage 1 (2048 tokens)
│   │   │   ├── zones.ts     # Stage 2 + ZONES_SCHEMA (2048 tokens)
│   │   │   ├── elementsA.ts # Stage 3A + ELEMENTS_A_SCHEMA (4096 tokens)
│   │   │   └── elementsB.ts # Stage 3B + ELEMENTS_B_SCHEMA (8192 tokens)
│   │   ├── evaluate.ts      # 평가 프롬프트
│   │   ├── refine.ts        # 수정 프롬프트
│   │   └── generate.ts      # 대화형 생성 프롬프트
│   └── utils/
│       ├── cache.ts         # 분석 캐시 (overview, zones, zoneElementsA, zoneElementsB)
│       └── parseJson.ts     # JSON 파싱 유틸
├── src/
│   ├── components/
│   │   ├── analyzer/
│   │   │   ├── TextGenerator.tsx     # 채팅 패널
│   │   │   └── AutoImproveModal.tsx  # 자동 개선 루프 UI
│   │   ├── display/
│   │   │   ├── DisplayEditor.tsx     # 캔버스
│   │   │   ├── ElementRenderer.tsx   # 요소 렌더러 (11개 타입)
│   │   │   └── ElementPanel.tsx      # 요소 목록 + 에디터
│   │   └── export/
│   │       └── ExportModal.tsx       # 내보내기
│   ├── stores/
│   │   └── displayEditorStore.ts     # 캔버스 상태
│   ├── types/
│   │   ├── display.ts                # DisplayElement, DisplayConfig, ElementType
│   │   └── electron.d.ts             # Electron IPC 타입
│   └── utils/
│       ├── exporter.ts               # generateTFT
│       └── imageCrop.ts              # cropElement, splitValueUnit
└── vite.config.ts
```

---

## 실행 방법

### 환경변수 설정
프로젝트 루트에 `.env` 파일 생성:
```
GEMINI_API_KEY=your_gemini_key   # 필수 (이미지 분석 + 생성 + 평가)
GROQ_API_KEY=your_groq_key       # 선택 (텍스트 생성 fallback)
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

## Current Focus: Non-Text Geometry 90%

현재 목표는 HMI/TFT 화면에서 **비텍스트 시각 요소(패널·게이지·버튼·아이콘 등)를 90% 이상 정확도로 추출**하는 것.

- 위치·크기 기준: IoU >= 0.90 또는 중심·크기 오차 3% 이내
- OCR·텍스트 정확도는 이 목표의 우선순위 밖
- 참고: `docs/non-text-geometry-90.md`, `AGENTS.md`

### 다음 할 일 (우선순위 순)

- [ ] **비텍스트 요소 검증 스크립트** — 생성 결과 vs 실제 TFT 비교 (IoU, center/size error)
- [ ] **Stage 3A 프롬프트 강화** — 패널·버튼·게이지 바운딩박스 정밀도 향상
- [ ] **캔버스 크기 자동 반영** — Stage 1 해상도 감지 결과를 DisplayConfig에 즉시 반영
- [ ] **TFT export 개선** — `image-crop` → `Images\` PNG 저장 + url 참조 (ZIP)
- [ ] **채팅 요소 수정** — 번호 뱃지 + `modify-elements` IPC + TextGenerator 분기
- [ ] **다중 화면 지원** — `.tftprj` Pages 블록 활용
