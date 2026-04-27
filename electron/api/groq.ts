import type { ApiMessage } from '../types/api'

const GROQ_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct'

export async function groqVision(imageData: string, mediaType: string, prompt: string, maxTokens = 2048): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY ?? ''
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: `data:${mediaType};base64,${imageData}` } },
          { type: 'text', text: prompt },
        ],
      }],
      temperature: 0.1,
      max_tokens: maxTokens,
    }),
  })
  if (!response.ok) {
    const raw = await response.text()
    let msg = `Groq API 오류 ${response.status}`
    try { msg = (JSON.parse(raw) as { error?: { message?: string } }).error?.message || msg } catch {}
    throw new Error(msg)
  }
  const data = await response.json() as { choices: Array<{ message: { content: string } }> }
  return data.choices[0].message.content.trim()
}

export async function groqChat(messages: ApiMessage[], systemPrompt: string, maxTokens = 4096): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY ?? ''
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      temperature: 0.3,
      max_tokens: maxTokens,
    }),
  })
  if (!response.ok) {
    const raw = await response.text()
    let msg = `Groq API 오류 ${response.status}`
    try { msg = (JSON.parse(raw) as { error?: { message?: string } }).error?.message || msg } catch {}
    throw new Error(msg)
  }
  const data = await response.json() as { choices: Array<{ message: { content: string } }> }
  return data.choices[0].message.content.trim()
}
