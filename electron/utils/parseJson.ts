export function parseJson(text: string): unknown {
  const start = text.indexOf('{')
  if (start === -1) throw new Error('응답에서 JSON을 찾을 수 없습니다')
  let depth = 0, inStr = false, esc = false, end = -1
  for (let i = start; i < text.length; i++) {
    const ch = text[i]
    if (esc) { esc = false; continue }
    if (ch === '\\' && inStr) { esc = true; continue }
    if (ch === '"') { inStr = !inStr; continue }
    if (!inStr) {
      if (ch === '{') depth++
      else if (ch === '}') { if (--depth === 0) { end = i; break } }
    }
  }
  if (end === -1) throw new Error(`JSON 파싱 실패: 닫는 괄호 없음 (원문 앞 200자: ${text.slice(0, 200)})`)
  return JSON.parse(text.slice(start, end + 1))
}
