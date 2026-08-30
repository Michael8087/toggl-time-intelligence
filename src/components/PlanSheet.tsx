import clsx from 'clsx'
import { Check, X } from 'lucide-react'
import { useDemo } from '../state/DemoContext'
import { HERO_TASK } from '../data/demo'
import { EstimatePanel } from './plan/EstimatePanel'
import { CapacityPanel } from './plan/CapacityPanel'
import { SchedulePanel } from './plan/SchedulePanel'

const STEPS = [
  { id: 'estimate', n: 1, label: 'Estimate' },
  { id: 'capacity', n: 2, label: 'Capacity' },
  { id: 'schedule', n: 3, label: 'Schedule' },
] as const

/**
 * The planning flow. One focused surface for a one-time decision, rather than
 * three screens the user has to navigate between — the whole point is that
 * estimate, capacity and schedule are a single thought.
 */
export function PlanSheet() {
  const { phase, setPhase, variant } = useDemo()
  // B hands off to the Timer once the estimate is settled, so the sheet has
  // one step and no capacity or schedule tabs.
  const steps = variant === 'B' ? STEPS.slice(0, 1) : STEPS
  const current = steps.findIndex((s) => s.id === phase)

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-8">
      <div className="absolute inset-0 animate-fade-in bg-black/45" onClick={() => setPhase('intake')} />

      <div className="relative flex max-h-full w-full max-w-[1060px] animate-fade-up flex-col overflow-hidden rounded-2xl border border-hairline bg-panel shadow-pop">
        {/* Header */}
        <div className="flex shrink-0 items-center gap-4 border-b border-hairline px-6 py-4">
          <div className="min-w-0">
            <div className="eyebrow">Plan task</div>
            <h2 className="truncate font-display text-[17px] font-semibold text-hi">
              {HERO_TASK.title}
            </h2>
          </div>

          <ol className="ml-auto hidden items-center gap-1 md:flex">
            {steps.map((s, i) => {
              const done = i < current
              const active = i === current
              return (
                <li key={s.id} className="flex items-center gap-1">
                  <button
                    onClick={() => done && setPhase(s.id)}
                    disabled={!done && !active}
                    className={clsx(
                      'flex items-center gap-2 rounded-pill px-3 py-1.5 font-display text-[13px] transition-colors',
                      active && 'bg-pink-lo font-semibold text-pink',
                      done && 'font-medium text-mid hover:bg-panel-2 hover:text-hi',
                      !active && !done && 'text-lo',
                    )}
                  >
                    <span
                      className={clsx(
                        'grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold',
                        active
                          ? 'bg-pink text-white'
                          : done
                            ? 'bg-ok-lo text-ok'
                            : 'bg-panel-3 text-lo',
                      )}
                    >
                      {done ? <Check size={11} strokeWidth={3} /> : s.n}
                    </span>
                    {s.label}
                  </button>
                  {i < steps.length - 1 && <span className="h-px w-4 bg-hairline-2" />}
                </li>
              )
            })}
          </ol>

          <button
            onClick={() => setPhase('intake')}
            className="shrink-0 text-mid hover:text-hi"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="scrollbar-slim min-h-0 flex-1 overflow-y-auto bg-surface">
          {phase === 'estimate' && <EstimatePanel />}
          {phase === 'capacity' && <CapacityPanel />}
          {phase === 'schedule' && <SchedulePanel />}
        </div>
      </div>
    </div>
  )
}
