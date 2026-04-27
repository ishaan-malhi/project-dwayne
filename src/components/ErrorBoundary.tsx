import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { error: Error | null }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: 32, gap: 16, background: '#0a0a0a',
        }}>
          <span style={{ fontSize: 32 }}>⚠</span>
          <p style={{ fontSize: 13, color: '#999', textAlign: 'center', lineHeight: 1.6 }}>
            Something went wrong rendering this page.
          </p>
          <p style={{ fontSize: 11, color: '#444', fontFamily: 'JetBrains Mono, monospace',
            textAlign: 'center', maxWidth: 280, wordBreak: 'break-all' }}>
            {this.state.error.message}
          </p>
          <button
            onClick={() => this.setState({ error: null })}
            style={{ padding: '10px 24px', borderRadius: 8, background: '#1c1c1c',
              border: '1px solid #2e2e2e', color: '#f0f0f0', fontSize: 13 }}
          >
            Retry
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
