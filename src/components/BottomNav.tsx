import type { FC, ReactElement } from 'react'

export type Tab = 'today' | 'food' | 'profile'

interface Props {
  active: Tab
  onChange: (tab: Tab) => void
}

const TABS: Array<{ id: Tab; label: string; icon: (active: boolean) => ReactElement }> = [
  {
    id: 'today',
    label: 'Today',
    icon: (active) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
  },
  {
    id: 'food',
    label: 'Food',
    icon: (active) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 3v6a2 2 0 0 0 4 0V3"/>
        <line x1="7" y1="9" x2="7" y2="21"/>
        <path d="M15 3h4v7a2 2 0 0 1-2 2h-2V3z"/>
        <line x1="17" y1="12" x2="17" y2="21"/>
      </svg>
    ),
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: (active) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  },
]

const BottomNav: FC<Props> = ({ active, onChange }) => {
  return (
    <nav
      style={{ background: '#0a0a0a', borderTop: '1px solid #222222' }}
      className="flex items-stretch"
      role="tablist"
    >
      {TABS.map(tab => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={active === tab.id}
          aria-label={tab.label}
          onClick={() => onChange(tab.id)}
          className="flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-colors duration-100"
          style={{
            color: active === tab.id ? '#f0f0f0' : '#6b6b6b',
            background: 'transparent',
            border: 'none',
            minHeight: 56,
          }}
        >
          {tab.icon(active === tab.id)}
          <span style={{ fontSize: 10, fontWeight: active === tab.id ? 600 : 400, letterSpacing: '0.05em' }}>
            {tab.label}
          </span>
        </button>
      ))}
    </nav>
  )
}

export default BottomNav
