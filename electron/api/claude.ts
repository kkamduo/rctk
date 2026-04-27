const CLAUDE_MODEL = 'claude-sonnet-4-6'

export async function claudeVision(imageData: string, mediaType: string, prompt: string, maxTokens = 2048): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY ?? ''
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: maxTokens,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: imageData } },
          { type: 'text', text: prompt },
        ],
      }],
    }),
  })
  if (!response.ok) {
    const raw = await response.text()
    let msg = `Claude API 오류 ${response.status}`
    try { msg = (JSON.parse(raw) as { error?: { message?: string } }).error?.message || msg } catch {}
    throw new Error(msg)
  }
  const data = await response.json() as { content: Array<{ type: string; text?: string }> }
  return data.content.find(c => c.type === 'text')?.text?.trim() ?? ''
}
