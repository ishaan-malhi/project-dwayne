import Anthropic from '@anthropic-ai/sdk'
import type { MacroEstimate } from '../types'

const MODEL = 'claude-haiku-4-5-20251001'

const SYSTEM_PROMPT = `You are a sports nutrition expert. Estimate macros accurately for a performance athlete on a body recomposition programme.
Return ONLY valid JSON — no markdown, no code fences, no explanation:
{"protein":0,"carbs":0,"fat":0,"calories":0,"notes":"one sentence reasoning"}
Values: protein/carbs/fat in grams (integers), calories in kcal (integer).
Err on the side of slightly higher estimates when portion size is uncertain.`

function extractMacros(text: string): MacroEstimate {
  // Strip markdown code fences if present
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No JSON found in response')
  const parsed = JSON.parse(jsonMatch[0]) as MacroEstimate
  // Validate required numeric fields
  for (const field of ['protein', 'carbs', 'fat', 'calories'] as const) {
    if (typeof parsed[field] !== 'number' || isNaN(parsed[field])) {
      throw new Error(`Invalid value for ${field}`)
    }
  }
  return parsed
}

function classifyError(err: unknown): Error {
  if (err instanceof Anthropic.AuthenticationError) return new Error('Invalid API key — check Settings.')
  if (err instanceof Anthropic.RateLimitError) return new Error('Rate limit hit — wait a moment and try again.')
  if (err instanceof Anthropic.APIConnectionError) return new Error('No connection — check your network.')
  if (err instanceof Error) return err
  return new Error('Estimation failed — try again.')
}

export async function estimateMacros(
  imageBase64: string,
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif',
  description: string,
  apiKey: string
): Promise<MacroEstimate> {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })
  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mimeType, data: imageBase64 } },
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
    return extractMacros(text)
  } catch (err) {
    throw classifyError(err)
  }
}

export async function estimateMacrosFromText(
  description: string,
  apiKey: string
): Promise<MacroEstimate> {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })
  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: `Meal: ${description}\n\nEstimate the macros.` },
      ],
    })
    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    return extractMacros(text)
  } catch (err) {
    throw classifyError(err)
  }
}
