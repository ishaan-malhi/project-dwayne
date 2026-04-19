import type { MacroEstimate } from '../types'

async function callProxy(body: object): Promise<MacroEstimate> {
  const res = await fetch('/api/estimate-macros', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (res.status === 401) throw new Error('Session expired — unlock the app again.')
  if (!res.ok) {
    const data = await res.json().catch(() => ({})) as { error?: string }
    throw new Error(data.error ?? `Request failed (${res.status})`)
  }

  const data = await res.json() as MacroEstimate
  for (const f of ['protein', 'carbs', 'fat', 'calories'] as const) {
    if (typeof data[f] !== 'number' || isNaN(data[f])) throw new Error(`Invalid field: ${f}`)
  }
  return data
}

export function estimateMacros(
  imageBase64: string,
  mimeType: string,
  description: string,
): Promise<MacroEstimate> {
  return callProxy({ imageBase64, mimeType, description })
}

export function estimateMacrosFromText(description: string): Promise<MacroEstimate> {
  return callProxy({ description })
}
