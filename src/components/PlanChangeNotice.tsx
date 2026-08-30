import clsx from 'clsx'
import { ArrowRight, Eye, Pencil, X } from 'lucide-react'
import {Button} from './ui'
import { useDemo } from '../state/DemoContext'
import { PLAN_CHANGES } from '../data/demo'
import { formatDayLong, formatDuration, formatRange, hoursBetween, parse } from '../lib/time'

/**
 * Plan maintenance, not project management.
 *
 * The claim is never "your dependency is blocked" — Toggl has no dependency
 * graph and should not pretend to. It is "something changed, and your plan may
 * no longer be realistic", followed by what changed, what it costs, and a
 * concrete adjustment the user can take or overrule.
 */
export function PlanChangeNotice() {
  const { activeChange, acceptChange, dismissChange, setPhase, planHours, trackedHours } =
    useDemo()
  if (!activeChange) return null

  /* Copy that cites live numbers has to read them, not assert them — a notice
     claiming "6h tracked" above a bar reading 4h destroys the whole point. */
  const fill = (text: string) =>
    text
      .replace('{tracked}', formatDuration(trackedHours))
      .replace('{estimate}', formatDuration(planHours))

  return (
    <div className="animate-fade-up border-b border-hairline bg-warn-lo/50">
      <div className="px-5 py-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-warn/20">
            <Eye size={14} className="text-warn" />
          </span>

          <div className="min-w-0 flex-1">
            <h3 className="font-display text-[16px] font-semibold text-hi">
              Your plan needs an adjustment
            </h3>

            {/* What Toggl noticed */}
            <p className="mt-1.5 text-[14px] leading-relaxed text-hi">
              {activeChange.signal}.{' '}
              <span className="text-mid">{fill(activeChange.detail)}</span>
            </p>

            <div className="mt-2 flex flex-wrap gap-1.5">
              {activeChange.evidence.map((e) => (
                <span
                  key={e}
                  className="rounded bg-panel px-1.5 py-0.5 text-2xs text-mid ring-1 ring-hairline"
                >
                  {fill(e)}
                </span>
              ))}
            </div>

            {/* What it costs */}
            <div className="mt-3 rounded-lg border border-hairline bg-panel px-4 py-3">
              <div className="eyebrow mb-1">What it means for your plan</div>
              <p className="text-[13px] leading-relaxed text-mid">{fill(activeChange.impact)}</p>

              <div className="my-3 h-px bg-hairline" />

              <div className="eyebrow mb-1">Suggested change</div>
              <p className="text-[13px] leading-relaxed text-hi">{fill(activeChange.suggestion)}</p>

              {activeChange.revisedEstimate && (
                <div className="mt-2.5 inline-flex items-center gap-2 rounded-pill bg-panel-2 px-2.5 py-1">
                  <span className="tnum font-display text-2xs text-mid line-through">
                    {formatDuration(planHours)}
                  </span>
                  <ArrowRight size={11} className="text-lo" />
                  <span className="tnum font-display text-2xs font-semibold text-hi">
                    {formatDuration(activeChange.revisedEstimate)} estimate
                  </span>
                </div>
              )}
            </div>

            <div className="mt-3.5 flex flex-wrap items-center gap-2">
              <Button onClick={acceptChange}>Accept changes</Button>
              <Button
                variant="ghost"
                onClick={() => {
                  dismissChange()
                  setPhase('schedule')
                }}
              >
                <Pencil size={14} />
                Adjust manually
              </Button>
              <span className="text-2xs text-mid">
                Nothing moves until you choose.
              </span>
            </div>
          </div>

          <button
            onClick={dismissChange}
            className="shrink-0 text-mid hover:text-hi"
            aria-label="Dismiss"
          >
            <X size={17} />
          </button>
        </div>
      </div>
    </div>
  )
}

/** Confirmation strip shown after an adjustment is accepted. */
export function PlanAdjustedNotice() {
  const { slots, appliedChanges, planHours } = useDemo()
  if (!appliedChanges.length) return null
  const last = slots[slots.length - 1]

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-hairline bg-ok-lo px-5 py-2.5">
      <span className="text-[13px] text-hi">
        <span className="font-display font-semibold">Plan updated.</span>{' '}
        <span className="text-mid">
          {formatDuration(planHours)} still fits before the deadline
          {last &&
            `, now finishing ${formatDayLong(parse(last.end))} ${formatRange(
              parse(last.start),
              parse(last.end),
            )}`}
          .
        </span>
      </span>
    </div>
  )
}

/**
 * The demo control that makes reality diverge. Three different signals, so the
 * mechanism reads as general rather than as a "you are behind" alarm.
 */
export function ChangeTrigger() {
  const { raiseChange, activeChange, appliedChanges, slots, trackedHours, phase, simRunning, simDone } =
    useDemo()
  if (!slots.length || activeChange) return null

  const remaining = PLAN_CHANGES.filter((c) => !appliedChanges.includes(c.id))
  if (!remaining.length) return null

  /* The clock has stopped part-way through the week — the moment where a
     divergence would actually land. Draw the eye, but say it is optional:
     the run continues perfectly well without one. */
  const waiting = phase === 'working' && !simRunning && !simDone && trackedHours > 0

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-hairline bg-panel px-5 py-2">
      <span
        // Re-keyed so the three blinks replay each time the clock stops.
        key={waiting ? 'waiting' : 'idle'}
        className={clsx(
          'font-display text-2xs font-semibold uppercase tracking-[0.1em]',
          waiting ? 'animate-blink text-pink' : 'text-lo',
        )}
      >
        Simulate a change
      </span>
      {remaining.map((c) => (
        <button
          key={c.id}
          onClick={() => raiseChange(c)}
          disabled={c.id === 'slower-than-planned' && trackedHours < 4}
          className={clsx(
            'inline-flex h-7 items-center rounded-pill border border-hairline-2 px-3',
            'font-display text-2xs font-medium text-mid transition-colors',
            'hover:border-lo hover:text-hi disabled:opacity-40',
          )}
          title={
            c.id === 'slower-than-planned' && trackedHours < 4
              ? 'Needs some tracked time first'
              : undefined
          }
        >
          {c.option}
        </button>
      ))}
      <span className={clsx('text-2xs', waiting ? 'text-mid' : 'text-lo')}>
        {waiting
          ? '· try one, or just carry on — the week runs either way'
          : '· each is a different signal, not the same alarm'}
      </span>
    </div>
  )
}

/** Hours currently scheduled, for callers that need it. */
export const scheduledHours = (slots: { start: string; end: string }[]) =>
  slots.reduce((s, x) => s + hoursBetween(parse(x.start), parse(x.end)), 0)
