import clsx from 'clsx'
import { useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Clock,
  Folder,
  Sparkles,
  Tag,
  Wand2,
  X,
} from 'lucide-react'
import { Button, Note, StepHint } from './ui'
import { useDemo } from '../state/DemoContext'
import { HERO_TASK } from '../data/demo'
import {
  formatDate,
  formatDayLong,
  formatDuration,
  formatTime,
  hoursBetween,
  parse,
} from '../lib/time'

/**
 * Variant B's planning surface.
 *
 * The estimate is settled on the task; placing it is done here, on the calendar
 * Toggl already gives you for planning time by hand. The bar states what is
 * left to place and offers to do it, but clicking empty canvas works too — the
 * automation sits next to the manual gesture rather than replacing it.
 */
export function PlanInTimer() {
  const {
    phase,
    variant,
    planHours,
    slots,
    availableHours,
    deadline,
    generateSchedule,
    confirmSchedule,
    setSlots,
    estimate,
  } = useDemo()

  if (variant !== 'B' || phase !== 'schedule') return null

  const placed = slots.reduce((s, x) => s + hoursBetween(parse(x.start), parse(x.end)), 0)
  const left = planHours - placed
  const done = Math.abs(left) < 0.01
  // Placing something is enough to move on. Insisting the total match the
  // estimate to the minute would trap anyone who plans by hand and stops when
  // the week looks right, which is how people actually plan.
  const canConfirm = placed > 0.01
  const worstCase = estimate.highHours

  return (
    <div className="border-b border-hairline bg-pink-lo/60 px-5 py-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="inline-flex items-center gap-2 font-display text-[14px] font-semibold text-hi">
          <CalendarClock size={16} className="text-pink" />
          Place {formatDuration(planHours)} of work
        </span>

        <span className="tnum text-[13px] text-mid">
          <span className={clsx('font-semibold', done ? 'text-ok' : 'text-hi')}>
            {formatDuration(placed)} placed
          </span>
          {' · '}
          {done ? 'nothing left' : `${formatDuration(left)} to go`}
          {' · '}
          {formatDuration(availableHours)} free before {formatDayLong(deadline)}
        </span>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {!done && (
            <Button size="sm" variant={canConfirm ? 'ghost' : 'primary'} onClick={generateSchedule}>
              <Wand2 size={14} />
              {canConfirm ? 'Let Toggl finish it' : 'Let Toggl place it'}
            </Button>
          )}
          {slots.length > 0 && (
            <Button size="sm" variant="quiet" onClick={() => setSlots([])}>
              Clear
            </Button>
          )}
          {canConfirm && (
            <Button size="sm" onClick={confirmSchedule}>
              <CheckCircle2 size={14} />
              {done ? 'Confirm plan' : `Confirm ${formatDuration(placed)}`}
            </Button>
          )}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-2xs text-mid">
        <span className="inline-flex items-center gap-1.5">
          <Sparkles size={11} className="text-pink" />
          Click any empty slot to place time yourself, or drag a block once it is there.
        </span>
        {canConfirm && !done && (
          <span className="inline-flex items-center gap-1.5 text-warn">
            <AlertTriangle size={11} />
            {formatDuration(left)} of the estimate is unplanned. You can confirm anyway and
            place the rest later.
          </span>
        )}
        {worstCase > availableHours && (
          <span className="inline-flex items-center gap-1.5 text-warn">
            <AlertTriangle size={11} />
            Worst case is {formatDuration(worstCase)}, which is more than you have free.
          </span>
        )}
      </div>

      <div className="mt-3">
        <Note title="Why this variant exists">
          Toggl already lets you plan time by clicking the calendar. Variant A puts scheduling
          in a sheet over the task, which is tidier to demo but invents a second place to do
          something the product can already do. This one keeps the estimate on the task, where
          it is a property of the work, and moves placement to the surface that owns it — so
          the automation is a shortcut through an existing gesture rather than a parallel path.
        </Note>
      </div>
    </div>
  )
}

/** Toggl's own plan-time popover, opened by clicking empty canvas. */
export function PlanTimePopover({
  start,
  onClose,
}: {
  start: Date
  onClose: () => void
}) {
  const { addSlot, planHours, slots } = useDemo()
  const placed = slots.reduce((s, x) => s + hoursBetween(parse(x.start), parse(x.end)), 0)
  const remaining = Math.max(0.25, planHours - placed)
  const [hours, setHours] = useState(Math.min(remaining, 4))
  const end = new Date(start.getTime() + hours * 3_600_000)

  return (
    <>
      <div className="fixed inset-0 z-[70]" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-[71] w-[520px] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 animate-fade-up overflow-hidden rounded-xl border border-hairline bg-panel shadow-pop">
        <div className="flex items-center gap-2 px-5 pt-4">
          <span className="font-display text-2xs font-semibold uppercase tracking-[0.1em] text-mid">
            Plan time
          </span>
          <button onClick={onClose} className="ml-auto text-mid hover:text-hi" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="px-5 pb-1 pt-3">
          <div className="font-display text-[17px] font-semibold text-hi">{HERO_TASK.title}</div>
        </div>

        <div className="flex flex-wrap items-center gap-2 px-5 py-3">
          <span className="inline-flex h-9 items-center gap-2 rounded-lg bg-e-blue/15 px-3 font-display text-[14px] font-medium text-e-blue">
            <Folder size={14} />
            Infotainment Frontend
          </span>
          {HERO_TASK.tags.map((t) => (
            <span
              key={t}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-pink-lo px-3 font-display text-[14px] font-medium text-pink"
            >
              <Tag size={14} />
              {t}
            </span>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 px-5 pb-4">
          <span className="inline-flex h-9 items-center gap-2 rounded-lg bg-panel-2 px-3 font-display text-[14px] text-hi">
            <CalendarClock size={14} className="text-mid" />
            {formatDayLong(start)}, {formatDate(start)}
          </span>
          <span className="tnum inline-flex h-9 items-center gap-2 rounded-lg bg-panel-2 px-3 font-display text-[14px] text-hi">
            {formatTime(start)} <ArrowRight size={13} className="text-mid" /> {formatTime(end)}
          </span>
          <span className="inline-flex items-center gap-1 rounded-lg bg-panel-2 p-1">
            <button
              onClick={() => setHours(Math.max(0.25, hours - 0.25))}
              className="grid h-7 w-7 place-items-center rounded text-mid hover:bg-panel hover:text-hi"
              aria-label="Shorter"
            >
              −
            </button>
            <span className="tnum inline-flex items-center gap-1.5 px-1 font-display text-[14px] font-semibold text-hi">
              <Clock size={13} className="text-mid" />
              {formatDuration(hours)}
            </span>
            <button
              onClick={() => setHours(hours + 0.25)}
              className="grid h-7 w-7 place-items-center rounded text-mid hover:bg-panel hover:text-hi"
              aria-label="Longer"
            >
              +
            </button>
          </span>
        </div>

        <div className="flex items-center gap-3 border-t border-hairline px-5 py-3">
          <span className="text-2xs text-mid">
            {formatDuration(Math.max(0, planHours - placed))} of the estimate still to place.
          </span>
          <Button
            className="ml-auto"
            onClick={() => {
              addSlot(start, hours)
              onClose()
            }}
          >
            Plan time · {formatDuration(hours)}
          </Button>
        </div>
      </div>
    </>
  )
}

/** Variant B's hand-off out of the task panel. */
export function PlanInTimerHint({ onOpen }: { onOpen: () => void }) {
  const { planHours, availableHours, deadline } = useDemo()
  return (
    <StepHint
      step={2}
      className="mt-3"
      action={
        <Button size="sm" onClick={onOpen}>
          Plan in Timer
          <ArrowRight size={14} />
        </Button>
      }
    >
      <strong>{formatDuration(planHours)}</strong> to place, and{' '}
      <strong>{formatDuration(availableHours)}</strong> free before {formatDayLong(deadline)}.
      Place it on the calendar.
    </StepHint>
  )
}
