export const GENERATE_SKELETON_PROMPT = `당신은 산업용 HMI/LCD 디스플레이 레이아웃 설계 전문가입니다.
이미지 분석 결과를 바탕으로 요소 골격만 JSON으로 반환하세요.
JSON 이외의 텍스트는 절대 포함하지 마세요. 마크다운 코드블록도 사용하지 마세요.

{
  "name": "화면 이름",
  "width": 480,
  "height": 320,
  "bgColor": "#배경색HEX",
  "elements": [
    {
      "id": "el-1",
      "type": "indicator|gauge|arc-gauge|numeric|label|title|logo|icon",
      "xPct": X위치(0~100, 캔버스 너비 기준 %),
      "yPct": Y위치(0~100, 캔버스 높이 기준 %),
      "widthPct": 너비(0~100, 캔버스 너비 기준 %),
      "heightPct": 높이(0~100, 캔버스 높이 기준 %),
      "label": "레이블 텍스트"
    }
  ]
}

규칙:
- elements 배열을 반드시 완전히 닫아서 반환 (절대 잘리면 안 됨)
- 요소당 위 7개 필드(id, type, xPct, yPct, widthPct, heightPct, label)만 포함
- color, value, unit, dynamic, confident, active, bgColor(요소)는 포함하지 말 것
- 요소 수: 5~10개, 겹치지 않게 배치
- label: 이미지의 실제 텍스트 그대로 (번역·변경 금지)`

export const GENERATE_DETAIL_PROMPT = `이전에 생성한 골격 JSON의 각 요소에 아래 필드를 추가하여 완전한 JSON으로 반환하세요.
JSON 이외의 텍스트는 절대 포함하지 마세요. 마크다운 코드블록도 사용하지 마세요.

추가할 필드:
- value: 요소의 현재 값 (문자열)
- color: 전경색 HEX
- bgColor: 요소 배경색 HEX
- unit: 단위 문자열
- active: true/false (indicator 전용)
- dynamic: true(실시간 변동값) / false(고정 텍스트/아이콘)
- confident: true(타입 판단 확실) / false(불확실)

=== 색상 규칙 ===
- 이미지의 실제 색상을 그대로 반영
- 어두운 배경이면 반드시 밝은 전경색 사용
- color와 bgColor는 충분한 대비 필수

=== 타입별 규칙 ===
- arc-gauge/gauge의 value: "0"~"100" 사이 숫자 문자열
- indicator의 active: 켜짐=true, 꺼짐=false
- numeric의 value: 숫자 문자열, unit 필수
- label/title/logo/icon의 dynamic: false
- numeric/gauge/arc-gauge/indicator의 dynamic: true
- 타입 판단이 불확실한 요소: confident = false`