# TFT 타입 매핑/격차 분석 및 신규 타입 구현 가이드

이 문서는 현재 RCTK 코드베이스 기준으로 **TFT export 타입 매핑**, **`monitor.tft` 대비 격차 확인 방법**, **신규 타입(`rectangle`, `button-nav`, `rtc`) 구현 지점**, **채팅 기반 요소 수정 5단계**를 한 번에 실행할 수 있도록 정리한 구현 문서다.

---

## 1) TFT 타입 매핑 표 (현재 구현 기준)

`generateTFT()`는 `src/utils/exporter.ts`에서 `DisplayElement.type`을 VisualTFT `<item type="...">`로 변환한다.

| RCTK `DisplayElement.type` | 현재 TFT export type | 변환 로직 위치 | 비고 |
|---|---|---|---|
| `arc-gauge` | `meter` | `src/utils/exporter.ts`의 `if (el.type === 'arc-gauge')` | 반원형 계기 형태 |
| `gauge` | `progress` | `else if (el.type === 'gauge')` | 진행바 형태 |
| `indicator` | `animation` | `else if (el.type === 'indicator')` | on/off 상태를 `visible`로 표현 |
| `numeric` | `text_display` | `else if (el.type === 'numeric')` | 수치 표시 |
| 기타(`label`, `title`, `logo`, `button`, `image-crop`, `icon`) | `text` (fallback) | 마지막 `else` | 현재는 세부 타입 분기 없음 |

### 핵심 관찰
- 타입 정의(`src/types/display.ts`)에는 `button`, `image-crop`, `icon`이 존재하지만, TFT 변환은 전용 분기가 없어 모두 `text`로 떨어진다.
- 즉, **타입 선언 스펙 대비 TFT export 표현력이 제한**되어 있다.

---

## 2) 실제 파일 분석 결과 — `monitor.tft` 대비 현재 RCTK 격차 표

현재 저장소에는 `monitor.tft` 원본이 포함되어 있지 않다. 따라서 아래 표는 **비교 실행 시 결과를 채우는 템플릿 + 현재 코드 기반 예상 격차**를 함께 제공한다.

### A. 비교 실행 절차
1. 기준 파일 준비: `monitor.tft`를 예: `samples/monitor.tft`에 둔다.
2. 동일 레이아웃을 RCTK에서 구성 후 `.tft` export 생성.
3. 두 파일의 `<item type="...">` 분포 비교.
4. 타입이 없는 항목/속성 누락 항목을 분리 기록.

### B. 격차 표 (현재 코드 기준 예상)

| 비교 항목 | `monitor.tft`(기준) | 현재 RCTK export | 격차 |
|---|---|---|---|
| 도형 사각형 박스 | `rectangle`/유사 도형 타입 사용 가능성 높음 | 별도 분기 없음 (`text` fallback) | **rectangle 미지원** |
| 내비게이션 버튼 | `button`/`hotspot`/이벤트형 타입 가능성 | `button`도 `text`로 export | **button-nav 미지원** |
| 실시간 시계 | `rtc`/clock 타입 가능성 | 별도 시계 타입 없음 | **rtc 미지원** |
| 아이콘/이미지 표시 | 이미지형 타입 사용 가능성 | `image-crop`도 `text` fallback | **이미지형 TFT 매핑 부족** |
| 타입별 세부 속성 | 타입별 전용 attr 존재 | 일부 타입만 attr 구성 | **속성 스키마 부족** |

> TODO(실비교 시): 위 표의 `monitor.tft` 컬럼은 실제 XML 추출값으로 업데이트.

---

## 3) 신규 타입 구현 방법 — `rectangle`, `button-nav`, `rtc`

아래 3개 파일을 우선 수정하면 end-to-end(타입 선언 → 편집/생성 → TFT export) 연결이 된다.

## 3-1) `src/types/display.ts`

### 변경 위치
- `ElementType` 유니온 타입 선언부.

### 변경 내용
- 아래 3개 타입 추가:
  - `rectangle`
  - `button-nav`
  - `rtc`

예시:
```ts
export type ElementType =
  | 'indicator'
  | 'gauge'
  | 'arc-gauge'
  | 'numeric'
  | 'label'
  | 'title'
  | 'logo'
  | 'button'
  | 'image-crop'
  | 'icon'
  | 'rectangle'
  | 'button-nav'
  | 'rtc'
```

---

## 3-2) `src/utils/exporter.ts`

### 변경 위치
- `generateTFT(display)` 내부 `display.elements.map(...)`의 `if / else if` 체인.

### 변경 내용
- `rectangle`, `button-nav`, `rtc` 전용 TFT 매핑 분기 추가.

권장 분기 구조:
```ts
if (el.type === 'rectangle') {
  // 단순 배경 박스/프레임
  return `<item ... type="rectangle" .../>`
} else if (el.type === 'button-nav') {
  // 화면 이동/기능 전환 버튼
  return `<item ... type="button" .../>`
} else if (el.type === 'rtc') {
  // 실시간 시계
  return `<item ... type="rtc" .../>`
}
```

### 속성 설계 가이드
- `rectangle`: `xOffset`, `yOffset`, `width`, `height`, `fore_color`, `bk_color`, border 관련 속성.
- `button-nav`: `text`, `font`, `press_notify`(필요 시), 색상, 정렬, 바인딩 속성.
- `rtc`: 표시 포맷(날짜/시간), 폰트, 색상, 정렬, 갱신 주기 관련 속성.

> 주의: VisualTFT 버전에 따라 정확한 속성명/타입 문자열이 다를 수 있으므로, 실제 `monitor.tft`의 XML 속성명을 1차 기준으로 맞춘다.

---

## 3-3) `electron/prompts/*` (채팅 기반 생성/수정 프롬프트)

채팅에서 새 타입을 생성/수정하려면 프롬프트 스키마가 해당 타입을 인지해야 한다.

### 점검 파일
- `electron/prompts` 하위에서 디스플레이 요소 타입 열거 또는 JSON 스키마를 설명하는 파일.

### 변경 내용
- 허용 타입 목록에 `rectangle`, `button-nav`, `rtc` 추가.
- 각 타입의 의도와 필수 필드를 짧게 정의:
  - `rectangle`: 구획/패널 배경
  - `button-nav`: 페이지 이동/모드 전환 버튼
  - `rtc`: 실시간 시간/날짜 표시

---

## 4) 채팅 기반 요소 수정 — 5단계 구현 순서(상세)

1. **타입 스키마 확장 (정적 안정화)**  
   `src/types/display.ts`에 3개 타입을 추가하고 TS 에러가 없는지 먼저 확인.

2. **채팅 프롬프트/스키마 반영 (생성 경로 확장)**  
   `electron/prompts`에서 LLM이 새 타입을 출력할 수 있게 타입 목록과 예시를 업데이트.

3. **렌더링 경로 반영 (에디터 가시화)**  
   화면 프리뷰 컴포넌트(`src/components/display/*`)에서 `rectangle`, `button-nav`, `rtc`가 기본 모양으로 보이도록 분기 추가.

4. **TFT export 분기 추가 (출력 경로 완성)**  
   `src/utils/exporter.ts`의 `generateTFT()`에 3개 타입 변환을 넣고, fallback(`text`)로 빠지지 않게 한다.

5. **실파일 비교 검증 (monitor.tft 갭 폐쇄)**  
   `monitor.tft` vs RCTK export를 항목별 비교해 타입명/속성명 차이를 표로 마감하고, 누락 속성을 반복 보정한다.

---

## 부록: 빠른 체크리스트

- [ ] `ElementType`에 3개 신규 타입이 선언되었는가?
- [ ] 채팅 프롬프트에서 신규 타입이 허용되는가?
- [ ] 에디터 캔버스에서 신규 타입이 시각적으로 구분되는가?
- [ ] `generateTFT()`에서 신규 타입이 전용 `<item type="...">`로 export되는가?
- [ ] `monitor.tft` 실비교 표가 실제 값으로 업데이트되었는가?
