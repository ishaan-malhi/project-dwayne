import Anthropic from '@anthropic-ai/sdk'
import type { MacroEstimate } from '../types'

export async function estimateMacros(
  imageBase64: string,
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif',
  description: string,
  apiKey: string
): Promise<MacroEstimate> {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    system: `You are a sports nutrition expert. Analyse the meal photo and description provided.
Return ONLY valid JSON in this exact format, no markdown, no explanation:
{"protein":0,"carbs":0,"fat":0,"calories":0,"notes":"brief reasoning"}
Values: protein/carbs/fat in grams (integers), calories in kcal (integer).
Be accurate but err on the side of slightly higher estimates for a performance athlete.`,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mimeType, data: imageBase64 },
          },
          {
            type: 'text',
            text: description
              ? `Meal description: ${description}\n\nEstimate the macros for this meal.`
              : 'Estimate the macros for this meal.',
          },
        ],
      },
    ],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const parsed = JSON.parse(text.trim()) as MacroEstimate
  return parsed
}

export async function estimateMacrosFromText(
  description: string,
  apiKey: string
): Promise<MacroEstimate> {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    system: `You are a sports nutrition expert. Estimate macros from a meal description.
Return ONLY valid JSON in this exact format, no markdown, no explanation:
{"protein":0,"carbs":0,"fat":0,"calories":0,"notes":"brief reasoning"}
Values: protein/carbs/fat in grams (integers), calories in kcal (integer).`,
    messages: [
      {
        role: 'user',
        content: `Meal: ${description}\n\nEstimate the macros.`,
      },
    ],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  return JSON.parse(text.trim()) as MacroEstimate
}
