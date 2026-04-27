export function buildExtractPrompt(regions: Array<{ id: string; category: string; label: string }>): string {
  const list = regions.map(r => `[${r.id}] 카테고리: ${r.category}, 감지 레이블: "${r.label}"`).join('\n')
  return `이 이미지는 산업용 장비의 디스플레이/HMI 화면입니다.
아래 구역 목록의 텍스트·색상·값을 추출하세요.
JSON 이외의 텍스트는 절대 포함하지 마세요. 마크다운 코드블록도 사용하지 마세요.

구역 목록:
${list}

{
  "bgColor": "#이미지 전체 배경색HEX",
  "elements": [
    {
      "id": "구역ID (위 목록과 반드시 일치)",
      "label": "이미지 내 실제 텍스트 그대로 (없으면 감지 레이블 유지, 번역 금지)",
      "value": "표시값 또는 버튼심볼(▲▼◀▶⏻ 등, 없으면 빈 문자열)",
      "color": "#해당 구역 전경색HEX",
      "bgColor": "#해당 구역 배경색HEX",
      "active": true,
      "unit": "단위 (없으면 빈 문자열)"
    }
  ]
}

규칙:
- 반드시 구역 목록의 모든 id에 대해 요소를 반환
- 색상은 실제 이미지에서 추출. 어두운 배경 → #0a0a0a 형태로
- active: 켜진 LED/상태 → true, 꺼짐 → false`
}
