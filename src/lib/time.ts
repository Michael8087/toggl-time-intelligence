import type { Interval } from '../types'

/**
 * The prototype runs on a fixed week so every number in the demo is reproducible.
 * Monday 14 September 2026, 09:40 — the morning the new task lands.
 */
export const DEMO_NOW = new Date(2026, 8, 14, 9, 40, 0)

export const WORK_DAY_START = 9 // 09:00
export const WORK_DAY_END = 17 // 17:00

export const iso = (d: Date) => d.toISOString()
export const parse = (s: string) => new Date(s)

export function at(dayOffset: number, hour: number, minute = 0): Date {
  const d = new Date(DEMO_NOW)
  d.setDate(d.getDate() + dayOffset)
  d.setHours(hour, minute, 0, 0)
  return d
}

export const startOfDay = (d: Date) => {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

export const addDays = (d: Date, n: number) => {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

export const addMinutes = (d: Date, n: number) => new Date(d.getTime() + n * 60_000)

export const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

export const isWeekend = (d: Date) => d.getDay() === 0 || d.getDay() === 6

/** Hours between two instants, as a float. */
export const hoursBetween = (a: Date, b: Date) => (b.getTime() - a.getTime()) / 3_600_000

/** Position within the working day, in hours from WORK_DAY_START. */
export const dayOffsetHours = (d: Date) =>
  d.getHours() + d.getMinutes() / 60 - WORK_DAY_START

/** The Monday of the week containing `d`. */
export function weekStart(d: Date): Date {
  const x = startOfDay(d)
  const dow = x.getDay() // 0 Sun … 6 Sat
  const back = dow === 0 ? 6 : dow - 1
  return addDays(x, -back)
}

/** The five weekdays of the week containing `d`. */
export function weekDays(d: Date): Date[] {
  const mon = weekStart(d)
  return [0, 1, 2, 3, 4].map((i) => addDays(mon, i))
}

/** "9h 15m" — the way Toggl writes durations in report surfaces. */
export function formatDuration(hours: number, opts: { short?: boolean } = {}): string {
  const sign = hours < 0 ? '-' : ''
  const total = Math.round(Math.abs(hours) * 60)
  const h = Math.floor(total / 60)
  const m = total % 60
  if (h === 0) return `${sign}${m}m`
  if (m === 0) return `${sign}${h}h`
  return opts.short ? `${sign}${h}h ${m}m` : `${sign}${h}h ${m}m`
}

/** "09:15:00" — the way Toggl writes a running timer. */
export function formatClock(hours: number): string {
  const total = Math.round(Math.abs(hours) * 3600)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':')
}

export const formatTime = (d: Date) =>
  `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`

export const formatDayShort = (d: Date) =>
  d.toLocaleDateString('en-GB', { weekday: 'short' })

export const formatDayLong = (d: Date) =>
  d.toLocaleDateString('en-GB', { weekday: 'long' })

export const formatDate = (d: Date) =>
  d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

export const formatDayAndDate = (d: Date) =>
  `${formatDayLong(d)} ${d.getDate()} ${d.toLocaleDateString('en-GB', { month: 'short' })}`

export const formatRange = (a: Date, b: Date) => `${formatTime(a)}–${formatTime(b)}`

/** Intervals overlap if they share any positive-length span. */
export const overlaps = (a: Interval, b: Interval) =>
  a.start.getTime() < b.end.getTime() && b.start.getTime() < a.end.getTime()

/** Subtract a set of intervals from one interval, returning what remains. */
export function subtract(base: Interval, cuts: Interval[]): Interval[] {
  let pieces: Interval[] = [base]
  for (const cut of cuts) {
    const next: Interval[] = []
    for (const piece of pieces) {
      if (!overlaps(piece, cut)) {
        next.push(piece)
        continue
      }
      if (cut.start > piece.start) next.push({ start: piece.start, end: cut.start })
      if (cut.end < piece.end) next.push({ start: cut.end, end: piece.end })
    }
    pieces = next
  }
  return pieces.filter((p) => p.end > p.start)
}

/** Clamp an interval to a window; returns null if nothing is left. */
export function clamp(i: Interval, window: Interval): Interval | null {
  const start = i.start > window.start ? i.start : window.start
  const end = i.end < window.end ? i.end : window.end
  return end > start ? { start, end } : null
}

/** Round a date to the nearest `step` minutes. */
export function snap(d: Date, step = 15): Date {
  const x = new Date(d)
  const mins = x.getHours() * 60 + x.getMinutes()
  const snapped = Math.round(mins / step) * step
  x.setHours(0, snapped, 0, 0)
  return x
}
