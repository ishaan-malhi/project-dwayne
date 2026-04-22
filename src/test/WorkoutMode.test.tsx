import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import WorkoutMode from '../components/WorkoutMode'
import type { SetLog } from '../types'

// Minimal exercise set — 2 exercises, 2 sets each, to keep tests fast
vi.mock('../data/sessions', () => ({
  STRENGTH_A: [
    { name: 'Squat', sets: 2, reps: '5', load: { phase1: '100kg', phase2: '110kg', phase3: '105kg' } },
    { name: 'Press', sets: 2, reps: '8', load: { phase1: '60kg', phase2: '65kg', phase3: '62.5kg' } },
  ],
  STRENGTH_B: [
    { name: 'Deadlift', sets: 2, reps: '5', load: { phase1: '120kg', phase2: '130kg', phase3: '125kg' } },
  ],
}))

vi.mock('../utils/plan', () => ({
  getPhaseForDate: () => 1,
  getLoadForPhase: (_ex: unknown, _phase: unknown) => '100kg',
}))

const baseProps = {
  open: true,
  onClose: vi.fn(),
  onLogSession: vi.fn(),
  dayType: 'STRENGTH_A' as const,
  date: '2026-04-22',
}

beforeEach(() => {
  vi.clearAllMocks()
  window.history.pushState = vi.fn()
  window.history.back = vi.fn()
})

describe('WorkoutMode — visibility', () => {
  it('renders when open', () => {
    render(<WorkoutMode {...baseProps} />)
    expect(screen.getByRole('dialog', { name: 'Workout mode' })).toBeInTheDocument()
  })

  it('returns null when closed', () => {
    render(<WorkoutMode {...baseProps} open={false} />)
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})

describe('WorkoutMode — back button', () => {
  it('close button calls onClose', () => {
    render(<WorkoutMode {...baseProps} />)
    fireEvent.click(screen.getByRole('button', { name: 'Close workout' }))
    expect(baseProps.onClose).toHaveBeenCalledOnce()
  })

  it('pushes a history state on open', () => {
    render(<WorkoutMode {...baseProps} />)
    expect(window.history.pushState).toHaveBeenCalledWith({ workoutMode: true }, '')
  })

  it('popstate event triggers onClose', () => {
    render(<WorkoutMode {...baseProps} />)
    fireEvent(window, new PopStateEvent('popstate'))
    expect(baseProps.onClose).toHaveBeenCalledOnce()
  })

  it('closing via UI button calls history.back to pop pushed state', () => {
    const { rerender } = render(<WorkoutMode {...baseProps} />)
    // Simulate history state being set by our pushState
    Object.defineProperty(window.history, 'state', { value: { workoutMode: true }, configurable: true })
    // Close via prop change (UI close path)
    rerender(<WorkoutMode {...baseProps} open={false} />)
    expect(window.history.back).toHaveBeenCalledOnce()
  })
})

describe('WorkoutMode — exercise display', () => {
  it('shows first exercise name and set counter', () => {
    render(<WorkoutMode {...baseProps} />)
    expect(screen.getByText('Squat')).toBeInTheDocument()
    expect(screen.getByText('Set 1 / 2')).toBeInTheDocument()
    expect(screen.getByText('1 / 2')).toBeInTheDocument() // exercise counter
  })

  it('shows load input in active phase', () => {
    render(<WorkoutMode {...baseProps} />)
    expect(screen.getByPlaceholderText('Load')).toBeInTheDocument()
    expect(screen.getByText('kg')).toBeInTheDocument()
  })
})

describe('WorkoutMode — set flow', () => {
  it('"Set Done" transitions to resting phase', () => {
    render(<WorkoutMode {...baseProps} />)
    fireEvent.click(screen.getByRole('button', { name: /Set Done/i }))
    expect(screen.getByRole('button', { name: /Skip Rest/i })).toBeInTheDocument()
    expect(screen.queryByPlaceholderText('Load')).toBeNull()
  })

  it('"Skip Rest" advances to next set within same exercise', () => {
    render(<WorkoutMode {...baseProps} />)
    fireEvent.click(screen.getByRole('button', { name: /Set Done/i }))
    fireEvent.click(screen.getByRole('button', { name: /Skip Rest/i }))
    expect(screen.getByText('Set 2 / 2')).toBeInTheDocument()
    expect(screen.getByText('Squat')).toBeInTheDocument()
  })

  it('advances to second exercise after last set of first', () => {
    render(<WorkoutMode {...baseProps} />)
    // Set 1 of Squat
    fireEvent.click(screen.getByRole('button', { name: /Set Done/i }))
    fireEvent.click(screen.getByRole('button', { name: /Skip Rest/i }))
    // Set 2 of Squat
    fireEvent.click(screen.getByRole('button', { name: /Set Done/i }))
    fireEvent.click(screen.getByRole('button', { name: /Skip Rest/i }))
    expect(screen.getByText('Press')).toBeInTheDocument()
    expect(screen.getByText('Set 1 / 2')).toBeInTheDocument()
  })
})

describe('WorkoutMode — completion', () => {
  function completeAllSets() {
    render(<WorkoutMode {...baseProps} />)
    // 2 exercises × 2 sets each = 4 sets
    for (let i = 0; i < 4; i++) {
      fireEvent.click(screen.getByRole('button', { name: /Set Done/i }))
      fireEvent.click(screen.getByRole('button', { name: /Skip Rest/i }))
    }
  }

  it('shows completion screen after all sets', () => {
    completeAllSets()
    expect(screen.getByRole('dialog', { name: 'Workout complete' })).toBeInTheDocument()
    expect(screen.getByText('Workout done')).toBeInTheDocument()
  })

  it('"Log Session" calls onLogSession with correct SetLog shape', () => {
    completeAllSets()
    fireEvent.click(screen.getByRole('button', { name: /Log Session/i }))
    expect(baseProps.onLogSession).toHaveBeenCalledOnce()
    const sets: SetLog[] = baseProps.onLogSession.mock.calls[0][0]
    // 2 exercises × 2 sets = 4 entries
    expect(sets).toHaveLength(4)
    expect(sets[0]).toMatchObject({ exerciseName: 'Squat', setIndex: 0 })
    expect(sets[2]).toMatchObject({ exerciseName: 'Press', setIndex: 0 })
  })

  it('"Log Session" includes entered load values', () => {
    render(<WorkoutMode {...baseProps} />)
    // Enter load for first set of Squat
    fireEvent.change(screen.getByPlaceholderText('Load'), { target: { value: '102.5' } })
    // Complete all sets
    for (let i = 0; i < 4; i++) {
      fireEvent.click(screen.getByRole('button', { name: /Set Done/i }))
      fireEvent.click(screen.getByRole('button', { name: /Skip Rest/i }))
    }
    fireEvent.click(screen.getByRole('button', { name: /Log Session/i }))
    const sets: SetLog[] = baseProps.onLogSession.mock.calls[0][0]
    expect(sets[0].actualLoad).toBe('102.5')
  })

  it('"Close" on completion screen calls onClose', () => {
    completeAllSets()
    fireEvent.click(screen.getByRole('button', { name: /^Close$/i }))
    expect(baseProps.onClose).toHaveBeenCalledOnce()
  })
})

describe('WorkoutMode — skip exercise', () => {
  it('skips to next exercise', () => {
    render(<WorkoutMode {...baseProps} />)
    fireEvent.click(screen.getByRole('button', { name: /Skip exercise/i }))
    expect(screen.getByText('Press')).toBeInTheDocument()
  })

  it('skipping last exercise triggers completion', () => {
    render(<WorkoutMode {...baseProps} />)
    // Skip straight to last exercise
    fireEvent.click(screen.getByRole('button', { name: /Skip exercise/i }))
    // Now on Press (last exercise), skip it
    fireEvent.click(screen.getByRole('button', { name: /Skip exercise/i }))
    expect(screen.getByRole('dialog', { name: 'Workout complete' })).toBeInTheDocument()
  })
})
