import clsx from 'clsx'
import { useRef, useState } from 'react'
import { CalendarClock, DollarSign, Flag, Timer as TimerIcon } from 'lucide-react'
import type { Commitment, Interval, PlannedSlot, TimeEntry } from '../types'
import { PROJECTS } from '../data/demo'
import {
  addMinutes,
  formatDayShort,
  formatDuration,
  formatRange,
  formatTime,
  hoursBetween,
  iso,
  parse,
  sameDay,
} from '../lib/time'

const VIEW_START = 8
const VIEW_END = 19
const HOUR_H = 46
const GUTTER = 66
const SNAP_MIN = 15

const hoursOf = (d: Date) => d.getHours() + d.getMinutes() / 60
const yOf = (d: Date) => (hoursOf(d) - VIEW_START) * HOUR_H
const hOf = (a: Date, b: Date) => Math.max(15, hoursBetween(a, b) * HOUR_H)

const hourLabel = (h: number) => {
  const period = h < 12 ? 'AM' : 'PM'
  const display = h % 12 === 0 ? 12 : h % 12
  return `${display}:00 ${period}`
}

/** Project fills, mapped onto the theme-aware entry tokens. */
const FILL: Record<string, string> = {
  'skoda-infotainment': 'bg-e-pink',
  'bosch-sensor': 'bg-e-blue',
  internal: 'bg-e-yellow',
}

interface DragState {
  slotId: string
  mode: 'move' | 'resize'
  startX: number
  startY: number
  originStart: Date
  originEnd: Date
  dy: number
  dayShift: number
}

export interface WeekCalendarProps {
  days: Date[]
  commitments?: Commitment[]
  /** Free capacity to hatch in — shown during the capacity check. */
  windows?: Interval[]
  slots?: PlannedSlot[]
  entries?: TimeEntry[]
  editable?: boolean
  deadline?: Date
  now?: Date
  /**
   * 'split'    — logged left, planned right, as Toggl 2.0's split view does.
   * 'calendar' — logged dominant, planned as a ribbon.
   * 'plan'     — planning only, so planned takes the whole column.
   */
  mode?: 'split' | 'calendar' | 'plan'
  dimPastDeadline?: boolean
  onChangeSlot?: (slot: PlannedSlot) => void
  slotLabel?: string
  className?: string
}

export function WeekCalendar({
  days,
  commitments = [],
  windows = [],
  slots = [],
  entries = [],
  editable = false,
  deadline,
  now,
  mode = 'split',
  dimPastDeadline = false,
  onChangeSlot,
  slotLabel = 'Implement navigation component',
  className,
}: WeekCalendarProps) {
  const gridRef = useRef<HTMLDivElement>(null)
  const [drag, setDrag] = useState<DragState | null>(null)
  const hours = Array.from({ length: VIEW_END - VIEW_START + 1 }, (_, i) => VIEW_START + i)
  const bodyH = (VIEW_END - VIEW_START) * HOUR_H

  // Lane geometry.
  const loggedLane =
    mode === 'split'
      ? { left: '0%', width: '50%' }
      : mode === 'calendar'
        ? { left: '0%', width: '68%' }
        : { left: '0%', width: '100%' }
  const plannedLane =
    mode === 'split'
      ? { left: '50%', width: '50%' }
      : mode === 'calendar'
        ? { left: '68%', width: '32%' }
        : { left: '0%', width: '100%' }

  const colWidth = () => {
    const el = gridRef.current
    if (!el) return 1
    return (el.clientWidth - GUTTER) / days.length
  }

  function resolve(slot: PlannedSlot): { start: Date; end: Date } {
    const start = parse(slot.start)
    const end = parse(slot.end)
    if (!drag || drag.slotId !== slot.id) return { start, end }

    const minutes = Math.round(drag.dy / HOUR_H / (SNAP_MIN / 60)) * SNAP_MIN
    if (drag.mode === 'resize') {
      const nextEnd = addMinutes(drag.originEnd, minutes)
      const minEnd = addMinutes(start, 30)
      return { start, end: nextEnd < minEnd ? minEnd : nextEnd }
    }
    const dur = hoursBetween(drag.originStart, drag.originEnd)
    const nextStart = addMinutes(drag.originStart, minutes)
    nextStart.setDate(nextStart.getDate() + drag.dayShift)
    const maxStartHour = VIEW_END - dur
    if (hoursOf(nextStart) < VIEW_START) nextStart.setHours(VIEW_START, 0, 0, 0)
    if (hoursOf(nextStart) > maxStartHour) {
      nextStart.setHours(Math.floor(maxStartHour), Math.round((maxStartHour % 1) * 60), 0, 0)
    }
    return { start: nextStart, end: new Date(nextStart.getTime() + dur * 3_600_000) }
  }

  function beginDrag(e: React.PointerEvent, slot: PlannedSlot, mode: 'move' | 'resize') {
    if (!editable) return
    e.preventDefault()
    e.stopPropagation()
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    setDrag({
      slotId: slot.id,
      mode,
      startX: e.clientX,
      startY: e.clientY,
      originStart: parse(slot.start),
      originEnd: parse(slot.end),
      dy: 0,
      dayShift: 0,
    })
  }

  function moveDrag(e: React.PointerEvent) {
    if (!drag) return
    const dx = e.clientX - drag.startX
    const dy = e.clientY - drag.startY
    const shift = drag.mode === 'move' ? Math.round(dx / colWidth()) : 0
    const originIndex = days.findIndex((d) => sameDay(d, drag.originStart))
    const bounded = Math.max(-originIndex, Math.min(days.length - 1 - originIndex, shift))
    setDrag({ ...drag, dy, dayShift: bounded })
  }

  function endDrag() {
    if (!drag) return
    const slot = slots.find((s) => s.id === drag.slotId)
    if (slot && onChangeSlot) {
      const { start, end } = resolve(slot)
      onChangeSlot({ ...slot, start: iso(start), end: iso(end) })
    }
    setDrag(null)
  }

  /** Per-day totals, the way Track prints them under each weekday. */
  const totals = (day: Date) => {
    const logged = entries
      .filter((e) => sameDay(parse(e.start), day))
      .reduce((s, e) => s + hoursBetween(parse(e.start), parse(e.end)), 0)
    const planned =
      commitments
        .filter((c) => sameDay(parse(c.start), day))
        .reduce((s, c) => s + hoursBetween(parse(c.start), parse(c.end)), 0) +
      slots
        .filter((s) => sameDay(parse(s.start), day))
        .reduce((sum, s) => sum + hoursBetween(parse(s.start), parse(s.end)), 0)
    return { logged, planned }
  }

  return (
    <div className={clsx('select-none bg-canvas', className)}>
      {/* Day headers */}
      <div className="flex border-b border-hairline" style={{ paddingLeft: GUTTER }}>
        {days.map((d) => {
          const isToday = now ? sameDay(d, now) : false
          const past = deadline ? d > deadline && !sameDay(d, deadline) : false
          const { logged, planned } = totals(d)
          return (
            <div
              key={d.toISOString()}
              className={clsx(
                'flex-1 border-l border-hairline px-2 py-2',
                past && dimPastDeadline && 'opacity-45',
              )}
            >
              <div className="flex items-baseline gap-1.5">
                <span
                  className={clsx(
                    'font-display text-lg font-semibold leading-none',
                    isToday ? 'text-pink' : 'text-lo',
                  )}
                >
                  {d.getDate()}
                </span>
                <span
                  className={clsx(
                    'font-display text-[13px] font-semibold',
                    isToday ? 'text-pink' : 'text-hi',
                  )}
                >
                  {formatDayShort(d)}
                </span>
              </div>
              <div className="tnum mt-0.5 text-2xs font-medium text-pink">
                {logged > 0 ? formatDuration(logged) : '–'}
                <span className="text-lo"> / {planned > 0 ? formatDuration(planned) : '–'}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Grid */}
      <div
        ref={gridRef}
        className="relative"
        style={{ height: bodyH }}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        {hours.map((h) => (
          <div
            key={h}
            className="pointer-events-none absolute left-0 right-0 border-t border-hairline"
            style={{ top: (h - VIEW_START) * HOUR_H }}
          >
            <span className="absolute -top-2 left-0 w-[54px] text-right text-2xs tabular-nums text-lo">
              {hourLabel(h)}
            </span>
          </div>
        ))}

        <div className="absolute inset-0 flex" style={{ paddingLeft: GUTTER }}>
          {days.map((day) => {
            const past = deadline ? day > deadline && !sameDay(day, deadline) : false
            return (
              <div
                key={day.toISOString()}
                className={clsx(
                  'relative flex-1 border-l border-hairline',
                  past && dimPastDeadline && 'bg-surface/60',
                )}
              >
                {/* The planned lane sits on a faint tint, as in the app. */}
                {mode === 'split' && (
                  <div
                    className="pointer-events-none absolute inset-y-0 bg-surface/70"
                    style={plannedLane}
                  />
                )}

                {/* Outside working hours */}
                <div
                  className="pointer-events-none absolute inset-x-0 bg-surface/60"
                  style={{ top: 0, height: (9 - VIEW_START) * HOUR_H }}
                />
                <div
                  className="pointer-events-none absolute inset-x-0 bg-surface/60"
                  style={{ top: (17 - VIEW_START) * HOUR_H, bottom: 0 }}
                />

                {/* Free capacity */}
                {windows
                  .filter((w) => sameDay(w.start, day))
                  .map((w, k) => (
                    <div
                      key={k}
                      className="hatch-free pointer-events-none absolute inset-x-px rounded border border-ok/30"
                      style={{ top: yOf(w.start), height: hOf(w.start, w.end) }}
                    >
                      <span className="absolute bottom-0.5 right-1 font-display text-2xs font-semibold text-ok">
                        {formatDuration(hoursBetween(w.start, w.end))} free
                      </span>
                    </div>
                  ))}

                {/* Existing commitments — planned lane */}
                {commitments
                  .filter((c) => sameDay(parse(c.start), day))
                  .map((c) => {
                    const s = parse(c.start)
                    const e = parse(c.end)
                    const project = PROJECTS.find((p) => p.id === c.projectId)
                    return (
                      <div
                        key={c.id}
                        className={clsx(
                          'entry-planned absolute overflow-hidden rounded px-1.5 py-1',
                          c.isDependencyWork && 'ring-1 ring-warn',
                        )}
                        style={{ ...plannedLane, top: yOf(s), height: hOf(s, e) }}
                        title={`${c.title} · ${formatRange(s, e)}`}
                      >
                        <div className="truncate font-display text-2xs font-semibold leading-tight">
                          {c.title}
                        </div>
                        {project && (
                          <div className="truncate text-2xs leading-tight opacity-75">
                            {project.name}
                          </div>
                        )}
                        {hoursBetween(s, e) > 1 && (
                          <div className="tnum absolute bottom-0.5 left-1.5 flex items-center gap-1 text-2xs opacity-80">
                            <CalendarClock size={9} />
                            {formatDuration(hoursBetween(s, e))}
                          </div>
                        )}
                      </div>
                    )
                  })}

                {/* This task's planned blocks — planned lane, draggable */}
                {slots.map((slot) => {
                  const { start, end } = resolve(slot)
                  if (!sameDay(start, day)) return null
                  const dragging = drag?.slotId === slot.id
                  return (
                    <div
                      key={slot.id}
                      onPointerDown={(e) => beginDrag(e, slot, 'move')}
                      className={clsx(
                        'entry-planned absolute overflow-hidden rounded px-1.5 py-1',
                        'ring-2 ring-pink',
                        editable && 'cursor-grab active:cursor-grabbing',
                        dragging && 'z-30 cursor-grabbing shadow-pop',
                      )}
                      style={{ ...plannedLane, top: yOf(start), height: hOf(start, end) }}
                    >
                      <div className="truncate font-display text-2xs font-bold leading-tight">
                        {slotLabel}
                      </div>
                      <div className="tnum truncate text-2xs leading-tight opacity-80">
                        {formatRange(start, end)}
                      </div>
                      <div className="tnum absolute bottom-0.5 left-1.5 flex items-center gap-1 text-2xs font-semibold">
                        <CalendarClock size={9} />
                        {formatDuration(hoursBetween(start, end))}
                      </div>
                      {editable && (
                        <div
                          onPointerDown={(e) => beginDrag(e, slot, 'resize')}
                          className="absolute inset-x-0 bottom-0 h-2.5 cursor-ns-resize"
                        >
                          <div className="mx-auto mt-1 h-1 w-7 rounded-pill bg-current opacity-40" />
                        </div>
                      )}
                    </div>
                  )
                })}

                {/* Tracked entries — logged lane */}
                {entries
                  .filter((e) => sameDay(parse(e.start), day))
                  .map((e) => {
                    const s = parse(e.start)
                    const en = parse(e.end)
                    return (
                      <div
                        key={e.id}
                        className={clsx(
                          'entry-logged animate-fade-in absolute overflow-hidden rounded px-1.5 py-1',
                          FILL['skoda-infotainment'],
                        )}
                        style={{ ...loggedLane, top: yOf(s), height: hOf(s, en) }}
                        title={`${e.activity} · ${formatRange(s, en)}`}
                      >
                        <div className="truncate font-display text-2xs font-semibold leading-tight">
                          {e.activity}
                        </div>
                        <div className="truncate text-2xs leading-tight opacity-80">
                          Infotainment Frontend
                        </div>
                        {hoursBetween(s, en) > 0.8 && (
                          <div className="tnum absolute bottom-0.5 left-1.5 flex items-center gap-1 text-2xs">
                            <TimerIcon size={9} />
                            {formatDuration(hoursBetween(s, en))}
                            <DollarSign size={9} className="ml-0.5" />
                          </div>
                        )}
                      </div>
                    )
                  })}

                {/* Deadline */}
                {deadline && sameDay(deadline, day) && (
                  <div
                    className="pointer-events-none absolute inset-x-0 z-40"
                    style={{ top: yOf(deadline) }}
                  >
                    <div className="h-px w-full bg-bad" />
                    <span className="absolute -top-2 right-0.5 inline-flex items-center gap-1 rounded-pill bg-bad px-1.5 py-0.5 font-display text-2xs font-bold text-white">
                      <Flag size={9} /> Due {formatTime(deadline)}
                    </span>
                  </div>
                )}

                {/* Now */}
                {now && sameDay(now, day) && (
                  <div
                    className="pointer-events-none absolute inset-x-0 z-40"
                    style={{ top: yOf(now) }}
                  >
                    <div className="h-[1.5px] w-full bg-pink" />
                    <div className="absolute -left-1 -top-[3px] h-2 w-2 rounded-full bg-pink" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function CalendarLegend({ showFree = false }: { showFree?: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      <span className="inline-flex items-center gap-1.5 text-2xs text-mid">
        <span className="h-3 w-4 rounded bg-e-pink" />
        Logged
      </span>
      <span className="inline-flex items-center gap-1.5 text-2xs text-mid">
        <span className="entry-planned h-3 w-4 rounded" />
        Planned
      </span>
      <span className="inline-flex items-center gap-1.5 text-2xs text-mid">
        <span className="entry-planned h-3 w-4 rounded ring-2 ring-pink" />
        This task
      </span>
      {showFree && (
        <span className="inline-flex items-center gap-1.5 text-2xs text-mid">
          <span className="hatch-free h-3 w-4 rounded border border-ok/30" />
          Available capacity
        </span>
      )}
    </div>
  )
}
