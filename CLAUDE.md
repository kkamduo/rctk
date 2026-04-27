# RCTK — Claude Code 역할 정의

## 역할 분리
- claude.ai: 방향 설계, 파이프라인 결정
- Claude Code: 실무 작업, 에러 해결, 파일 수정
- Gemini (gemini-2.5-flash): 이미지 분석 + 코드 생성/수정 + 평가
- GPT-4o: 평가 전환 예정 (크레딧 충전 후)

## Claude Code 규칙
- claude.ai에서 결정된 방향대로만 실행
- 작업 완료 후 결과만 간결하게 보고

## 파이프라인
1. 이미지 업로드
2. Gemini → 이미지 분석 1회 → 결과 캐싱 (`electron/utils/cache.ts`)
3. Gemini → 캐싱 텍스트로 코드 생성
4. Gemini → 평가 + 피드백
5. 80점 미만 → Gemini 코드 수정 → 반복 (최대 99회, 90점 조기 종료)
6. 80점 이상 → 결과 출력

## 파일 구조

### electron/
| 파일 | 역할 |
|------|------|
| `main.ts` | IPC 핸들러 + 앱 셋업 |
| `api/gemini.ts` | geminiVision, geminiChat |
| `api/openai.ts` | gptVision |
| `api/groq.ts` | groqVision, groqChat |
| `api/claude.ts` | claudeVision |
| `prompts/analyze.ts` | 이미지 전체 분석 프롬프트 |
| `prompts/generate.ts` | 레이아웃 생성 프롬프트 |
| `prompts/evaluate.ts` | 품질 평가 프롬프트 |
| `prompts/refine.ts` | 피드백 적용 수정 프롬프트 |
| `prompts/detectRegions.ts` | 구역 감지 프롬프트 |
| `prompts/readText.ts` | OCR 프롬프트 |
| `prompts/extract.ts` | 구역별 속성 추출 프롬프트 |
| `utils/cache.ts` | 이미지 분석 캐시 (length+앞128자 키) |
| `utils/parseJson.ts` | JSON 파싱 유틸 |
| `types/api.ts` | ApiMessage, MsgContent 타입 |

### src/
| 파일 | 역할 |
|------|------|
| `types/display.ts` | DisplayElement, DisplayConfig, ElementType, computePixels |
| `utils/exporter.ts` | generateHTML, generateDisplayHTML, generateTFT, generateZip |
| `components/analyzer/AutoImproveModal.tsx` | 자동 개선 루프 UI (이미지 업로드, 반복 로그, 미리보기 패널) |
| `components/export/ExportModal.tsx` | 내보내기 모달 (JSON/HTML/디스플레이HTML/TFT/ZIP) |
| `components/display/` | 디스플레이 에디터 |

## 타입 현황 (display.ts)
```ts
type ElementType = 'indicator' | 'gauge' | 'arc-gauge' | 'numeric' | 'label' | 'title' | 'logo' | 'button' | 'image-crop' | 'icon'

interface DisplayElement {
  dynamic?: boolean    // true=동적(값 변함), false=정적(고정)
  confident?: boolean  // false=불확실(사용자 확인 필요)
  imageData?: string   // base64, image-crop 전용
  mediaType?: string
  // ... xPct, yPct, widthPct, heightPct, label, value, color, bgColor, unit, active
}
```

## 내보내기 지원 형식
- `.rctk.json` — 설정 전체 저장/복원
- `.html` — 리모컨 뷰어
- `-display.html` — 디스플레이 화면 단독
- `.tft` — VisualTFT 작화툴 호환 XML
- `.zip` — HTML + TFT + tftprj + 이미지 전체 패키지

## 자동 개선 루프 (AutoImproveModal)
- 평가 → 사용자 검토 대기 → Gemini 수정 → 반복
- 각 반복 결과: 점수(색상30%+레이아웃40%+커버리지30%), 미리보기, 적용 버튼
- 미리보기 패널: 우측 340px 패널에 ElementRenderer로 실시간 렌더링
- image-crop 요소는 AI 전송 전 base64 제거 (stripImageData)

## 해결된 항목
- maxOutputTokens 8192
- refine-layout 이미지 파라미터 제거
- evaluate-config Gemini 교체
- applyResult setTimeout 100ms
- select-text 복사, Monitor 아이콘
- ExportModal displayEditorStore 연결
- main.ts → api/prompts/utils/types/ 분리
- dynamic/confident 필드 추가
- TFT 출력 구현
- ZIP 내보내기 (JSZip)
- 미리보기 패널 (AutoImproveModal 우측)

## 미해결 과제
- 이미지 분석 캐싱 최적화 (Gemini 분당 20회 한도 초과 방지)
- icon 타입 변동/고정 판단 로직
- confident=false 사용자 확인 단계 UI
- HoryongDisplay 제거 또는 일반화
- displayStore / displayEditorStore 혼재 정리
- JSON 내보내기 displayEditorStore 연결 완전화
