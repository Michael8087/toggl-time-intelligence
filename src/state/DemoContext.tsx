import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from 'react'
import type {
  Commitment,
  EstimateModel,
  Interval,
  Phase,
  PlanChange,
  PlannedSlot,
  TimeEntry,
} from '../types'
import {
  COMMITMENTS,
  HERO_TASK,
  HERO_TASK_ID,
  SIMULATED_ENTRIES,
} from '../data/demo'
import { buildEstimate, type EstimateMode } from '../lib/estimate'
import {
  autoSchedule,
  availableWindows,
  earliestStartFor,
  totalHours,
  validateSchedule,
  type ScheduleCheck,
} from '../lib/scheduler'
import { DEMO_NOW, at, hoursBetween, iso, parse } from '../lib/time'

export type ThemePref = 'auto' | 'light' | 'dark'

interface State {
  phase: Phase
  estimateMode: EstimateMode
  /** The number the user actually committed to, which may differ from the suggestion. */
  acceptedHours: number | null
  slots: PlannedSlot[]
  /** How many of the simulated entries have been revealed. */
  revealed: number
  simRunning: boolean
  showNotes: boolean
  theme: ThemePref
  /** The task drawer, opened over the Tasks list. */
  drawerTaskId: string | null
  /** Which sub-view of the drawer's Time section is open. */
  timeView: 'summary' | 'planned' | 'logged'
  /** A detected divergence awaiting the user's decision. */
  activeChange: PlanChange | null
  /** Changes the user has already accepted. */
  appliedChanges: string[]
  /** Commitments added by an accepted change — the calendar is not static. */
  extraCommitments: Commitment[]
}

type Action =
  | { type: 'setPhase'; phase: Phase }
  | { type: 'setEstimateMode'; mode: EstimateMode }
  | { type: 'acceptEstimate'; hours: number }
  | { type: 'setSlots'; slots: PlannedSlot[] }
  | { type: 'updateSlot'; slot: PlannedSlot }
  | { type: 'removeSlot'; id: string }
  | { type: 'startSim' }
  | { type: 'pauseSim' }
  | { type: 'tickSim' }
  | { type: 'finishSim' }
  | { type: 'complete' }
  | { type: 'report' }
  | { type: 'toggleNotes' }
  | { type: 'setTheme'; theme: ThemePref }
  | { type: 'openDrawer'; taskId: string }
  | { type: 'closeDrawer' }
  | { type: 'setTimeView'; view: State['timeView'] }
  | { type: 'raiseChange'; change: PlanChange }
  | { type: 'dismissChange' }
  | { type: 'applyChange'; slots: PlannedSlot[]; commitments: Commitment[] }
  | { type: 'reset' }

const initialState: State = {
  phase: 'intake',
  estimateMode: 'newcomer',
  acceptedHours: null,
  slots: [],
  revealed: 0,
  simRunning: false,
  showNotes: false,
  theme: 'auto',
  drawerTaskId: null,
  timeView: 'summary',
  activeChange: null,
  appliedChanges: [],
  extraCommitments: [],
}

/** Pause the simulation here — mid-Tuesday, 6h 20m tracked against a 10h plan. */
const CHECKPOINT = 5

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'setPhase':
      return { ...state, phase: action.phase }
    case 'setEstimateMode':
      return { ...state, estimateMode: action.mode }
    case 'acceptEstimate':
      return { ...state, acceptedHours: action.hours, phase: 'capacity' }
    case 'setSlots':
      return { ...state, slots: action.slots }
    case 'updateSlot':
      return {
        ...state,
        slots: state.slots.map((s) => (s.id === action.slot.id ? action.slot : s)),
      }
    case 'removeSlot':
      return { ...state, slots: state.slots.filter((s) => s.id !== action.id) }
    case 'startSim':
      return { ...state, phase: 'working', simRunning: true }
    case 'pauseSim':
      return { ...state, simRunning: false }
    case 'tickSim': {
      const next = state.revealed + 1
      const hitCheckpoint = next === CHECKPOINT
      return {
        ...state,
        revealed: Math.min(next, SIMULATED_ENTRIES.length),
        simRunning: hitCheckpoint || next >= SIMULATED_ENTRIES.length ? false : state.simRunning,
      }
    }
    case 'finishSim':
      return { ...state, revealed: SIMULATED_ENTRIES.length, simRunning: false }
    case 'complete':
      return { ...state, phase: 'complete', revealed: SIMULATED_ENTRIES.length, simRunning: false }
    case 'report':
      return { ...state, phase: 'reported' }
    case 'toggleNotes':
      return { ...state, showNotes: !state.showNotes }
    case 'setTheme':
      return { ...state, theme: action.theme }
    case 'openDrawer':
      return { ...state, drawerTaskId: action.taskId, timeView: 'summary' }
    case 'closeDrawer':
      return { ...state, drawerTaskId: null }
    case 'setTimeView':
      return { ...state, timeView: action.view }
    case 'raiseChange':
      return { ...state, activeChange: action.change }
    case 'dismissChange':
      return { ...state, activeChange: null }
    case 'applyChange':
      return {
        ...state,
        slots: action.slots,
        extraCommitments: action.commitments,
        acceptedHours: state.activeChange?.revisedEstimate ?? state.acceptedHours,
        appliedChanges: state.activeChange
          ? [...state.appliedChanges, state.activeChange.id]
          : state.appliedChanges,
        activeChange: null,
      }
    case 'reset':
      return { ...initialState, showNotes: state.showNotes, theme: state.theme }
    default:
      return state
  }
}

interface DemoValue extends State {
  /** The suggested estimate for the current mode. */
  estimate: EstimateModel
  /** Hours the plan is built around: whatever the user accepted, else the suggestion. */
  planHours: number
  earliestStart: Date
  deadline: Date
  windows: Interval[]
  availableHours: number
  check: ScheduleCheck
  entries: TimeEntry[]
  trackedHours: number
  /** Every commitment currently on the calendar, including added ones. */
  commitments: Commitment[]
  /** Where the simulated clock has reached. */
  simNow: Date
  atCheckpoint: boolean
  simDone: boolean
  /** Progress through the story, 0–1, for the stepper. */
  stepIndex: number
  /** What `theme: 'auto'` currently resolves to. */
  resolvedTheme: 'light' | 'dark'

  raiseChange: (change: PlanChange) => void
  dismissChange: () => void
  acceptChange: () => void
  setTheme: (t: ThemePref) => void
  openDrawer: (taskId: string) => void
  closeDrawer: () => void
  setTimeView: (v: State['timeView']) => void
  setPhase: (p: Phase) => void
  setEstimateMode: (m: EstimateMode) => void
  acceptEstimate: (hours: number) => void
  generateSchedule: () => void
  setSlots: (slots: PlannedSlot[]) => void
  updateSlot: (slot: PlannedSlot) => void
  removeSlot: (id: string) => void
  confirmSchedule: () => void
  startSim: () => void
  pauseSim: () => void
  finishSim: () => void
  complete: () => void
  report: () => void
  toggleNotes: () => void
  reset: () => void
}

const DemoContext = createContext<DemoValue | null>(null)

const PHASE_ORDER: Phase[] = [
  'intake',
  'estimate',
  'capacity',
  'schedule',
  'scheduled',
  'working',
  'complete',
  'reported',
]

export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const timer = useRef<number | null>(null)

  const estimate = useMemo(
    () => buildEstimate(HERO_TASK, state.estimateMode),
    [state.estimateMode],
  )
  const planHours = state.acceptedHours ?? estimate.bestHours

  const earliestStart = useMemo(() => earliestStartFor(), [])
  const deadline = useMemo(() => parse(HERO_TASK.dueAt!), [])

  const commitments = useMemo(
    () => [...COMMITMENTS, ...state.extraCommitments],
    [state.extraCommitments],
  )

  const availabilityInput = useMemo(
    () => ({ commitments, earliestStart, deadline }),
    [commitments, earliestStart, deadline],
  )

  const windows = useMemo(() => availableWindows(availabilityInput), [availabilityInput])
  const availableHours = useMemo(() => totalHours(windows), [windows])

  const check = useMemo(
    () => validateSchedule(state.slots, planHours, availabilityInput),
    [state.slots, planHours, availabilityInput],
  )

  const entries = useMemo(
    () => SIMULATED_ENTRIES.slice(0, state.revealed),
    [state.revealed],
  )
  const trackedHours = useMemo(
    () => entries.reduce((sum, e) => sum + hoursBetween(parse(e.start), parse(e.end)), 0),
    [entries],
  )
  const simNow = entries.length ? parse(entries[entries.length - 1].end) : DEMO_NOW

  // Drive the tracking simulation.
  useEffect(() => {
    if (!state.simRunning) {
      if (timer.current) window.clearTimeout(timer.current)
      return
    }
    if (state.revealed >= SIMULATED_ENTRIES.length) return
    timer.current = window.setTimeout(() => dispatch({ type: 'tickSim' }), 1150)
    return () => {
      if (timer.current) window.clearTimeout(timer.current)
    }
  }, [state.simRunning, state.revealed])

  /* Time-aware theme: light through the working day, dark in the evening.
     An explicit choice always wins. */
  const resolvedTheme: 'light' | 'dark' =
    state.theme === 'auto'
      ? (() => {
          const h = new Date().getHours()
          return h >= 7 && h < 18 ? 'light' : 'dark'
        })()
      : state.theme

  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolvedTheme === 'dark')
  }, [resolvedTheme])

  /**
   * Apply the accepted adjustment. Each change knows what it does to the
   * calendar; the schedule is then re-derived from whatever capacity is left,
   * so the result is always something the scheduler would have produced itself.
   */
  const acceptChange = useCallback(() => {
    const change = state.activeChange
    if (!change) return

    const nextCommitments = [...state.extraCommitments]
    if (change.id === 'new-commitment') {
      nextCommitments.push({
        id: 'added-1',
        title: 'Infotainment design review',
        start: iso(at(1, 14)),
        end: iso(at(1, 15)),
        kind: 'meeting',
        projectId: HERO_TASK.projectId,
      })
    }

    const hours = change.revisedEstimate ?? planHours
    const merged = [...COMMITMENTS, ...nextCommitments]
    // Time already tracked stays put; only the remainder is re-planned.
    const fresh = availableWindows({
      commitments: merged,
      earliestStart: simNow,
      deadline,
    })
    const keep = state.slots.filter((s) => parse(s.end) <= simNow)
    const done = keep.reduce((sum, s) => sum + hoursBetween(parse(s.start), parse(s.end)), 0)
    const rescheduled = autoSchedule(fresh, Math.max(0, hours - done), HERO_TASK_ID)

    dispatch({
      type: 'applyChange',
      slots: [...keep, ...rescheduled.map((s, i) => ({ ...s, id: `slot-adj-${i}` }))],
      commitments: nextCommitments,
    })
  }, [state.activeChange, state.extraCommitments, state.slots, planHours, deadline])

  const generateSchedule = useCallback(() => {
    dispatch({ type: 'setSlots', slots: autoSchedule(windows, planHours, HERO_TASK_ID) })
    dispatch({ type: 'setPhase', phase: 'schedule' })
  }, [windows, planHours])

  const value: DemoValue = {
    ...state,
    estimate,
    planHours,
    earliestStart,
    deadline,
    windows,
    availableHours,
    check,
    entries,
    trackedHours,
    simNow,
    atCheckpoint: state.revealed === CHECKPOINT,
    simDone: state.revealed >= SIMULATED_ENTRIES.length,
    stepIndex: PHASE_ORDER.indexOf(state.phase),
    resolvedTheme,

    commitments,
    raiseChange: (change) => dispatch({ type: 'raiseChange', change }),
    dismissChange: () => dispatch({ type: 'dismissChange' }),
    acceptChange,
    setTheme: (theme) => dispatch({ type: 'setTheme', theme }),
    openDrawer: (taskId) => dispatch({ type: 'openDrawer', taskId }),
    closeDrawer: () => dispatch({ type: 'closeDrawer' }),
    setTimeView: (view) => dispatch({ type: 'setTimeView', view }),
    setPhase: (phase) => dispatch({ type: 'setPhase', phase }),
    setEstimateMode: (mode) => dispatch({ type: 'setEstimateMode', mode }),
    acceptEstimate: (hours) => dispatch({ type: 'acceptEstimate', hours }),
    generateSchedule,
    setSlots: (slots) => dispatch({ type: 'setSlots', slots }),
    updateSlot: (slot) => dispatch({ type: 'updateSlot', slot }),
    removeSlot: (id) => dispatch({ type: 'removeSlot', id }),
    confirmSchedule: () => dispatch({ type: 'setPhase', phase: 'scheduled' }),
    startSim: () => dispatch({ type: 'startSim' }),
    pauseSim: () => dispatch({ type: 'pauseSim' }),
    finishSim: () => dispatch({ type: 'finishSim' }),
    complete: () => dispatch({ type: 'complete' }),
    report: () => dispatch({ type: 'report' }),
    toggleNotes: () => dispatch({ type: 'toggleNotes' }),
    reset: () => dispatch({ type: 'reset' }),
  }

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useDemo(): DemoValue {
  const ctx = useContext(DemoContext)
  if (!ctx) throw new Error('useDemo must be used inside <DemoProvider>')
  return ctx
}
