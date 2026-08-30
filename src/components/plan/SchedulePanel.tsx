import clsx from 'clsx'
import { AlertTriangle, CheckCircle2, Hand, RefreshCw } from 'lucide-react'
import { Button, Note } from '../ui'
import { CalendarLegend, WeekCalendar } from '../WeekCalendar'
import { useDemo } from '../../state/DemoContext'

import {
  DEMO_NOW,
  formatDayLong,
  formatDuration,
  formatRange,
  hoursBetween,
  parse,
  weekDays,
} from '../../lib/time'

export function SchedulePanel() {
  const {
    slots,
    planHours,
    windows,
    check,
    deadline,
    updateSlot,
    generateSchedule,
    confirmSchedule,
    commitments,
  } = useDemo()
  const days = weekDays(DEMO_NOW)
  const edited = !check.ok

  return (
    <div className="p-6">
      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b border-hairline bg-pink-lo px-5 py-3">
          <span className="font-display text-[14px] font-semibold text-hi">Proposed schedule</span>
          <span className="ml-auto text-2xs text-mid">
            Earliest fit that respects your calendar, the dependency and the deadline
          </span>
        </div>

        <div className="px-5 py-5">
          <ul className="mb-5 divide-y divide-hairline rounded-xl border border-hairline">
            {slots.map((slot) => {
              const s = parse(slot.start)
              const e = parse(slot.end)
              return (
                <li key={slot.id} className="flex items-center gap-4 px-4 py-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-pink-lo font-display text-2xs font-bold text-pink">
                    {s.getDate()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="font-display text-[13px] font-semibold text-hi">
                      {formatDayLong(s)}
                    </div>
                    <div className="tnum text-[13px] text-mid">{formatRange(s, e)}</div>
                  </div>
                  <span className="tnum font-display text-[13px] font-semibold text-hi">
                    {formatDuration(hoursBetween(s, e))}
                  </span>
                </li>
              )
            })}
            <li className="flex items-center gap-4 bg-surface px-4 py-3">
              <span className="w-8 shrink-0" />
              <span className="flex-1 font-display text-[13px] font-semibold text-hi">
                Total scheduled
              </span>
              <span
                className={clsx(
                  'tnum font-display text-[13px] font-bold',
                  check.ok ? 'text-ok' : 'text-bad',
                )}
              >
                {formatDuration(check.scheduledHours)} / {formatDuration(planHours)}
              </span>
            </li>
          </ul>

          <div
            className={clsx(
              'mb-5 flex items-start gap-2.5 rounded-xl px-4 py-3',
              check.ok ? 'bg-ok-lo' : 'bg-warn-lo',
            )}
          >
            {check.ok ? (
              <CheckCircle2 size={17} className="mt-px shrink-0 text-ok" />
            ) : (
              <AlertTriangle size={17} className="mt-px shrink-0 text-warn" />
            )}
            <div className="min-w-0 text-[13px] leading-relaxed">
              {check.ok ? (
                <span className="text-hi">
                  No conflicts. Every block sits in free time, starts after the navigation API
                  lands, and finishes before {formatDayLong(deadline)} 17:00.
                </span>
              ) : (
                <ul className="space-y-1">
                  {check.issues.map((i, k) => (
                    <li key={k} className="text-warn">
                      {i.message}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="mb-3 flex items-center gap-2 text-[13px] text-mid">
            <Hand size={14} className="text-pink" />
            Drag a block to another time or day, or drag its bottom edge to resize. Everything
            re-checks as you move it.
          </div>

          <div className="mb-4 overflow-hidden rounded-xl border border-hairline">
            <WeekCalendar
              days={days}
              commitments={commitments}
              windows={windows}
              slots={slots}
              editable
              onChangeSlot={updateSlot}
              deadline={deadline}
              now={DEMO_NOW}
              mode="plan"
              dimPastDeadline
            />
          </div>
          <CalendarLegend showFree />

          <div className="mt-5">
            <Note title="On automation that can be overruled">
              The scheduler fills the earliest free windows first and never optimises past what
              a person can follow — you can read the result and see why each block landed where
              it did. Every proposal stays draggable, and validation re-runs on release rather
              than silently repairing your edit. Automation the user cannot overrule is
              automation they stop trusting the first time it is wrong.
            </Note>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-hairline px-5 py-4">
          <Button
            size="lg"
            onClick={confirmSchedule}
            disabled={check.issues.some((i) => i.level === 'error')}
          >
            Add to my calendar
          </Button>
          {edited && (
            <Button variant="ghost" onClick={generateSchedule}>
              <RefreshCw size={15} />
              Reset to Toggl’s proposal
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
