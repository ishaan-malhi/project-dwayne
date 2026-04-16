import { type FC, type ReactNode, useEffect } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

const Sheet: FC<Props> = ({ open, onClose, title, children }) => {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#141414',
          borderTop: '1px solid #222222',
          borderRadius: '12px 12px 0 0',
          maxHeight: '90dvh',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div style={{ width: 36, height: 4, borderRadius: 2, background: '#333' }} />
        </div>
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 pb-3"
          style={{ borderBottom: '1px solid #222222' }}
        >
          <span style={{ fontSize: 15, fontWeight: 600, color: '#f0f0f0' }}>{title}</span>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ color: '#6b6b6b', background: 'none', border: 'none', padding: 4, fontSize: 20, lineHeight: 1 }}
          >
            ×
          </button>
        </div>
        {/* Content */}
        <div className="overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  )
}

export default Sheet
