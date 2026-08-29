import clsx from 'clsx'
import { AlertTriangle, ArrowRight, CheckCircle2, CircleDot, Lock } from 'lucide-react'
import { Button, Note } from '../ui'
import { CalendarLegend, WeekCalendar } from '../WeekCalendar'
import { useDemo } from '../../state/DemoContext'
import { COMMITMENTS, HERO_TASK } from '../../data/demo'
import {
  DEMO_NOW,
  formatDate,
  formatDayLong,
  formatDuration,
  formatRange,
  formatTime,
  hoursBetween,
  parse,
  sameDay,
  weekDays,
} from '../../lib/time'

export function CapacityPanel() {
  const { planHours, windows, availableHours, earliestStart, deadline, generateSchedule, estimate } =
    useDemo()
  const days = weekDays(DEMO_NOW)
  const fits = availableHours >= planHours
  const buffer = availableHours - planHours
  /** The pessimistic end of the range matters more than the point estimate when
   *  confidence is low — so the check reports both. */
  const worstCase = estimate.highHours
  const worstFits = availableHours >= worstCase
  const worstShort = worstCase - availableHours

  const upstream = HERO_TASK.dependencies!.find(
    (d) => d.direction === 'upstream' && d.state !== 'done',
  )!

  const byDay = days
    .map((d) => ({ day: d, wins: windows.filter((w) => sameDay(w.start, d)) }))
    .filter((g) => g.wins.length > 0)

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

          {/* The honest part: what happens at the bad end of the range. */}
          {!worstFits && (
            <div className="mb-6 rounded-xl border border-warn/35 bg-warn-lo px-4 py-3.5">
              <div className="flex items-start gap-2.5">
                <AlertTriangle size={16} className="mt-0.5 shrink-0 text-warn" />
                <div className="min-w-0">
                  <div className="font-display text-[14px] font-semibold text-hi">
                    Your best case fits. Your worst case does not.
                  </div>
                  <p className="mt-1 text-[13px] leading-relaxed text-mid">
                    The estimate runs to {formatDuration(worstCase)} at the top of the range, and
                    you only have {formatDuration(availableHours)} — a{' '}
                    {formatDuration(worstShort)} shortfall if this turns out to be one of the
                    harder ones. With no tracked history yet, Toggl cannot tell you which it will
                    be.
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
              </div>
            </div>
          )}

          {/* Constraints */}
          <div className="mb-6 rounded-xl border border-hairline bg-surface px-4 py-3.5">
            <div className="eyebrow mb-2.5">What constrains when this can start</div>
            <ul className="space-y-2.5">
              <li className="flex gap-2.5">
                <CircleDot size={15} className="mt-0.5 shrink-0 text-warn" />
                <div className="min-w-0 text-[13px] leading-relaxed">
                  <span className="font-display font-semibold text-hi">
                    {upstream.title} ({upstream.id})
                  </span>{' '}
                  <span className="text-mid">
                    is still open with {upstream.owner}. Expected to land at{' '}
                    {formatTime(parse(upstream.clearsAt!))} today — so nothing is scheduled
                    before then.
                  </span>
                </div>
              </li>
              <li className="flex gap-2.5">
                <Lock size={15} className="mt-0.5 shrink-0 text-bad" />
                <div className="min-w-0 text-[13px] leading-relaxed">
                  <span className="font-display font-semibold text-hi">
                    Integration testing (INF-244)
                  </span>{' '}
                  <span className="text-mid">
                    is booked for Thursday 09:00. That is what sets the {formatDayLong(deadline)}{' '}
                    {formatTime(deadline)} deadline — not an arbitrary date.
                  </span>
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

          {/* Day by day */}
          <div className="mb-6">
            <div className="eyebrow mb-2.5">Where the free time actually is</div>
            <ul className="divide-y divide-hairline rounded-xl border border-hairline">
              {byDay.map(({ day, wins }) => {
                const total = wins.reduce((s, w) => s + hoursBetween(w.start, w.end), 0)
                const busy = COMMITMENTS.filter((c) => sameDay(parse(c.start), day))
                return (
                  <li key={day.toISOString()} className="flex gap-4 px-4 py-3">
                    <div className="w-[104px] shrink-0">
                      <div className="font-display text-[13px] font-semibold text-hi">
                        {formatDayLong(day)}
                      </div>
                      <div className="text-2xs text-lo">{formatDate(day)}</div>
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      {busy.map((c) => (
                        <div key={c.id} className="flex items-baseline gap-2 text-[13px]">
                          <span className="tnum w-[86px] shrink-0 text-mid">
                            {formatRange(parse(c.start), parse(c.end))}
                          </span>
                          <span className="truncate text-mid">{c.title}</span>
                        </div>
                      ))}
                      {wins.map((w, i) => (
                        <div key={i} className="flex items-baseline gap-2 text-[13px]">
                          <span className="tnum w-[86px] shrink-0 font-semibold text-ok">
                            {formatRange(w.start, w.end)}
                          </span>
                          <span className="font-display font-semibold text-ok">Available</span>
                        </div>
                      ))}
                    </div>
                    <div className="tnum shrink-0 self-center font-display text-[13px] font-semibold text-ok">
                      {formatDuration(total)}
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>

          <div className="mb-4 overflow-hidden rounded-xl border border-hairline">
            <WeekCalendar
              days={days}
              commitments={COMMITMENTS}
              windows={windows}
              deadline={deadline}
              now={DEMO_NOW}
              mode="plan"
              dimPastDeadline
            />
          </div>
          <CalendarLegend showFree />

          <div className="mt-5">
            <Note title="Why this is the moment that matters">
              Estimation on its own is cheap — plenty of tools will guess a number. The
              commitment problem is not “how long is this?”, it is “can I actually fit this?”.
              Toggl is one of very few products already holding both halves: the estimate
              signal and the real calendar. This screen is the join, and it is why the concept
              belongs in Toggl rather than in a project tracker.
            </Note>
          </div>
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
