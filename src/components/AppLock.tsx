import { useState, type FC, type ReactNode } from 'react'

const CRED_KEY = 'dwayne_app_cred_id'

async function requestBiometric(setUnlocked: () => void) {
  const available = await (
    PublicKeyCredential as {
      isUserVerifyingPlatformAuthenticatorAvailable?: () => Promise<boolean>
    }
  ).isUserVerifyingPlatformAuthenticatorAvailable?.() ?? false

  if (!available) {
    // Device doesn't support biometrics — let through
    await fetch('/api/auth', { method: 'POST' })
    setUnlocked()
    return
  }

  const storedId = localStorage.getItem(CRED_KEY)

  if (!storedId) {
    // First time — register a credential
    const cred = await navigator.credentials.create({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        rp: { name: 'Body', id: window.location.hostname },
        user: { id: new TextEncoder().encode('owner'), name: 'owner', displayName: 'Owner' },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },
          { alg: -257, type: 'public-key' },
        ],
        authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required' },
        timeout: 60000,
      },
    }) as PublicKeyCredential | null

    if (cred) {
      localStorage.setItem(CRED_KEY, btoa(String.fromCharCode(...new Uint8Array(cred.rawId))))
      await fetch('/api/auth', { method: 'POST' })
      setUnlocked()
    }
  } else {
    // Returning — verify existing credential
    const rawId = Uint8Array.from(atob(storedId), c => c.charCodeAt(0))
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        allowCredentials: [{ id: rawId, type: 'public-key' }],
        userVerification: 'required',
        timeout: 60000,
      },
    })
    if (assertion) {
      await fetch('/api/auth', { method: 'POST' })
      setUnlocked()
    }
  }
}

interface Props {
  children: ReactNode
}

const AppLock: FC<Props> = ({ children }) => {
  const [unlocked, setUnlocked] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | undefined>()

  const unlock = async () => {
    if (pending) return
    setPending(true)
    setError(undefined)
    try {
      await requestBiometric(() => setUnlocked(true))
    } catch (err) {
      // User cancelled or failed — stay locked, show hint
      const msg = err instanceof Error ? err.message : ''
      if (!msg.includes('cancelled') && !msg.includes('abort') && !msg.includes('NotAllowedError')) {
        setError('Authentication failed — try again.')
      }
    } finally {
      setPending(false)
    }
  }

  if (unlocked) return <>{children}</>

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: '#0a0a0a', zIndex: 100,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', gap: 12,
      }}
    >
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
        stroke="#6b6b6b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
      <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6b6b6b' }}>
        Body
      </span>
      {error && (
        <span style={{ fontSize: 11, color: '#ff4747', marginTop: 4 }}>{error}</span>
      )}
      <button
        onClick={unlock}
        disabled={pending}
        style={{
          marginTop: 8, padding: '12px 40px', borderRadius: 8,
          background: pending ? '#1c1c1c' : '#f0f0f0',
          color: pending ? '#6b6b6b' : '#0a0a0a',
          fontSize: 13, fontWeight: 600, border: 'none',
        }}
      >
        {pending ? 'Verifying…' : 'Unlock'}
      </button>
    </div>
  )
}

export default AppLock
