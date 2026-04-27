export type MsgContent = string | Array<{ type: string; [key: string]: unknown }>
export type ApiMessage = { role: 'user' | 'assistant'; content: MsgContent }
