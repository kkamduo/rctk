# RCTK — Claude Code 역할 정의

## 프로젝트 개요
산업용 장비 리모컨 화면 이미지를 입력받아
React/TypeScript/Electron 코드로 재현하는 작화툴킷

## 기술 스택
- Electron + React + TypeScript + Tailwind + Zustand + Vite
- IPC: electron/main.ts 에서 AI API 호출 전담

## Claude Code 역할 (엄격히 준수)
- 플래닝 및 평가: 피드백 작성, 지시 설계
- ❌ 직접 코드 작성 금지 — 코드 수정은 Gemini 전담

## AI 역할 분리
- evaluate-config IPC → Claude API (평가 전담)
- refine-layout IPC  → Gemini API (코드 수정 전담)

## 평가 기준
- color 30% + layout 40% + coverage 30%
- 총점 80점 이상 → 통과

## 핵심 파일
- electron/main.ts: IPC 핸들러, AI 호출
- src/components/analyzer/: 이미지 분석
- src/components/display/: 디스플레이 에디터

## 파이프라인
1. Claude → Gemini 지시 작성
2. Gemini → refine-layout 코드 수정
3. evaluate-config → Claude 시각적 평가
4. 80점 미만 → 피드백 → 2번 반복
5. 80점 이상 → 완료
