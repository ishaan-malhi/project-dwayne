import { useState } from 'react'
import BottomNav, { type Tab } from './components/BottomNav'
import Today from './pages/Today'
import Food from './pages/Food'
import Profile from './pages/Profile'
import Logs from './pages/Logs'

function App() {
  const [tab, setTab] = useState<Tab>('today')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0a0a0a' }}>
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {tab === 'today' && <Today />}
        {tab === 'food' && <Food />}
        {tab === 'log' && <Logs />}
        {tab === 'profile' && <Profile />}
      </div>
      <BottomNav active={tab} onChange={setTab} />
    </div>
  )
}

export default App
