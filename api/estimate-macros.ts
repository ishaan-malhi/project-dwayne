import Anthropic from '@anthropic-ai/sdk'
import type { VercelRequest, VercelResponse } from '@vercel/node'

const MODEL = 'claude-haiku-4-5-20251001'

const SYSTEM_PROMPT = `You are a sports nutrition expert. Estimate macros accurately for a performance athlete on a body recomposition programme.
Return ONLY valid JSON — no markdown, no code fences, no explanation:
{"protein":0,"carbs":0,"fat":0,"calories":0,"notes":"one sentence reasoning"}
Values: protein/carbs/fat in grams (integers), calories in kcal (integer).
Err on the side of slightly higher estimates when portion size is uncertain.`

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  // Session gate — cookie set by /api/auth after biometric unlock
  const session = req.cookies?.['dwayne-session']
  if (!session || session !== process.env.SESSION_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'Not configured' })

  const { imageBase64, mimeType, description } = req.body as {
    imageBase64?: string
    mimeType?: string
    description?: string
  }

  if (!imageBase64 && !description) {
    return res.status(400).json({ error: 'Provide imageBase64 or description' })
  }

  try {
    const client = new Anthropic({ apiKey })

    const userContent: Anthropic.MessageParam['content'] = imageBase64
      ? [
          {
            type: 'image',
            source: { type: 'base64', media_type: (mimeType ?? 'image/jpeg') as 'image/jpeg', data: imageBase64 },
          },
          {
            type: 'text',
            text: description
              ? `Meal description: ${description}\n\nEstimate the macros for this meal.`
              : 'Estimate the macros for this meal.',
          },
        ]
      : `Meal: ${description}\n\nEstimate the macros.`

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 256,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userContent }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return res.status(502).json({ error: 'No JSON in model response' })

    const parsed = JSON.parse(jsonMatch[0])
    for (const f of ['protein', 'carbs', 'fat', 'calories'] as const) {
      if (typeof parsed[f] !== 'number' || isNaN(parsed[f])) {
        return res.status(502).json({ error: `Invalid field: ${f}` })
      }
    }

    return res.status(200).json(parsed)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return res.status(502).json({ error: msg })
  }
}
