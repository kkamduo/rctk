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

## 현재 파이프라인 (4단계 AI 분석)

```
이미지 업로드
→ Stage 1: Gemini Vision — 전체 파악 (해상도·배경색·레이아웃)
→ Stage 2: Gemini Vision — 영역 분할 (존 3~8개)
→ Stage 3: Gemini Vision — 요소 추출 (위치·색상·dynamic 통합)
→ Stage 4: 코드 조합 (AI 없음) — DisplayConfig 완성
→ 자동 개선 루프: 평가(layout 60% + coverage 40%) → refine → 반복 (최대 99회, 90점 조기종료)
```

## 핵심 파일

| 파일 | 역할 |
|------|------|
| `electron/main.ts` | IPC 핸들러 (`analyze-image-staged`, `evaluate-config`, `refine-layout`, `generate-layout` 등) |
| `electron/api/gemini.ts` | `geminiVision(imageData, mediaType, prompt, maxTokens, schema?)` / `geminiChat(messages, system, maxTokens)` |
| `electron/prompts/analyze5/overview.ts` | Stage 1 프롬프트 + 토큰 (2048) |
| `electron/prompts/analyze5/zones.ts` | Stage 2 프롬프트 + 토큰 (2048) |
| `electron/prompts/analyze5/elements.ts` | Stage 3 프롬프트 + 토큰 (8192) + `ELEMENTS_SCHEMA` |
| `electron/prompts/evaluate.ts` | 평가 프롬프트 (layout + coverage만, 색상 없음) |
| `electron/prompts/generate.ts` | `generate-layout` 프롬프트 (SKELETON + DETAIL 2단계) |
| `electron/utils/cache.ts` | 분석 캐시 (imageKey, overview, zones, zoneElements) |
| `src/components/analyzer/TextGenerator.tsx` | 대화형 AI 레이아웃 생성 패널 (이미지 첨부, 교체/전체추가/선택 적용) |
| `src/components/analyzer/AutoImproveModal.tsx` | 자동 개선 루프 UI (분석→평가→수정 반복) |
| `src/components/display/ElementPanel.tsx` | 요소 목록 + 에디터 (dynamic·confident 뱃지·토글 포함) |
| `src/components/display/ElementRenderer.tsx` | 요소 렌더러 (indicator/gauge/arc-gauge/numeric/label/title/logo/icon/image-crop) |
| `src/stores/displayEditorStore.ts` | 캔버스 상태 (config, selectedId, grid, addElement, loadConfig 등) |
| `src/types/display.ts` | DisplayElement (`dynamic`, `confident` 필드 포함) |
| `src/types/electron.d.ts` | Electron IPC 타입 정의 |

## 타입 요약

```ts
type ElementType = 'indicator' | 'gauge' | 'arc-gauge' | 'numeric' | 'label' | 'title' | 'logo' | 'button' | 'image-crop' | 'icon'

interface DisplayElement {
  id, type, label, value, unit, active, color, bgColor  // 기본
  xPct, yPct, widthPct, heightPct                       // 위치 (% 단위)
  dynamic?: boolean    // true=실시간 센서값, false=고정 텍스트
  confident?: boolean  // false=AI 불확실 → 사용자 확인 필요
  imageData?: string   // base64, image-crop 전용
}
```

## Gemini API 주의사항

- `thinkingBudget: 0` 필수 (기본 thinking 모드가 토큰 소비해서 JSON 잘림 발생)
- `responseMimeType: 'application/json'` 권장 (마크다운 래핑 방지)
- 토큰 한도: Stage1=2048, Stage2=2048, Stage3=8192

## 해결된 항목
- 4단계 AI 분석 파이프라인 (5단계에서 축소, 요소+좌표 통합)
- 평가 기준: layout(60%) + coverage(40%) — 색상 제거
- dynamic/confident 뱃지·토글 UI (ElementPanel)
- 분석 에러 표시 (analysisError 상태)
- 분석 완료 후 미리보기 버튼
- Gemini thinkingBudget:0 + responseMimeType 적용 (JSON 파싱 안정화, geminiVision만)
- ExportModal: JSON/HTML/디스플레이HTML/TFT/ZIP 5종
- responseSchema 적용: `geminiVision`에 `schema?` 파라미터, Stage3에 `ELEMENTS_SCHEMA` 전달
- confident=false UI: ElementPanel — 목록 `?` 배지, 편집창 경고 배너 + 확인 버튼
- 레거시 파일 삭제: `displayStore.ts`, `DisplayCanvas.tsx`, `DisplayWidget.tsx`, `HoryongDisplay.tsx`
- icon 타입 renderer: 유니코드 심볼 렌더링 (ElementRenderer)
- addElement 추가: displayEditorStore에 `addElement` 액션
- 캔버스 와이프 버그 수정: ImageAnalyzer `applyToCanvas` + TextGenerator → `loadConfig` 대신 `addElement`
- TextGenerator 개선: 교체 / 전체추가 / 선택(체크박스) 3버튼 분리
- generate-layout 해상도 유지: `canvasWidth/Height`를 IPC로 전달, 프롬프트 앞에 주입
- geminiChat 안정화: `thinkingBudget:0` + `responseMimeType:'application/json'` 추가, skeleton maxTokens 8192

## 다음 할 일 (우선순위 순)

### 1. 자동 루프 완전 자동화
현재: 평가 후 "Gemini에 전달" 버튼을 사용자가 눌러야 다음 단계 진행
목표: 사용자 개입 없이 자동으로 평가→수정 반복

### 3. TextGenerator ↔ AutoImproveModal 연결
TextGenerator에서 생성한 레이아웃에 자동개선 루프 적용.
→ ChatMessage에 imageData 보존, "자동개선" 버튼 추가, AutoImproveModal에 initialConfig prop 추가

### 4. TFT export 개선 (hansin_test/260331_V1.3.3 분석 기준)
실제 프로젝트 포맷 확인 결과:
- 해상도: 1024x600 (기본값 480x320과 다름 — 캔버스 크기를 정확히 반영해야 함)
- `type="image" url="Images\xxx.png"` 타입 미지원 — image-crop 요소를 Images/ 폴더에 PNG로 저장하고 url 참조로 export해야 함
- 다중 스크린: `.tftprj` `<Pages>` 블록에 여러 `.tft` 참조 (다중 화면 지원 시 필요)

### 5. 미해결
- TextGenerator 예시 버튼 → 수정 명령 예시로 교체
- 다중 화면 지원 (프로젝트 단위)
- LVGL (C) 코드 출력 (임베디드 타겟용, ExportModal에 옵션 추가)
