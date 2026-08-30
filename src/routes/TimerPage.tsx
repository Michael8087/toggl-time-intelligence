import clsx from 'clsx'
import { useState } from 'react'
import {
  AtSign,
  Calendar,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Columns2,
  DollarSign,
  FastForward,
  Grid3x3,
  Hash,
  LayoutList,
  PanelRight,
  Play,
  Pause,
  Plus,
  Settings,
} from 'lucide-react'
import { CalendarLegend, WeekCalendar } from '../components/WeekCalendar'
import { Button, Note, StepHint, TooltipCard } from '../components/ui'
import {
  ChangeTrigger,
  PlanAdjustedNotice,
  PlanChangeNotice,
} from '../components/PlanChangeNotice'
import { useDemo } from '../state/DemoContext'
import { HERO_TASK, OTHER_TASKS, PROJECTS, SIMULATED_ENTRIES } from '../data/demo'
import {
  DEMO_NOW,
  formatClock,
  formatDate,
  formatDuration,
  formatTime,
  hoursBetween,
  parse,
  weekDays,
} from '../lib/time'

/* Row 1 — the persistent timer. */
function TimerRow() {
  const { phase, trackedHours, simRunning, revealed, startSim, pauseSim, slots } = useDemo()
  const tracking = phase === 'working'
  const done = phase === 'complete' || phase === 'reported'
  const current = SIMULATED_ENTRIES[Math.max(0, revealed - 1)]

  return (
    <div className="flex items-center gap-3 border-b border-hairline bg-panel px-5 py-3">
      {tracking || done ? (
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="relative grid h-2.5 w-2.5 shrink-0 place-items-center">
            <span
              className={clsx(
                'h-2.5 w-2.5 rounded-full',
                simRunning ? 'bg-pink' : done ? 'bg-ok' : 'bg-lo',
              )}
            />
            {simRunning && (
              <span className="absolute h-2.5 w-2.5 animate-pulse-ring rounded-full bg-pink" />
            )}
          </span>
          <div className="min-w-0">
            <div className="truncate font-display text-[19px] font-semibold text-hi">
              {done ? HERO_TASK.title : (current?.activity ?? HERO_TASK.title)}
            </div>
            <div className="flex items-center gap-1.5 text-2xs text-mid">
              <span className="h-2 w-2 shrink-0 rounded-sm bg-e-pink" />
              Infotainment Frontend
            </div>
          </div>
        </div>
      ) : (
        <input
          readOnly
          placeholder="What are you working on?"
          className="min-w-0 flex-1 cursor-default bg-transparent font-display text-[21px] font-semibold text-hi placeholder:text-hi focus:outline-none"
        />
      )}

      <div className="hidden items-center gap-2 lg:flex">
        <span className="toolbar-pill">
          <AtSign size={13} /> Task
        </span>
        <span className="toolbar-pill">
          <Plus size={13} /> Project
        </span>
        <span className="toolbar-pill">
          <Hash size={13} /> Tags
        </span>
        <span className="grid h-8 w-8 place-items-center rounded-pill text-mid">
          <DollarSign size={15} />
        </span>
      </div>

      <div className="tnum font-display text-[21px] font-medium text-hi">
        {formatClock(trackedHours)}
      </div>

      <button
        disabled={!slots.length || done}
        onClick={simRunning ? pauseSim : startSim}
        className={clsx(
          'grid h-11 w-11 place-items-center rounded-full transition-colors',
          slots.length && !done ? 'bg-pink text-white hover:bg-pink-hi' : 'bg-panel-3 text-lo',
        )}
        aria-label={simRunning ? 'Pause' : 'Start'}
      >
        {simRunning ? (
          <Pause size={18} fill="currentColor" />
        ) : (
          <Play size={18} fill="currentColor" className="ml-0.5" />
        )}
      </button>
    </div>
  )
}

/* Row 2 — date navigation and view switcher. */
function DateRow({
  split,
  onSplit,
}: {
  split: boolean
  onSplit: (v: boolean) => void
}) {
  const days = weekDays(DEMO_NOW)
  const label = `${formatDate(days[0])} - ${formatDate(days[4])} ${days[0].getFullYear()}`

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-hairline bg-panel px-5 py-2.5">
      <button className="grid h-8 w-8 place-items-center rounded-pill text-mid hover:bg-panel-2 hover:text-hi">
        <ChevronLeft size={17} />
      </button>
      <span className="inline-flex items-center gap-2 font-display text-[14px] font-medium text-hi">
        <Calendar size={15} className="text-mid" />
        {label} · W38
      </span>
      <button className="grid h-8 w-8 place-items-center rounded-pill text-mid hover:bg-panel-2 hover:text-hi">
        <ChevronRight size={17} />
      </button>
      <span className="toolbar-pill ml-1">Today</span>

      <div className="ml-auto flex items-center gap-1.5">
        <span className="toolbar-pill">
          Week <ChevronDown size={13} />
        </span>
        <div className="flex items-center gap-0.5">
          {[
            { icon: CalendarDays, on: !split, set: () => onSplit(false), label: 'Calendar' },
            { icon: Columns2, on: split, set: () => onSplit(true), label: 'Split view' },
            { icon: LayoutList, on: false, label: 'List' },
            { icon: Grid3x3, on: false, label: 'Grid' },
          ].map(({ icon: Icon, on, set, label }) => (
            <button
              key={label}
              onClick={set}
              title={label}
              className={clsx(
                'grid h-8 w-8 place-items-center rounded-md transition-colors',
                on ? 'bg-pink-lo text-pink' : 'text-mid hover:bg-panel-2 hover:text-hi',
                !set && 'cursor-default opacity-60',
              )}
            >
              <Icon size={16} />
            </button>
          ))}
          <span className="mx-1 h-5 w-px bg-hairline" />
          <button className="grid h-8 w-8 place-items-center rounded-md text-mid hover:bg-panel-2 hover:text-hi">
            <Settings size={16} />
          </button>
          <button className="grid h-8 w-8 place-items-center rounded-md text-mid hover:bg-panel-2 hover:text-hi">
            <PanelRight size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

/* Row 3 — logged / planned summary bars, broken down by project on hover. */

interface Segment {
  label: string
  hours: number
  cls: string
}

const PROJECT_FILL: Record<string, string> = {
  'skoda-infotainment': 'bg-e-pink',
  'bosch-sensor': 'bg-e-blue',
  internal: 'bg-e-yellow',
}

function StackedBar({ segments, width }: { segments: Segment[]; width: number }) {
  const [hover, setHover] = useState<number | null>(null)
  const total = segments.reduce((s, x) => s + x.hours, 0)

  // Centre of each segment, for placing the tooltip caret.
  let acc = 0
  const centres = segments.map((seg) => {
    const c = acc + seg.hours / 2
    acc += seg.hours
    return total ? (c / total) * 100 : 0
  })

  return (
    <div className="relative" style={{ width }}>
      <div className="flex h-1.5 overflow-hidden rounded-pill bg-panel-3">
        {total === 0 ? (
          <div className="w-full" />
        ) : (
          segments.map((seg, i) => (
            <div
              key={seg.label}
              className={clsx(seg.cls, 'cursor-default')}
              style={{ width: `${(seg.hours / total) * 100}%` }}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            />
          ))
        )}
      </div>

      {hover !== null && segments[hover] && (
        <div
          className="pointer-events-none absolute top-full z-50 -translate-x-1/2 pt-2"
          style={{ left: `${centres[hover]}%` }}
        >
          <TooltipCard className="whitespace-nowrap">
            <span className="flex items-center gap-2.5">
              <span
                className={clsx('h-2.5 w-2.5 shrink-0 rounded-full', segments[hover].cls)}
              />
              <span className="font-display text-[14px] font-semibold text-hi">
                {segments[hover].label}
              </span>
              <span className="tnum ml-4 font-display text-[14px] text-mid">
                {formatDuration(segments[hover].hours)}
              </span>
            </span>
          </TooltipCard>
        </div>
      )}
    </div>
  )
}

function SummaryRow() {
  const { trackedHours, slots, commitments } = useDemo()

  const hoursOf = (list: { start: string; end: string }[]) =>
    list.reduce((s, x) => s + hoursBetween(parse(x.start), parse(x.end)), 0)

  // Everything tracked so far belongs to the one task the user is working on.
  const logged: Segment[] =
    trackedHours > 0
      ? [
          {
            label: 'Infotainment Frontend',
            hours: trackedHours,
            cls: PROJECT_FILL['skoda-infotainment'],
          },
        ]
      : []

  const planned: Segment[] = PROJECTS.map((p) => ({
    label: p.name,
    cls: PROJECT_FILL[p.id],
    hours:
      hoursOf(commitments.filter((c) => c.projectId === p.id)) +
      (p.id === 'skoda-infotainment' ? hoursOf(slots) : 0),
  })).filter((seg) => seg.hours > 0)

  const loggedTotal = logged.reduce((s, x) => s + x.hours, 0)
  const plannedTotal = planned.reduce((s, x) => s + x.hours, 0)

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-hairline bg-panel px-5 py-2">
      <span className="text-[13px] text-mid">Logged</span>
      <StackedBar segments={logged} width={220} />
      <span className="tnum font-display text-[13px] font-semibold text-hi">
        {loggedTotal > 0 ? formatDuration(loggedTotal) : '–'}
      </span>

      <span className="ml-2 text-[13px] text-mid">Planned</span>
      <StackedBar segments={planned} width={180} />
      <span className="tnum font-display text-[13px] font-semibold text-hi">
        {formatDuration(plannedTotal)}
      </span>

      <span className="ml-auto text-[13px] text-mid">View reports ›</span>
    </div>
  )
}

/* The tracking simulation controls, which only exist because this is a demo. */
function SimBar() {
  const {
    phase,
    simRunning,
    simDone,
    atCheckpoint,
    trackedHours,
    planHours,
    startSim,
    pauseSim,
    finishSim,
    complete,
    simNow,
    slots,
  } = useDemo()

  if (phase === 'scheduled') {
    return (
      <div className="border-b border-hairline bg-panel px-5 py-3">
        <StepHint
          step={3}
          action={
            <Button size="sm" onClick={startSim}>
              <Play size={13} fill="currentColor" />
              Run the week
            </Button>
          }
        >
          <strong>
            {formatDuration(planHours)} planned across {slots.length} blocks
          </strong>{' '}
          — on the right of each day below. Run the week to watch tracked time fill in on the
          left, then see what Toggl does when reality diverges.
        </StepHint>
      </div>
    )
  }

  if (phase !== 'working') return null

  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-hairline bg-pink-lo px-5 py-3">
      <span className="relative grid h-2.5 w-2.5 shrink-0 place-items-center">
        <span className={clsx('h-2.5 w-2.5 rounded-full', simRunning ? 'bg-pink' : 'bg-lo')} />
        {simRunning && (
          <span className="absolute h-2.5 w-2.5 animate-pulse-ring rounded-full bg-pink" />
        )}
      </span>
      <span className="tnum min-w-0 text-[13px] text-hi">
        <span className="font-display font-semibold">
          {formatDuration(trackedHours)} of {formatDuration(planHours)}
        </span>
        <span className="text-mid">
          {' '}
          · simulated clock {formatTime(simNow)}
          {atCheckpoint && ' · exactly on plan, so Toggl says nothing'}
        </span>
      </span>
      <div className="ml-auto flex items-center gap-2">
        {simDone ? (
          <Button size="sm" onClick={complete}>
            Mark complete
          </Button>
        ) : (
          <>
            <Button size="sm" variant="ghost" onClick={simRunning ? pauseSim : startSim}>
              {simRunning ? <Pause size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" />}
              {simRunning ? 'Pause' : 'Continue'}
            </Button>
            <Button size="sm" variant="quiet" onClick={finishSim}>
              <FastForward size={13} />
              Skip to end
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

export function TimerPage() {
  const { slots, entries, deadline, simNow, phase, commitments } = useDemo()
  const [split, setSplit] = useState(true)
  const days = weekDays(DEMO_NOW)

  /* The all-day band shows the tasks themselves across their scheduled dates.
     The hero task spans from its first planned block to its due date, so the
     commitment becomes visible the moment it is planned. */
  const taskBars = [
    ...OTHER_TASKS.filter((t) => t.dueAt).map((t) => ({
      id: t.id,
      title: t.title,
      project: 'Infotainment Frontend',
      start: parse(t.dueAt!),
      end: parse(t.dueAt!),
    })),
    ...(slots.length
      ? [
          {
            id: HERO_TASK.id,
            title: HERO_TASK.title,
            project: 'Infotainment Frontend',
            start: parse(slots[0].start),
            end: deadline,
          },
        ]
      : []),
  ]

  return (
    <div className="scrollbar-slim flex min-h-0 flex-1 flex-col overflow-y-auto">
      <TimerRow />
      <DateRow split={split} onSplit={setSplit} />
      <SummaryRow />
      <SimBar />
      <ChangeTrigger />
      <PlanChangeNotice />
      <PlanAdjustedNotice />

      <div className="min-h-0 flex-1">
        <WeekCalendar
          days={days}
          commitments={commitments}
          taskBars={taskBars}
          slots={slots}
          entries={entries}
          deadline={slots.length ? deadline : undefined}
          now={phase === 'working' || phase === 'complete' ? simNow : DEMO_NOW}
          mode={split ? 'split' : 'calendar'}
        />
      </div>

      <div className="space-y-4 border-t border-hairline px-5 py-4">
        <CalendarLegend />
        <Note title="Built on what is already there">
          Split view already puts logged time on the left of each day and planned time on the
          right. That is Toggl 2.0’s existing vocabulary for plan versus actual, and it is why this
          concept did not need a new screen — only a way to get something into the right-hand
          lane without typing it.
        </Note>
      </div>
    </div>
  )
}
