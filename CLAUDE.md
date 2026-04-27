# RCTK — Claude Code 역할 정의

## 역할 분리
- claude.ai: 방향 설계, 파이프라인 결정, 큰 그림 논의
- Claude Code: 실무 작업, 에러 해결, 파일 수정 실행
- Gemini API: 이미지 분석 + 코드 생성/수정 + 평가 전담 (gemini-2.5-flash)
- GPT-4o: 평가 전담 예정 (크레딧 충전 후 교체)

## Claude Code 규칙
- claude.ai에서 결정된 방향대로만 실행
- 코드 직접 수정 가능
- 작업 완료 후 결과만 간결하게 보고
- 불필요한 설명 금지

## 내부 프로그램 파이프라인
1. 이미지 업로드
2. Gemini API → 이미지 분석 1회 → 결과 텍스트 캐싱
3. Gemini API → 캐싱 텍스트로 코드 생성
4. Gemini API → 평가 + 피드백 작성 (GPT-4o 전환 예정)
5. 80점 미만 → Gemini API 코드 수정 → 4번 반복
6. 80점 이상 → 결과 출력

## AI 역할
- 이미지 분석 → Gemini (gemini-2.5-flash)
- 코드 생성/수정 → Gemini (gemini-2.5-flash)
- 평가 → Gemini (gemini-2.5-flash) / GPT-4o 전환 예정

## 파일 구조 (electron/)
- electron/main.ts: IPC 핸들러 + 앱 셋업
- electron/api/gemini.ts: geminiVision, geminiChat
- electron/api/openai.ts: gptVision
- electron/api/groq.ts: groqVision, groqChat
- electron/api/claude.ts: claudeVision
- electron/prompts/detectRegions.ts: 구역 감지 프롬프트
- electron/prompts/analyze.ts: 이미지 전체 분석 프롬프트
- electron/prompts/generate.ts: 레이아웃 생성 프롬프트
- electron/prompts/evaluate.ts: 품질 평가 프롬프트 함수
- electron/prompts/refine.ts: 피드백 적용 수정 프롬프트
- electron/prompts/readText.ts: OCR 프롬프트
- electron/prompts/extract.ts: 구역별 속성 추출 프롬프트 함수
- electron/utils/parseJson.ts: JSON 파싱 유틸
- electron/utils/cache.ts: 이미지 분석 캐시
- electron/types/api.ts: ApiMessage, MsgContent 타입
- src/components/analyzer/: 이미지 분석 UI
- src/components/display/: 디스플레이 에디터

## 해결된 항목
- maxOutputTokens 8192 설정
- refine-layout 이미지 파라미터 제거
- evaluate-config Gemini로 교체 (임시)
- applyResult setTimeout 적용
- select-text 복사 기능 추가
- Monitor 아이콘 추가
- ExportModal displayEditorStore 연결
- electron/main.ts → api/ prompts/ utils/ types/ 분리 리팩터링

## 미해결 과제
- 이미지 분석 캐싱 최적화 (Gemini 분당 20회 한도 초과 방지)
- icon 타입 추가 및 변동/고정 요소 판단 로직
- confident 필드 추가 (불확실 요소 사용자 확인 단계)
- HoryongDisplay 제거 또는 일반화
- displayStore / displayEditorStore 혼재 정리
- JSON 내보내기 displayEditorStore 연결

## 앞으로 방향
1. 이미지 캐싱 최적화 → Gemini 호출 횟수 최소화
2. icon 타입 + confident 필드 추가
3. 사용자 확인 단계 UI 구현
4. GPT-4o 평가 연동 (크레딧 충전 후)
