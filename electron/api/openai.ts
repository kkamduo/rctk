const OPENAI_MODEL = 'gpt-4o'

export async function gptVision(imageData: string, mediaType: string, prompt: string, maxTokens = 2048): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY ?? ''
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
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
    let msg = `OpenAI API 오류 ${response.status}`
    try { msg = (JSON.parse(raw) as { error?: { message?: string } }).error?.message || msg } catch {}
    throw new Error(msg)
  }
  const data = await response.json() as { choices: Array<{ message: { content: string } }> }
  return data.choices[0].message.content.trim()
}
