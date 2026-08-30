import type { Commitment, Interval, PlannedSlot } from '../types'
import {
  DEMO_NOW,
  WORK_DAY_END,
  WORK_DAY_START,
  addDays,
  clamp,
  hoursBetween,
  isWeekend,
  iso,
  parse,
  startOfDay,
  subtract,
} from './time'

const MIN_BLOCK_HOURS = 1
const MAX_BLOCK_HOURS = 6

export interface AvailabilityInput {
  commitments: Commitment[]
  /** Nothing can be scheduled before this. */
  earliestStart: Date
  /** Nothing can run past this. */
  deadline: Date
  /** Slots already planned for this task, so they don't block themselves. */
  ignoreSlotIds?: string[]
}

/** Working hours for one day, or null at the weekend. */
export function workingWindow(day: Date): Interval | null {
  if (isWeekend(day)) return null
  const start = startOfDay(day)
  start.setHours(WORK_DAY_START, 0, 0, 0)
  const end = startOfDay(day)
  end.setHours(WORK_DAY_END, 0, 0, 0)
  return { start, end }
}

/**
 * What is genuinely free between the earliest possible start and the deadline.
 * This is the number the capacity check reports, and the space the scheduler fills.
 */
export function availableWindows({
  commitments,
  earliestStart,
  deadline,
}: AvailabilityInput): Interval[] {
  const busy: Interval[] = commitments.map((c) => ({ start: parse(c.start), end: parse(c.end) }))
  const bounds: Interval = { start: earliestStart, end: deadline }
  const out: Interval[] = []

  let cursor = startOfDay(earliestStart)
  const last = startOfDay(deadline)
  let guard = 0
  while (cursor <= last && guard++ < 60) {
    const window = workingWindow(cursor)
    if (window) {
      const bounded = clamp(window, bounds)
      if (bounded) {
        for (const free of subtract(bounded, busy)) {
          if (hoursBetween(free.start, free.end) >= 0.5) out.push(free)
        }
      }
    }
    cursor = addDays(cursor, 1)
  }
  return out
}

export const totalHours = (windows: Interval[]) =>
  windows.reduce((sum, w) => sum + hoursBetween(w.start, w.end), 0)

/**
 * Fill the earliest available windows first, in blocks no longer than
 * MAX_BLOCK_HOURS and no shorter than MIN_BLOCK_HOURS.
 *
 * Deliberately simple and predictable: the user has to be able to look at the
 * result and see why it landed where it did. A cleverer optimiser that
 * produced a schedule nobody could explain would be worse.
 */
export function autoSchedule(
  windows: Interval[],
  hoursNeeded: number,
  taskId: string,
): PlannedSlot[] {
  const slots: PlannedSlot[] = []
  let remaining = hoursNeeded
  let n = 0

  for (const window of windows) {
    if (remaining <= 0.01) break
    const windowHours = hoursBetween(window.start, window.end)
    const take = Math.min(remaining, windowHours, MAX_BLOCK_HOURS)
    if (take < MIN_BLOCK_HOURS && remaining > windowHours) continue // skip scraps
    const end = new Date(window.start.getTime() + take * 3_600_000)
    slots.push({
      id: `slot-${taskId}-${n++}`,
      taskId,
      start: iso(window.start),
      end: iso(end),
    })
    remaining -= take
  }

  return slots
}

export interface ScheduleIssue {
  level: 'error' | 'warning'
  message: string
}

export interface ScheduleCheck {
  scheduledHours: number
  issues: ScheduleIssue[]
  ok: boolean
}

/**
 * Re-validate after the user drags a block around. Runs on every edit, so the
 * schedule is never quietly wrong.
 */
export function validateSchedule(
  slots: PlannedSlot[],
  estimateHours: number,
  { commitments, earliestStart, deadline }: AvailabilityInput,
): ScheduleCheck {
  const issues: ScheduleIssue[] = []
  const busy = commitments.map((c) => ({ ...c, s: parse(c.start), e: parse(c.end) }))
  const scheduledHours = slots.reduce(
    (sum, s) => sum + hoursBetween(parse(s.start), parse(s.end)),
    0,
  )

  for (const slot of slots) {
    const s = parse(slot.start)
    const e = parse(slot.end)

    const conflict = busy.find((b) => s < b.e && b.s < e)
    if (conflict) {
      issues.push({ level: 'error', message: `Overlaps “${conflict.title}”.` })
    }
    if (e > deadline) {
      issues.push({ level: 'error', message: 'Runs past the Wednesday 17:00 deadline.' })
    }
    if (s < earliestStart) {
      issues.push({ level: 'error', message: 'Starts in the past.' })
    }
    if (s.getHours() < WORK_DAY_START || e.getHours() > WORK_DAY_END || isWeekend(s)) {
      issues.push({ level: 'warning', message: 'Falls outside your working hours.' })
    }
  }

  const gap = estimateHours - scheduledHours
  if (gap > 0.01) {
    issues.push({
      level: 'warning',
      message: `${gap.toFixed(2).replace(/\.?0+$/, '')}h of the estimate is still unscheduled.`,
    })
  } else if (gap < -0.01) {
    issues.push({
      level: 'warning',
      message: `Scheduled ${Math.abs(gap).toFixed(2).replace(/\.?0+$/, '')}h more than the estimate.`,
    })
  }

  const deduped = issues.filter(
    (issue, i) => issues.findIndex((o) => o.message === issue.message) === i,
  )

  return {
    scheduledHours,
    issues: deduped,
    ok: !deduped.some((i) => i.level === 'error') && Math.abs(gap) < 0.01,
  }
}

/**
 * The earliest moment work can begin. Without a dependency model this is simply
 * now — what actually shapes the plan is the calendar, which the availability
 * calculation already accounts for.
 */
export function earliestStartFor(): Date {
  return DEMO_NOW
}
