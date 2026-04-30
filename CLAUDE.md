# RCTK — Claude Code 가이드

## 프로그램 개요

**산업용 HMI/TFT 디스플레이 레이아웃 자동화 도구**

- **문제**: 기존 Visual TFT 툴로 화면을 재현하려면 사람이 직접 하나하나 작업 → 인력 낭비
- **해결**: 기존 화면 사진을 AI가 분석하거나, 대화형 AI로 새 레이아웃을 설계 → TFT 파일로 출력
- **대상**: 비개발자 포함 회사 전체 범용 사용
- **미래**: TFT 파일 출력 → 백엔드 연동까지 이 앱 하나로 디스플레이 설계 완결

## 역할
- Claude Code: 실무 구현, 에러 해결 (사용자가 명시적으로 "직접 수정해줘" 할 때만 파일 수정. 그 외엔 설명만)
- Gemini (gemini-2.5-flash): 이미지 분석 + 코드 생성/수정 + 평가

## 현재 파이프라인 (5단계 AI 분석 — 레이어드 구조)

```
이미지 업로드
→ Stage 1: Gemini Vision — 전체 파악 (해상도·배경색·레이아웃)
→ Stage 2: Gemini Vision — 영역 분할 (존 3~8개)
→ Stage 3A: Gemini Vision — 시각 요소 추출 (image-crop 전용 — 로고·다이어그램·순수 그래픽만)
→ Stage 3B: Gemini Vision — 텍스트 요소 추출 (label·numeric·gauge 등, 3A 결과를 컨텍스트로 전달)
→ Stage 4: 코드 조합 (AI 없음) — 3A(image-crop 먼저) + 3B 병합 → ID 재부여 → DisplayConfig 완성
→ 자동 개선 루프: 평가(layout 60% + coverage 40%) → refine → 반복 (최대 99회, 90점 조기종료)
```

**레이어드 구조 의도**: TFT z-order와 일치 — 그래픽 배경(3A) 먼저, 텍스트 오버레이(3B) 위에 렌더링

## 핵심 파일

| 파일 | 역할 |
|------|------|
| `electron/main.ts` | IPC 핸들러 (`analyze-image-staged`, `evaluate-config`, `refine-layout`, `generate-layout` 등) |
| `electron/api/gemini.ts` | `geminiVision(imageData, mediaType, prompt, maxTokens, schema?)` / `geminiChat(messages, system, maxTokens)` |
| `electron/prompts/analyze5/overview.ts` | Stage 1 프롬프트 + 토큰 (2048) |
| `electron/prompts/analyze5/zones.ts` | Stage 2 프롬프트 + 토큰 (2048) |
| `electron/prompts/analyze5/elementsA.ts` | Stage 3A 프롬프트 + 토큰 (4096) + `ELEMENTS_A_SCHEMA` — image-crop 전용 |
| `electron/prompts/analyze5/elementsB.ts` | Stage 3B 프롬프트 + 토큰 (8192) + `ELEMENTS_B_SCHEMA` — 텍스트/수치 요소 (image-crop 금지, 위젯 전체 경계 감지 규칙 포함) |
| `electron/prompts/evaluate.ts` | 평가 프롬프트 (layout + coverage만, 색상 없음) |
| `electron/prompts/generate.ts` | `generate-layout` 프롬프트 (SKELETON + DETAIL 2단계) |
| `electron/utils/cache.ts` | 분석 캐시 (imageKey, overview, zones, `zoneElementsA`, `zoneElementsB`) |
| `src/components/analyzer/TextGenerator.tsx` | 대화형 AI 레이아웃 생성 패널 (이미지 첨부, 교체/전체추가/선택/자동개선 적용) |
| `src/components/analyzer/AutoImproveModal.tsx` | 자동 개선 루프 UI (분석→평가→수정 반복, `initialConfig` prop으로 채팅 결과 직접 수신) |
| `src/components/display/ElementPanel.tsx` | 요소 목록 + 에디터 (dynamic·confident 뱃지·토글 포함) |
| `src/components/display/ElementRenderer.tsx` | 요소 렌더러 (indicator/gauge/arc-gauge/numeric/label/title/logo/icon/image-crop) |
| `src/stores/displayEditorStore.ts` | 캔버스 상태 (config, selectedId, grid, addElement, loadConfig 등) — addElement는 ID 중복 시 자동 재부여 |
| `src/utils/imageCrop.ts` | `cropElement` (이미지 크롭) + `splitValueUnit` (value/unit 자동 분리) |
| `src/types/display.ts` | DisplayElement (`dynamic`, `confident` 필드 포함) |
| `src/types/electron.d.ts` | Electron IPC 타입 정의 |

## 타입 요약

```ts
type ElementType =
  'indicator' | 'gauge' | 'arc-gauge' | 'numeric' |
  'label' | 'title' | 'logo' | 'button' | 'image-crop' | 'icon' |
  'container' | 'rectangle' | 'button-nav' | 'rtc'

interface DisplayElement {
  id, type, label, value, unit, active, color, bgColor  // 기본
  xPct, yPct, widthPct, heightPct                       // 위치 (% 단위)
  dynamic?: boolean      // true=실시간 센서값, false=고정 텍스트
  confident?: boolean    // false=AI 불확실 → 사용자 확인 필요
  imageData?: string     // base64, image-crop 전용
  switchTarget?: string  // button-nav 전용: 이동할 TFT 페이지명 (switch 속성)
  rtcFormat?: string     // rtc 전용: 시간 포맷 (기본 "%y-%n-%d   %h:%m:%s")
}
```

### TFT 타입 매핑 (export 기준)

| RCTK 타입 | TFT type | 비고 |
|-----------|----------|------|
| `image-crop` | `image` | Images\ 폴더 참조 |
| `arc-gauge` | `meter` | angle_start/end |
| `gauge` | `progress` | progress_style=0 (수평) |
| `indicator` | `animation` | ICON 파일 참조 |
| `numeric` | `text_display` | font 자동 선택 |
| `button` | `text` | 단순 텍스트 버튼 |
| `label`/`title`/`logo`/`icon` | `text` | |
| `container` | `rectangle` | fill_type=1 |
| `rectangle` | `rectangle` | fill_type=1 |
| `button-nav` | `button` | switch 속성으로 화면 전환 |
| `rtc` | `rtc` | 실시간 시계 |

## Gemini API 주의사항

- `thinkingBudget: 0` 필수 (기본 thinking 모드가 토큰 소비해서 JSON 잘림 발생)
- `responseMimeType: 'application/json'` 권장 (마크다운 래핑 방지)
- 토큰 한도: Stage1=2048, Stage2=2048, Stage3A=4096, Stage3B=8192

## 해결된 항목
- 5단계 레이어드 AI 분석 파이프라인: Stage3A(image-crop) + Stage3B(텍스트) 분리 → TFT z-order와 일치
- cache.ts: `zoneElements` → `zoneElementsA` / `zoneElementsB` 분리
- TFT export `pickFont()`: 요소 높이(px) 기반 폰트 자동 선택 (h<12→6, h<28→10, h<55→19, else→13; numeric/arc-gauge는 별도 분기) — VisualTFT 텍스트 표시 문제 해결
- TextGenerator 교체 버튼 double-merge 버그 수정: `loadConfig(msg.config)` 단순화
- TextGenerator 초기화면: 예시 버튼 → 이미지 업로드 안내 UI로 교체
- elementsB.ts 바운딩박스 규칙: 텍스트 tight bbox가 아닌 전체 위젯 컨테이너 경계 감지 지시
- 평가 기준: layout(60%) + coverage(40%) — 색상 제거
- dynamic/confident 뱃지·토글 UI, ExportModal 5종, addElement ID 중복 방지 등
- `aiElementIds` + `replaceAiElements`: AI 생성 요소만 교체, 사용자 수동 추가 요소 보존

## TFT 실제 파일 분석 결과 (hansin_test/260331_V1.3.3/monitor.tft)

실제 프로젝트 TFT와 RCTK 생성 TFT 비교에서 발견한 격차:

| 항목 | 원본 TFT | 현재 RCTK | 비고 |
|------|----------|----------|------|
| 캔버스 크기 | 1024×600 | 480×320 (기본값) | AI 분석으로 맞춰야 함 |
| 오른쪽 패널 | 4개 데이터 항목 | 누락 | AI 분석 커버리지 문제 |
| `button` (switch) | 5개 (화면전환) | 미지원 | `button-nav` 타입 추가 필요 |
| `progress` (게이지 바) | 4개 | `gauge`→`progress`로 export됨 ✅ | |
| `animation` (아이콘) | 7개 | indicator로 근사 | ICON 파일 없으면 빈 shell |
| `rtc` (실시간 시계) | 1개 | 미지원 | `rtc` 타입 추가 필요 |
| `rectangle` (배경) | 5개 | container→text로 잘못 export | `rectangle` 타입으로 수정 필요 |

## 다음 할 일 (우선순위 순)

### 1. 신규 TFT 타입 추가 (진행 중)

**3개 파일 수정 필요:**

#### `src/types/display.ts`
- `ElementType`에 `'rectangle' | 'button-nav' | 'rtc'` 추가
- `DisplayElement`에 `switchTarget?: string`, `rtcFormat?: string` 추가

#### `src/components/display/ElementRenderer.tsx`
- `rectangle`: `<div style={{ ...base, background: bgColor, border: '1px solid ${color}44' }} />`
- `button-nav`: 텍스트 레이블 + 테두리 스타일 버튼
- `rtc`: `new Date().toLocaleString('ko-KR', { hour12: false })` 표시

#### `src/utils/exporter.ts` (generateTFT 내부)
- `container` 수정: `text` → `rectangle` (fill_type=1, pen_color, fill_color)
- `rectangle` 추가: 동일하게 `rectangle` export
- `button-nav` 추가: TFT `button` type + `switch="${el.switchTarget}"` 속성
- `rtc` 추가: TFT `rtc` type + `format_string="${el.rtcFormat ?? '%y-%n-%d   %h:%m:%s'}"`

### 2. 채팅 기반 요소 수정 시스템 (설계 완료, 미구현)

캔버스 요소에 번호 뱃지 표시 → 채팅으로 "3번, 5번 색상 바꿔줘" → 해당 요소만 업데이트

**구현 순서:**
1. `DisplayEditor.tsx` — `elements.map((el, idx) =>` + 번호 뱃지 overlay div (bottom-left, zIndex:20)
2. `displayEditorStore.ts` — `updateElements(elements: DisplayElement[])` 액션 추가 (ID 매칭으로 merge, 없으면 추가)
3. `electron/main.ts` — `modify-elements` IPC 핸들러 추가 (번호 목록 → Gemini → 변경된 요소만 반환)
4. `src/types/electron.d.ts` — `modifyElements` 타입 추가
5. `TextGenerator.tsx` — 분기 로직: 캔버스에 요소 있음 + 수정 키워드 → `modifyElements` → `updateElements`

### 3. TFT export 추가 개선
- `image-crop` → `Images\` 폴더 PNG 저장 + url 참조 (ZIP export에서 처리)
- 해상도: AI Stage1 분석 결과 캔버스 크기 자동 반영

### 4. 미해결
- 다중 화면 지원 (프로젝트 단위, `.tftprj` Pages 블록 활용)
- LVGL (C) 코드 출력 (임베디드 타겟용, ExportModal에 옵션 추가)
