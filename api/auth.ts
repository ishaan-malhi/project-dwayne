import type { VercelRequest, VercelResponse } from '@vercel/node'

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const secret = process.env.SESSION_SECRET
  if (!secret) return res.status(500).end()
  // No Max-Age = session cookie — expires when browser closes
  res.setHeader('Set-Cookie', `dwayne-session=${secret}; HttpOnly; Secure; SameSite=Strict; Path=/api`)
  return res.status(204).end()
}
