export type TaskStatus =
  | 'unplanned' // just landed in the user's queue
  | 'planned' // estimated + scheduled
  | 'in_progress'
  | 'done'

export interface Task {
  id: string
  ref: string // e.g. INF-241
  title: string
  description: string
  projectId: string
  status: TaskStatus
  /** Hours. Present once an estimate has been accepted. */
  estimateHours?: number
  /** Hours actually tracked. */
  trackedHours?: number
  dueAt?: string // ISO
  assignee: string
  tags: string[]
  /** Completed reference work used to build estimates. */
  history?: { estimateHours: number; actualHours: number; completedAt: string }
}

export interface Project {
  id: string
  name: string
  client: string
  color: string
  billable: boolean
  rate: number
  currency: string
  via: string // talent platform
}

/** A block of the user's week that is already spoken for. */
export interface Commitment {
  id: string
  title: string
  start: string // ISO
  end: string // ISO
  kind: 'task' | 'meeting' | 'personal'
  projectId?: string
  /** Upstream dependency work — highlighted during the capacity check. */
  isDependencyWork?: boolean
}

/** A planned block of work created by the scheduler (or edited by the user). */
export interface PlannedSlot {
  id: string
  taskId: string
  start: string // ISO
  end: string // ISO
}

/** A recorded time entry — in this prototype, produced by simulated automatic tracking. */
export interface TimeEntry {
  id: string
  taskId: string
  start: string // ISO
  end: string // ISO
  /** What the automatic tracker inferred the user was doing. */
  activity: string
  source: 'auto' | 'manual'
}

/**
 * A detected divergence between the plan and reality.
 *
 * Deliberately not a dependency graph: every trigger here is something Toggl
 * can observe on its own — tracked pace, a calendar that moved, a task that was
 * edited — rather than a relationship the user had to declare up front.
 */
export interface PlanChange {
  id: string
  /** Short name for the control that triggers it in the demo. */
  option: string
  /** What Toggl noticed. */
  signal: string
  detail: string
  evidence: string[]
  /** What it means for the current plan. */
  impact: string
  /** The proposed fix, in plain language. */
  suggestion: string
  /** Hours the estimate becomes, if the change revises it. */
  revisedEstimate?: number
}

export interface EstimateFactor {
  id: string
  label: string
  /** Hours this factor adds to (or removes from) the baseline. Baseline itself uses `baseline: true`. */
  hours: number
  baseline?: boolean
  detail: string
  evidence?: string[]
}

export interface EstimateModel {
  lowHours: number
  bestHours: number
  highHours: number
  confidence: 'Low' | 'Medium' | 'High'
  summary: string
  factors: EstimateFactor[]
  /** Where the estimate's signal comes from, as weights that sum to 100. */
  sources: { label: string; weight: number; note: string }[]
  caveat?: string
}

export type Phase =
  | 'intake'
  | 'estimate'
  | 'capacity'
  | 'schedule'
  | 'scheduled'
  | 'working'
  | 'complete'
  | 'reported'

export interface Interval {
  start: Date
  end: Date
}
