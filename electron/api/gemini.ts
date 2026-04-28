import type { ApiMessage } from '../types/api'

const GEMINI_MODEL = 'gemini-2.5-flash'

export async function geminiVision(imageData: string, mediaType: string, prompt: string, maxTokens = 8192, schema?: object): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY ?? ''
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [
        { inline_data: { mime_type: mediaType, data: imageData } },
        { text: prompt },
      ]}],
      generationConfig: {
      maxOutputTokens: maxTokens,
      temperature: 0.1,
      thinkingConfig: { thinkingBudget: 0 },    // thinking 비활성화
      responseMimeType: 'application/json',       // 순수 JSON 강제 (마크다운 코드블록 제거)
      ...(schema ? { responseSchema: schema } : {}),
      },
    }),
  })
  if (!response.ok) {
    const raw = await response.text()
    let msg = `Gemini API 오류 ${response.status}`
    try { msg = (JSON.parse(raw) as { error?: { message?: string } }).error?.message || msg } catch {}
    throw new Error(msg)
  }
  const data = await response.json() as { candidates: Array<{ content: { parts: Array<{ text?: string }> } }> }
  return data.candidates[0]?.content?.parts?.find(p => p.text)?.text?.trim() ?? ''
}

export async function geminiChat(messages: ApiMessage[], systemPrompt: string, maxTokens = 8192): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY ?? ''
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`
  const contents = messages.map(msg => {
    if (typeof msg.content === 'string') {
      return { role: msg.role === 'assistant' ? 'model' : 'user', parts: [{ text: msg.content }] }
    }
    const parts = msg.content.map(part => {
      if (part.type === 'image_url') {
        const rawUrl = (part.image_url as { url: string }).url
        const [header, b64data] = rawUrl.split(',')
        const mime = header.split(':')[1].split(';')[0]
        return { inline_data: { mime_type: mime, data: b64data } }
      }
      return { text: String(part.text ?? '') }
    })
    return { role: msg.role === 'assistant' ? 'model' : 'user', parts }
  })
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents,
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature: 0.3,
        thinkingConfig: { thinkingBudget: 0 },
        responseMimeType: 'application/json',
      },
    }),
  })
  if (!response.ok) {
    const raw = await response.text()
    let msg = `Gemini API 오류 ${response.status}`
    try { msg = (JSON.parse(raw) as { error?: { message?: string } }).error?.message || msg } catch {}
    throw new Error(msg)
  }
  const data = await response.json() as {
    candidates: Array<{
      content: { parts: Array<{ text?: string }> }
      finishReason?: string
    }>
  }
  const candidate = data.candidates[0]
  if (candidate?.finishReason === 'MAX_TOKENS') {
    throw new Error(`응답이 토큰 한도에서 잘렸습니다 (maxTokens: ${maxTokens})`)
  }
  return candidate?.content?.parts?.find(p => p.text)?.text?.trim() ?? ''
}
