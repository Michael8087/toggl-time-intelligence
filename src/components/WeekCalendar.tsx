import clsx from 'clsx'
import { useEffect, useRef, useState } from 'react'
import {
  ArrowRight,
  CalendarClock,
  ChevronsDownUp,
  ChevronsUpDown,
  DollarSign,
  Flag,
  Folder,
  ListChecks,
  MoreVertical,
  Play,
  Tag,
  Timer as TimerIcon,
  X,
} from 'lucide-react'
import type { Commitment, Interval, PlannedSlot, TimeEntry } from '../types'
import { PROJECTS } from '../data/demo'
import { TooltipCard, TooltipRow } from './ui'
import {
  addMinutes,
  formatDate,
  formatDayAndDate,
  formatDayShort,
  formatDuration,
  formatRange,
  formatTime,
  hoursBetween,
  iso,
  parse,
  sameDay,
} from '../lib/time'

// The grid covers the whole day and scrolls; the working window is what the
// user actually sees on arrival, with the rest washed out.
const VIEW_START = 0
const VIEW_END = 24
const WORK_START = 9
const WORK_END = 17
const SCROLL_TO = 8
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

/** A task shown across its scheduled dates in the all-day band — not a time
 *  entry and not a planned block, but the task itself. */
export interface TaskBar {
  id: string
  title: string
  project: string
  start: Date
  end: Date
}

export interface WeekCalendarProps {
  days: Date[]
  /** Parent tasks, drawn as date-spanning bars above the grid. */
  taskBars?: TaskBar[]
  commitments?: Commitment[]
  /** Free capacity, drawn in behind the entries during the capacity check. */
  windows?: Interval[]
  slots?: PlannedSlot[]
  entries?: TimeEntry[]
  editable?: boolean
  deadline?: Date
  now?: Date
  /**
   * 'split'    — logged left, planned right, as Toggl 2.0's split view does.
   * 'calendar' — the two overlap, offset, with planned on top.
   * 'plan'     — planning only, so planned takes the whole column.
   */
  mode?: 'split' | 'calendar' | 'plan'
  dimPastDeadline?: boolean
  onChangeSlot?: (slot: PlannedSlot) => void
  /** Height of the scrolling viewport over the 24-hour grid. */
  viewportHeight?: number
  /** Clicking empty canvas offers to plan time there, as the real app does. */
  onPlanSlot?: (start: Date) => void
  slotLabel?: string
  className?: string
}

/** Explains the washed-out region rather than leaving it a mystery. */
function OffHoursTip({ day, anchor }: { day: Date; anchor: 'top' | 'bottom' }) {
  return (
    <div
      className={clsx(
        'pointer-events-none absolute left-1/2 z-40 hidden w-[272px] -translate-x-1/2 group-hover:block',
        anchor === 'bottom' ? 'bottom-2' : 'top-2',
      )}
    >
      <div className="rounded-xl border border-hairline bg-panel px-4 py-3 shadow-pop">
        <div className="font-display text-[14px] font-semibold text-hi">
          Outside working hours
        </div>
        <div className="mt-0.5 text-[13px] text-mid">{formatDate(day)}</div>
        <div className="my-2.5 h-px bg-hairline" />
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-[13px] text-mid">Working hours</span>
          <span className="tnum whitespace-nowrap font-display text-[13px] font-semibold text-hi">
            9:00 AM – 5:00 PM
          </span>
        </div>
        <div className="my-2.5 h-px bg-hairline" />
        <span className="font-display text-[13px] text-mid underline">Change schedule</span>
      </div>
    </div>
  )
}

interface EntryDetail {
  kind: 'Logged' | 'Planned'
  title: string
  project: string
  tags: string[]
  billable: boolean
  start: Date
  end: Date
  rect: DOMRect
}

/** The editor Toggl opens when you click an entry, in either view. */
function EntryPopover({ detail, onClose }: { detail: EntryDetail; onClose: () => void }) {
  const { rect } = detail
  const width = 480
  const left = Math.min(
    Math.max(12, rect.left + rect.width / 2 - width / 2),
    window.innerWidth - width - 12,
  )
  const top = Math.min(rect.top + 8, window.innerHeight - 300)

  return (
    <>
      <div className="fixed inset-0 z-[70]" onClick={onClose} />
      <div
        className="fixed z-[71] animate-fade-up overflow-hidden rounded-xl border border-hairline bg-panel shadow-pop"
        style={{ left, top, width }}
      >
        <div className="flex items-center gap-3 px-5 pt-4">
          <span className="font-display text-2xs font-semibold uppercase tracking-[0.1em] text-mid">
            {detail.kind}
          </span>
          <div className="ml-auto flex items-center gap-3">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-pink text-white">
              <Play size={14} fill="currentColor" className="ml-0.5" />
            </span>
            <ListChecks size={17} className="text-mid" />
            <MoreVertical size={17} className="text-mid" />
            <button onClick={onClose} className="text-mid hover:text-hi" aria-label="Close">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="px-5 pb-1 pt-3">
          <div className="font-display text-[17px] font-semibold text-hi">{detail.title}</div>
        </div>

        <div className="flex flex-wrap items-center gap-2 px-5 py-3">
          <span className="inline-flex h-9 items-center gap-2 rounded-lg border border-dashed border-hairline-2 px-3 font-display text-[14px] text-mid">
            <ListChecks size={14} />
            Task
          </span>
          <span className="inline-flex h-9 items-center gap-2 rounded-lg bg-e-blue/15 px-3 font-display text-[14px] font-medium text-e-blue">
            <Folder size={14} />
            {detail.project}
          </span>
          {detail.tags.map((t) => (
            <span
              key={t}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-pink-lo px-3 font-display text-[14px] font-medium text-pink"
            >
              <Tag size={14} />
              {t}
            </span>
          ))}
          {detail.billable && (
            <span className="inline-flex h-9 items-center rounded-lg bg-pink-lo px-3 text-pink">
              <DollarSign size={15} />
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 px-5 pb-4">
          <span className="inline-flex h-9 items-center rounded-lg bg-panel-2 px-3 font-display text-[14px] text-hi">
            {formatDayShort(detail.start)}, {formatDate(detail.start)}
          </span>
          <span className="tnum inline-flex h-9 items-center gap-2 rounded-lg bg-panel-2 px-3 font-display text-[14px] text-hi">
            {formatTime(detail.start)} <ArrowRight size={13} className="text-mid" />{' '}
            {formatTime(detail.end)}
          </span>
          <span className="tnum inline-flex h-9 items-center gap-2 rounded-lg bg-panel-2 px-3 font-display text-[14px] text-hi">
            <TimerIcon size={14} className="text-mid" />
            {formatDuration(hoursBetween(detail.start, detail.end))}
          </span>
        </div>

        <div className="flex justify-end border-t border-hairline px-5 py-3">
          <button
            onClick={onClose}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-pink-lo px-5 font-display text-[14px] font-semibold text-pink"
          >
            Save
            <span className="text-[13px] opacity-70">⏎</span>
          </button>
        </div>
      </div>
    </>
  )
}

export function WeekCalendar({
  days,
  commitments = [],
  taskBars = [],
  windows = [],
  slots = [],
  entries = [],
  editable = false,
  deadline,
  now,
  mode = 'split',
  dimPastDeadline = false,
  onChangeSlot,
  onPlanSlot,
  viewportHeight = 520,
  slotLabel = 'Implement navigation component',
  className,
}: WeekCalendarProps) {
  const gridRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [drag, setDrag] = useState<DragState | null>(null)
  const [hoverDay, setHoverDay] = useState<number | null>(null)
  const [showTasks, setShowTasks] = useState(true)
  const [detail, setDetail] = useState<EntryDetail | null>(null)

  // Open on the working day rather than at midnight.
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = (SCROLL_TO - VIEW_START) * HOUR_H
    }
  }, [])
  const hours = Array.from({ length: VIEW_END - VIEW_START + 1 }, (_, i) => VIEW_START + i)
  const bodyH = (VIEW_END - VIEW_START) * HOUR_H

  // Lane geometry.
  // Calendar view overlaps the two lanes, but with nothing logged there is no
  // overlap to make room for, so planned takes the full column.
  const nothingLogged = entries.length === 0
  const loggedLane =
    mode === 'split'
      ? { left: '0%', width: '50%' }
      : mode === 'calendar'
        ? { left: '0%', width: '72%' }
        : { left: '0%', width: '100%' }
  // Calendar view stacks the two as overlapping events, offset to the right,
  // with planned drawn over logged — the way the real app renders a task that
  // was both planned and tracked. Split view puts them in their own lanes.
  const plannedLane =
    mode === 'split'
      ? { left: '50%', width: '50%' }
      : mode === 'calendar' && !nothingLogged
        ? { left: '28%', width: '72%' }
        : { left: '0%', width: '100%' }
  const plannedZ = mode === 'calendar' ? 'z-20' : 'z-10'

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

  // Pack task bars into stacked lanes. Collision is measured in day columns,
  // not timestamps: two tasks due the same day overlap on screen even when
  // their times do not.
  const dayIndex = (d: Date, fallback: number) => {
    const i = days.findIndex((x) => sameDay(x, d))
    return i < 0 ? fallback : i
  }
  const placed = taskBars
    .map((bar) => ({
      bar,
      from: dayIndex(bar.start, 0),
      to: dayIndex(bar.end, days.length - 1),
    }))
    .sort((a, b) => a.from - b.from)

  const lanes: { bar: TaskBar; from: number; to: number }[][] = []
  for (const item of placed) {
    const lane = lanes.find(
      (row) => !row.some((o) => item.from <= o.to && o.from <= item.to),
    )
    if (lane) lane.push(item)
    else lanes.push([item])
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
              {/* Split view prints logged / planned; calendar view prints logged
                  only — but the hover breaks both out either way. */}
              <div className="group relative mt-0.5 w-fit">
                <div className="tnum cursor-default text-2xs font-medium text-pink">
                  {logged > 0 ? formatDuration(logged) : '–'}
                  {mode === 'split' && (
                    <span className="text-lo">
                      {' '}/ {planned > 0 ? formatDuration(planned) : '–'}
                    </span>
                  )}
                </div>
                <div className="pointer-events-none absolute left-0 top-full z-50 hidden pt-2 group-hover:block">
                  <TooltipCard className="w-[232px]">
                    <div className="font-display text-[15px] font-semibold text-hi">
                      {formatDayAndDate(d)}
                    </div>
                    <div className="my-2.5 h-px bg-hairline" />
                    <div className="space-y-2">
                      <TooltipRow
                        icon={TimerIcon}
                        label="Logged"
                        tone="pink"
                        value={logged > 0 ? formatDuration(logged) : '–'}
                      />
                      <TooltipRow
                        icon={CalendarClock}
                        label="Planned"
                        value={planned > 0 ? formatDuration(planned) : '–'}
                      />
                    </div>
                  </TooltipCard>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* All-day band: tasks across their scheduled dates. */}
      {taskBars.length > 0 && (
        <div className="flex border-b border-hairline">
          <div
            className="group relative flex shrink-0 items-start justify-center pt-2"
            style={{ width: GUTTER }}
          >
            <button
              onClick={() => setShowTasks(!showTasks)}
              className="text-lo transition-colors hover:text-hi"
              aria-expanded={showTasks}
              aria-label={showTasks ? 'Hide tasks' : 'Show tasks'}
            >
              {showTasks ? <ChevronsDownUp size={15} /> : <ChevronsUpDown size={15} />}
            </button>
            <span className="pointer-events-none absolute -top-1 left-1 z-50 hidden -translate-y-full whitespace-nowrap rounded-lg border border-hairline bg-panel px-3 py-1.5 font-display text-[13px] text-hi shadow-pop group-hover:block">
              {showTasks ? 'Hide tasks' : 'Show tasks'}
            </span>
          </div>
          {!showTasks && (
            <div className="flex min-w-0 flex-1 py-2">
              {days.map((d, i) => {
                const n = placed.filter((x) => i >= x.from && i <= x.to).length
                return (
                  <div key={d.toISOString()} className="flex-1 text-center">
                    {n > 0 && (
                      <span className="rounded bg-e-blue/15 px-2 py-0.5 text-2xs font-medium text-e-blue">
                        {n} task{n > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
          {showTasks && (
          <div className="min-w-0 flex-1 space-y-1 py-2 pr-1">
            {lanes.map((lane, li) => (
              <div key={li} className="relative h-[22px]">
                {lane.map(({ bar, from: start, to: end }) => {
                  return (
                    <div
                      key={bar.id}
                      className="absolute top-0 flex h-[22px] items-center gap-1.5 overflow-hidden rounded bg-e-blue/15 px-2"
                      style={{
                        left: `${(start / days.length) * 100}%`,
                        width: `${((end - start + 1) / days.length) * 100}%`,
                      }}
                      title={`${bar.title} · ${bar.project}`}
                    >
                      <span className="truncate font-display text-2xs font-bold text-e-blue">
                        {bar.title}
                      </span>
                      <span className="truncate text-2xs text-mid">· {bar.project}</span>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
          )}
        </div>
      )}

      {/* Grid — scrolls through the full 24 hours */}
      <div className="relative">
      <div
        ref={scrollRef}
        className="scrollbar-slim overflow-y-auto"
        style={{ height: viewportHeight }}
      >
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
          {days.map((day, di) => {
            const past = deadline ? day > deadline && !sameDay(day, deadline) : false
            return (
              <div
                key={day.toISOString()}
                onMouseEnter={() => setHoverDay(di)}
                onMouseLeave={() => setHoverDay((v) => (v === di ? null : v))}
                onClick={(ev) => {
                  if (!onPlanSlot) return
                  const box = ev.currentTarget.getBoundingClientRect()
                  const hour = VIEW_START + (ev.clientY - box.top) / HOUR_H
                  const snapped = Math.round((hour * 60) / SNAP_MIN) * SNAP_MIN
                  const start = new Date(day)
                  start.setHours(0, snapped, 0, 0)
                  onPlanSlot(start)
                }}
                className={clsx(
                  'relative flex-1 border-l border-hairline',
                  onPlanSlot && 'cursor-copy',
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
                  className="group absolute inset-x-0 bg-surface/60"
                  style={{ top: 0, height: (WORK_START - VIEW_START) * HOUR_H }}
                >
                  <OffHoursTip day={day} anchor="bottom" />
                </div>
                <div
                  className="group absolute inset-x-0 bg-surface/60"
                  style={{ top: (WORK_END - VIEW_START) * HOUR_H, bottom: 0 }}
                >
                  <OffHoursTip day={day} anchor="top" />
                </div>

                {/* Free capacity */}
                {windows
                  .filter((w) => sameDay(w.start, day))
                  .map((w, k) => (
                    <div
                      key={k}
                      className="pointer-events-none absolute inset-x-px rounded border border-dashed border-ok/45 bg-ok/[0.07]"
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
                        onClick={(ev) => {
                          ev.stopPropagation()
                          setDetail({
                            kind: 'Planned',
                            title: c.title,
                            project: project?.name ?? '—',
                            tags: [],
                            billable: project?.billable ?? false,
                            start: s,
                            end: e,
                            rect: ev.currentTarget.getBoundingClientRect(),
                          })
                        }}
                        className={clsx(
                          'cursor-pointer',
                          'entry-planned absolute overflow-hidden rounded px-1.5 py-1',
                          plannedZ,
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
                      onClick={(e) => e.stopPropagation()}
                      className={clsx(
                        'entry-planned absolute overflow-hidden rounded border-2 border-pink px-1.5 py-1',
                        plannedZ,
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
                        onClick={(ev) => {
                          ev.stopPropagation()
                          setDetail({
                            kind: 'Logged',
                            title: e.activity,
                            project: 'Infotainment Frontend',
                            tags: ['Component'],
                            billable: true,
                            start: s,
                            end: en,
                            rect: ev.currentTarget.getBoundingClientRect(),
                          })
                        }}
                        className={clsx(
                          'entry-logged animate-fade-in absolute z-10 cursor-pointer overflow-hidden rounded px-1.5 py-1',
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

      {/* Which half is which — only meaningful when the lanes are split. */}
      {mode === 'split' && hoverDay !== null && (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-30 flex"
          style={{ paddingLeft: GUTTER }}
        >
          {days.map((d, i) => (
            <div key={d.toISOString()} className="relative h-6 flex-1">
              {i === hoverDay && (
                <>
                  <span
                    className="absolute top-0 flex h-6 items-center justify-center gap-1 bg-panel/95 font-display text-2xs font-semibold uppercase tracking-[0.06em] text-mid"
                    style={loggedLane}
                  >
                    <TimerIcon size={11} /> Logged
                  </span>
                  <span
                    className="absolute top-0 flex h-6 items-center justify-center gap-1 bg-panel/95 font-display text-2xs font-semibold uppercase tracking-[0.06em] text-mid"
                    style={plannedLane}
                  >
                    <CalendarClock size={11} /> Planned
                  </span>
                </>
              )}
            </div>
          ))}
        </div>
      )}
      </div>

      {detail && <EntryPopover detail={detail} onClose={() => setDetail(null)} />}
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
        <span className="entry-planned h-3 w-4 rounded border-2 border-pink" />
        This task
      </span>
      {showFree && (
        <span className="inline-flex items-center gap-1.5 text-2xs text-mid">
          <span className="h-3 w-4 rounded border border-dashed border-ok/45 bg-ok/[0.07]" />
          Available capacity
        </span>
      )}
    </div>
  )
}
