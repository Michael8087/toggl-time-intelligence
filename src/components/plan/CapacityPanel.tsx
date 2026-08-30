import clsx from 'clsx'
import { useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  Eye,
  Lock,
} from 'lucide-react'
import {Button} from '../ui'
import { CalendarLegend, WeekCalendar } from '../WeekCalendar'
import { useDemo } from '../../state/DemoContext'

import {
  DEMO_NOW,
  formatDayLong,
  formatDuration,
  formatTime,
  hoursBetween,
  parse,
  weekDays,
} from '../../lib/time'

export function CapacityPanel() {
  const {
    planHours,
    windows,
    availableHours,
    earliestStart,
    deadline,
    generateSchedule,
    estimate,
    commitments,
  } = useDemo()
  const [showConstraints, setShowConstraints] = useState(false)
  const [showRisk, setShowRisk] = useState(false)
  const days = weekDays(DEMO_NOW)
  const fits = availableHours >= planHours
  const buffer = availableHours - planHours
  /** The pessimistic end of the range matters more than the point estimate when
   *  confidence is low — so the check reports both. */
  const worstCase = estimate.highHours
  const worstFits = availableHours >= worstCase
  const worstShort = worstCase - availableHours

  // What the calendar has already claimed inside the usable window.
  const committedHours = commitments.reduce((sum, c) => {
    const start = parse(c.start)
    const end = parse(c.end)
    if (end <= earliestStart || start >= deadline) return sum
    const from = start > earliestStart ? start : earliestStart
    const to = end < deadline ? end : deadline
    return sum + Math.max(0, hoursBetween(from, to))
  }, 0)

  return (
    <div className="p-6">
      <div className="card overflow-hidden">
        {/* Verdict */}
        <div className={clsx('flex items-start gap-3 px-5 py-5', fits ? 'bg-ok-lo' : 'bg-bad-lo')}>
          <CheckCircle2 size={22} className={clsx('mt-0.5 shrink-0', fits ? 'text-ok' : 'text-bad')} />
          <div className="min-w-0">
            <h3 className="font-display text-lg font-semibold leading-snug text-hi">
              {formatDuration(planHours)} fits your available capacity before{' '}
              {formatDayLong(deadline)}.
            </h3>
            <p className="mt-1 text-[14px] leading-relaxed text-mid">
              You have {formatDuration(availableHours)} free between now and the deadline, leaving{' '}
              {formatDuration(buffer)} of slack. You can commit to this.
            </p>
          </div>
        </div>

        <div className="grid gap-px border-y border-hairline bg-hairline sm:grid-cols-3">
          {[
            { label: 'This task needs', value: formatDuration(planHours), tone: 'text-hi' },
            { label: 'Free before deadline', value: formatDuration(availableHours), tone: 'text-hi' },
            {
              label: 'Left over',
              value: formatDuration(buffer),
              tone: buffer > 0 ? 'text-ok' : 'text-bad',
            },
          ].map((s) => (
            <div key={s.label} className="bg-panel px-5 py-4">
              <div className="eyebrow mb-1.5">{s.label}</div>
              <div className={clsx('tnum font-display text-2xl font-bold', s.tone)}>{s.value}</div>
            </div>
          ))}
        </div>

        <div className="px-5 py-5">
          {/* Capacity bar */}
          <div className="mb-6">
            <div className="mb-2 flex items-baseline justify-between">
              <span className="eyebrow">Capacity between now and the deadline</span>
              <span className="tnum text-2xs text-mid">
                {formatDuration(planHours)} of {formatDuration(availableHours)}
              </span>
            </div>
            <div className="flex h-3 overflow-hidden rounded-pill bg-panel-3">
              <div
                className="bg-pink transition-[width] duration-700"
                style={{ width: `${(planHours / availableHours) * 100}%` }}
              />
              <div className="hatch-free flex-1" />
            </div>
          </div>

          {/* The honest part: what happens at the bad end of the range. The
              headline stays visible — it is the warning — but the reasoning
              and the remedy fold away like everything else. */}
          {!worstFits && (
            <div className="mb-6 overflow-hidden rounded-xl border border-warn/35 bg-warn-lo">
              <button
                onClick={() => setShowRisk(!showRisk)}
                className="flex w-full items-start gap-2.5 px-4 py-3 text-left"
              >
                <AlertTriangle size={16} className="mt-0.5 shrink-0 text-warn" />
                <span className="min-w-0 flex-1 font-display text-[14px] font-semibold text-hi">
                  Your best case fits. Your worst case does not.
                </span>
                <ChevronDown
                  size={16}
                  className={clsx(
                    'mt-0.5 shrink-0 text-warn transition-transform',
                    showRisk && 'rotate-180',
                  )}
                />
              </button>

              {showRisk && (
                <div className="animate-fade-in px-4 pb-3.5 pl-[42px]">
                  <p className="text-[13px] leading-relaxed text-mid">
                    The estimate runs to {formatDuration(worstCase)} at the top of the range, and
                    you only have {formatDuration(availableHours)} — a{' '}
                    {formatDuration(worstShort)} shortfall if this turns out to be one of the
                    harder ones. With no tracked history yet, Toggl cannot tell you which it
                    will be.
                  </p>
                  <div className="mt-3 rounded-lg bg-panel px-3 py-2.5">
                    <div className="eyebrow mb-1">What Toggl suggests</div>
                    <p className="text-[13px] leading-relaxed text-mid">
                      Commit to {formatDuration(planHours)} and schedule it now. Toggl will
                      compare tracked time against the plan as you work, and flag it on Tuesday
                      morning if you are running toward the top of the range — while there is
                      still time to renegotiate the date rather than miss it.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Constraints — folded away, like the estimate's reasoning. The
              headline numbers are the point; this is the audit trail. */}
          <div className="mb-6 overflow-hidden rounded-xl border border-hairline">
            <button
              onClick={() => setShowConstraints(!showConstraints)}
              className="flex w-full items-center gap-2 px-4 py-3 text-left font-display text-[13px] font-semibold text-pink transition-colors hover:bg-panel-2"
            >
              <ChevronDown
                size={15}
                className={clsx('transition-transform', showConstraints && 'rotate-180')}
              />
              {showConstraints ? 'Hide' : 'Show'} what shapes when this can happen
            </button>

            {showConstraints && (
              <div className="animate-fade-in border-t border-hairline bg-surface px-4 py-3.5">
                <ul className="space-y-2.5">
                  <li className="flex gap-2.5">
                    <CalendarClock size={15} className="mt-0.5 shrink-0 text-mid" />
                    <div className="min-w-0 text-[13px] leading-relaxed text-mid">
                      Your calendar already holds{' '}
                      <span className="font-display font-semibold text-hi">
                        {formatDuration(committedHours)} of meetings and other client work
                      </span>{' '}
                      between now and the deadline. Only what is left over is offered.
                    </div>
                  </li>
                  <li className="flex gap-2.5">
                    <Lock size={15} className="mt-0.5 shrink-0 text-bad" />
                    <div className="min-w-0 text-[13px] leading-relaxed text-mid">
                      The task is due{' '}
                      <span className="font-display font-semibold text-hi">
                        {formatDayLong(deadline)} {formatTime(deadline)}
                      </span>
                      , so nothing is scheduled past it.
                    </div>
                  </li>
                  <li className="flex gap-2.5">
                    <Eye size={15} className="mt-0.5 shrink-0 text-mid" />
                    <div className="min-w-0 text-[13px] leading-relaxed text-mid">
                      None of this is fixed. Toggl keeps watching the plan after you commit to
                      it, and says so if any of these change.
                    </div>
                  </li>
                </ul>
                <div className="mt-3 flex items-center gap-2 border-t border-hairline pt-3">
                  <span className="eyebrow">Earliest possible start</span>
                  <span className="font-display text-[13px] font-semibold text-hi">
                    {formatDayLong(earliestStart)} {formatTime(earliestStart)}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="mb-4 overflow-hidden rounded-xl border border-hairline">
            <WeekCalendar
              days={days}
              commitments={commitments}
              windows={windows}
              deadline={deadline}
              now={DEMO_NOW}
              mode="plan"
              dimPastDeadline
            />
          </div>
          <CalendarLegend showFree />
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-hairline px-5 py-4">
          <Button size="lg" onClick={generateSchedule}>
            Schedule {formatDuration(planHours)}
            <ArrowRight size={16} />
          </Button>
          <span className="text-[13px] text-mid">
            Toggl will propose blocks that respect all of the above. You can move them.
          </span>
        </div>
      </div>
    </div>
  )
}
