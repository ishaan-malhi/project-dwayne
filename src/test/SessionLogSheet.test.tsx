import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import SessionLogSheet from '../components/SessionLogSheet'

vi.mock('../data/sessions', () => ({
  STRENGTH_A: [
    { name: 'Squat', sets: 3, reps: '5', load: { phase1: '100kg', phase2: '110kg', phase3: '105kg' } },
    { name: 'Press', sets: 3, reps: '8', load: { phase1: '60kg', phase2: '65kg', phase3: '62.5kg' } },
  ],
  STRENGTH_B: [],
  VO2_PARAMS: { duration: '28min', hrTarget: '90–95% HRmax', notes: null },
  ZONE2_PARAMS: { duration: '45min', hrTarget: '135–145bpm', notes: null },
}))

vi.mock('../utils/plan', () => ({
  getDayType: () => 'STRENGTH_A',
  getPhaseForDate: () => 1,
  getLoadForPhase: () => '100kg',
}))

const mockLogSession = vi.fn()
vi.mock('../store/sessionStore', () => ({
  useSessionStore: () => ({
    logSession: mockLogSession,
    getLog: () => null,
  }),
}))

// Sheet just renders children
vi.mock('./Sheet', () => ({
  default: ({ open, children }: { open: boolean; children: React.ReactNode }) =>
    open ? <div data-testid="sheet">{children}</div> : null,
}))

const baseProps = {
  open: true,
  onClose: vi.fn(),
  date: '2026-04-22',
}

beforeEach(() => vi.clearAllMocks())

describe('SessionLogSheet — summary rows (default)', () => {
  it('renders one row per exercise', () => {
    render(<SessionLogSheet {...baseProps} />)
    expect(screen.getByText('Squat')).toBeInTheDocument()
    expect(screen.getByText('Press')).toBeInTheDocument()
  })

  it('shows Load, Reps, Sets, RPE column labels', () => {
    render(<SessionLogSheet {...baseProps} />)
    // Each exercise has these labels - check at least one set
    const loadLabels = screen.getAllByText('Load')
    const repsLabels = screen.getAllByText('Reps')
    expect(loadLabels.length).toBeGreaterThanOrEqual(1)
    expect(repsLabels.length).toBeGreaterThanOrEqual(1)
  })

  it('shows set count as read-only value', () => {
    render(<SessionLogSheet {...baseProps} />)
    // Both exercises have sets=3, should appear twice
    const setValues = screen.getAllByText('3')
    expect(setValues.length).toBeGreaterThanOrEqual(2)
  })

  it('does not show per-set numbered rows by default', () => {
    render(<SessionLogSheet {...baseProps} />)
    // Per-set rows have set numbers 1, 2, 3 as spans
    // In summary mode there should be no "1" as a set label
    expect(screen.queryByText(/^1$/, { selector: 'span' })).toBeNull()
  })
})

describe('SessionLogSheet — expand per-set', () => {
  it('expand button exists for each exercise', () => {
    render(<SessionLogSheet {...baseProps} />)
    const expandBtns = screen.getAllByRole('button', { name: /Expand per-set/i })
    expect(expandBtns).toHaveLength(2)
  })

  it('clicking expand shows per-set rows', () => {
    render(<SessionLogSheet {...baseProps} />)
    const [expandBtn] = screen.getAllByRole('button', { name: /Expand per-set/i })
    fireEvent.click(expandBtn)
    // Per-set load inputs appear (not present in summary mode)
    const perSetLoadInputs = screen.getAllByPlaceholderText('Load')
    expect(perSetLoadInputs.length).toBe(3) // 3 sets for Squat
    const perSetRepsInputs = screen.getAllByPlaceholderText('Reps')
    expect(perSetRepsInputs.length).toBe(3)
  })

  it('clicking expand again collapses per-set rows', () => {
    render(<SessionLogSheet {...baseProps} />)
    const [expandBtn] = screen.getAllByRole('button', { name: /Expand per-set/i })
    fireEvent.click(expandBtn)
    fireEvent.click(screen.getByRole('button', { name: /Collapse per-set/i }))
    expect(screen.queryByText(/^1$/, { selector: 'span' })).toBeNull()
  })
})

describe('SessionLogSheet — prefillSets', () => {
  it('pre-populates load from prefillSets', () => {
    const prefillSets = [
      { exerciseName: 'Squat', setIndex: 0, actualLoad: '97.5', reps: 5 },
      { exerciseName: 'Squat', setIndex: 1, actualLoad: '97.5', reps: 5 },
      { exerciseName: 'Squat', setIndex: 2, actualLoad: '97.5', reps: 5 },
    ]
    render(<SessionLogSheet {...baseProps} prefillSets={prefillSets} />)
    // The load input for Squat should be pre-filled with '97.5'
    const loadInputs = screen.getAllByPlaceholderText('—')
    // First load input (Squat) should have value 97.5
    expect((loadInputs[0] as HTMLInputElement).value).toBe('97.5')
  })
})

describe('SessionLogSheet — save (summary mode)', () => {
  it('Complete Session calls logSession with N sets per exercise', () => {
    render(<SessionLogSheet {...baseProps} />)
    // Fill in Squat summary row
    const loadInputs = screen.getAllByPlaceholderText('—')
    fireEvent.change(loadInputs[0], { target: { value: '100' } }) // Squat load
    const repsInputs = screen.getAllByPlaceholderText('—')
    // reps input is second in the grid — index 1 for Squat
    fireEvent.change(repsInputs[1], { target: { value: '5' } }) // Squat reps

    fireEvent.click(screen.getByRole('button', { name: /Complete Session/i }))

    expect(mockLogSession).toHaveBeenCalledOnce()
    const [, log] = mockLogSession.mock.calls[0]
    // Squat has 3 sets, Press has 3 sets = 6 total
    expect(log.sets).toHaveLength(6)
    expect(log.completed).toBe(true)
    expect(log.sets[0]).toMatchObject({ exerciseName: 'Squat', setIndex: 0, actualLoad: '100', reps: 5 })
    expect(log.sets[1]).toMatchObject({ exerciseName: 'Squat', setIndex: 1, actualLoad: '100', reps: 5 })
    expect(log.sets[2]).toMatchObject({ exerciseName: 'Squat', setIndex: 2, actualLoad: '100', reps: 5 })
  })

  it('Complete Session uses per-set data when expanded', () => {
    render(<SessionLogSheet {...baseProps} />)
    // Expand Squat
    const [expandBtn] = screen.getAllByRole('button', { name: /Expand per-set/i })
    fireEvent.click(expandBtn)
    // Fill set 1 load
    const perSetLoadInputs = screen.getAllByPlaceholderText('Load')
    fireEvent.change(perSetLoadInputs[0], { target: { value: '105' } })

    fireEvent.click(screen.getByRole('button', { name: /Complete Session/i }))

    const [, log] = mockLogSession.mock.calls[0]
    expect(log.sets[0]).toMatchObject({ exerciseName: 'Squat', setIndex: 0, actualLoad: '105' })
  })

  it('RPE is included in sets when entered', () => {
    render(<SessionLogSheet {...baseProps} />)
    // placeholder "—" inputs per exercise: Load(0), Reps(1), RPE(2) for Squat; Load(3), Reps(4), RPE(5) for Press
    const dashInputs = screen.getAllByPlaceholderText('—')
    fireEvent.change(dashInputs[2], { target: { value: '8' } }) // Squat RPE

    fireEvent.click(screen.getByRole('button', { name: /Complete Session/i }))

    const [, log] = mockLogSession.mock.calls[0]
    expect(log.sets[0].rpe).toBe(8)
  })
})

describe('SessionLogSheet — closed', () => {
  it('renders nothing when open=false', () => {
    render(<SessionLogSheet {...baseProps} open={false} />)
    expect(screen.queryByTestId('sheet')).toBeNull()
  })
})
