import clsx from 'clsx'
import { useState } from 'react'
import { ChevronDown, Minus, Plus, Sparkles } from 'lucide-react'
import {Button} from '../ui'
import { useDemo } from '../../state/DemoContext'
import { factorTotal } from '../../lib/estimate'
import { formatDuration } from '../../lib/time'
import type { EstimateFactor } from '../../types'

function ConfidenceMeter({ level }: { level: 'Low' | 'Medium' | 'High' }) {
  const filled = { Low: 1, Medium: 2, High: 3 }[level]
  const tone = { Low: 'bg-bad', Medium: 'bg-warn', High: 'bg-ok' }[level]
  return (
    <span className="inline-flex items-center gap-2">
      <span className="flex items-end gap-[3px]">
        {[6, 10, 14].map((h, i) => (
          <span
            key={i}
            className={clsx('w-[4px] rounded-sm', i < filled ? tone : 'bg-panel-3')}
            style={{ height: h }}
          />
        ))}
      </span>
      <span className="font-display text-[15px] font-semibold text-hi">{level}</span>
    </span>
  )
}

function FactorRow({ factor }: { factor: EstimateFactor }) {
  const positive = factor.hours >= 0
  return (
    <div className="flex gap-4 border-t border-hairline py-3 first:border-t-0">
      <div
        className={clsx(
          'tnum w-[74px] shrink-0 pt-0.5 text-right font-display text-[13px] font-semibold',
          factor.baseline ? 'text-hi' : positive ? 'text-bad' : 'text-ok',
        )}
      >
        {factor.baseline ? '' : positive ? '+' : '−'}
        {formatDuration(Math.abs(factor.hours))}
      </div>
      <div className="min-w-0">
        <div className="font-display text-[13px] font-semibold text-hi">{factor.label}</div>
        <p className="mt-0.5 text-[13px] leading-relaxed text-mid">{factor.detail}</p>
        {factor.evidence && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {factor.evidence.map((e) => (
              <span
                key={e}
                className="rounded bg-panel-2 px-1.5 py-0.5 text-2xs text-mid ring-1 ring-hairline"
              >
                {e}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export function EstimatePanel() {
  const { estimate, estimateMode, setEstimateMode, acceptEstimate } = useDemo()
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState<number | null>(null)
  const [editing, setEditing] = useState(false)
  const hours = value ?? estimate.bestHours
  const total = factorTotal(estimate)
  const swatch = ['rgb(var(--c-pink))', 'rgb(var(--c-e-blue))', 'rgb(var(--c-e-lilac))', 'rgb(var(--c-lo))']

  return (
    <div className="p-6">
      <div className="card overflow-hidden">
        <div className="flex items-center gap-2 border-b border-hairline bg-pink-lo px-5 py-3">
          <Sparkles size={15} className="text-pink" />
          <span className="font-display text-[14px] font-semibold text-hi">Estimated effort</span>
          <span className="ml-auto text-2xs text-mid">Prepared when the task landed</span>
        </div>

        <div className="grid gap-6 px-5 py-5 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="tnum font-display text-[42px] font-bold leading-none tracking-tight text-hi">
                {estimate.lowHours}–{estimate.highHours}
              </span>
              <span className="font-display text-lg font-medium text-mid">hours</span>
            </div>
            <p className="mt-3 max-w-lg text-[14px] leading-relaxed text-mid">
              {estimate.summary}
            </p>
          </div>

          <div className="flex gap-8 sm:justify-end">
            <div>
              <div className="eyebrow mb-1.5">Best estimate</div>
              <div className="tnum font-display text-2xl font-bold text-pink">
                {formatDuration(estimate.bestHours)}
              </div>
            </div>
            <div>
              <div className="eyebrow mb-1.5">Confidence</div>
              <ConfidenceMeter level={estimate.confidence} />
            </div>
          </div>
        </div>

        {/* Reasoning */}
        <div className="border-t border-hairline">
          <button
            onClick={() => setOpen(!open)}
            className="flex w-full items-center gap-2 px-5 py-3 text-left font-display text-[13px] font-semibold text-pink transition-colors hover:bg-panel-2"
          >
            <ChevronDown size={15} className={clsx('transition-transform', open && 'rotate-180')} />
            {open ? 'Hide' : 'Show'} how this was calculated
          </button>

          {open && (
            <div className="animate-fade-in space-y-5 border-t border-hairline bg-surface px-5 py-5">
              <div>
                <div className="eyebrow mb-2">Factors</div>
                <div className="rounded-xl border border-hairline bg-panel px-4 py-1">
                  {estimate.factors.map((f) => (
                    <FactorRow key={f.id} factor={f} />
                  ))}
                  <div className="flex gap-4 border-t-2 border-hairline-2 py-3">
                    <div className="tnum w-[74px] shrink-0 text-right font-display text-[13px] font-bold text-hi">
                      {formatDuration(total)}
                    </div>
                    <div className="font-display text-[13px] font-semibold text-hi">
                      Best estimate, rounded to {formatDuration(estimate.bestHours)}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="eyebrow mb-2">What the estimate is drawing on</div>
                <div className="flex h-2 overflow-hidden rounded-pill">
                  {estimate.sources.map((s, i) => (
                    <div key={s.label} style={{ width: `${s.weight}%`, background: swatch[i] }} />
                  ))}
                </div>
                <dl className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2">
                  {estimate.sources.map((s, i) => (
                    <div key={s.label} className="flex gap-2">
                      <span
                        className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                        style={{ background: swatch[i] }}
                      />
                      <div className="min-w-0">
                        <dt className="font-display text-[13px] font-semibold text-hi">
                          {s.label} · {s.weight}%
                        </dt>
                        <dd className="text-2xs leading-snug text-mid">{s.note}</dd>
                      </div>
                    </div>
                  ))}
                </dl>
              </div>

              {estimate.caveat && (
                <p className="rounded-xl border-l-2 border-pink bg-panel px-4 py-3 text-[13px] leading-relaxed text-mid">
                  {estimate.caveat}
                </p>
              )}

              {/* Cold-start comparison — a case-study device, labelled as one. */}
              <div className="rounded-xl border border-dashed border-hairline-2 bg-panel px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-display text-[13px] font-semibold text-hi">
                      See the same task estimated on…
                    </div>
                    <p className="text-2xs text-mid">
                      A demo control, not a product feature — it shows how fast the range tightens
                      once you have any history of your own.
                    </p>
                  </div>
                  <div className="flex rounded-pill bg-surface p-0.5 ring-1 ring-hairline">
                    {(
                      [
                        ['newcomer', 'Day 1 — no history'],
                        ['established', 'Day 5 — two tasks in'],
                      ] as const
                    ).map(([mode, label]) => (
                      <button
                        key={mode}
                        onClick={() => setEstimateMode(mode)}
                        className={clsx(
                          'rounded-pill px-3 py-1.5 font-display text-2xs font-semibold transition-colors',
                          estimateMode === mode
                            ? 'bg-panel text-hi shadow-card'
                            : 'text-mid hover:text-hi',
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3 border-t border-hairline px-5 py-4">
          {editing ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 rounded-pill bg-surface p-1 ring-1 ring-hairline">
                <button
                  onClick={() => setValue(Math.max(0.5, hours - 0.5))}
                  className="grid h-7 w-7 place-items-center rounded-full text-mid hover:bg-panel hover:text-hi"
                  aria-label="Decrease"
                >
                  <Minus size={14} />
                </button>
                <span className="tnum w-[68px] text-center font-display text-[13px] font-bold text-hi">
                  {formatDuration(hours)}
                </span>
                <button
                  onClick={() => setValue(hours + 0.5)}
                  className="grid h-7 w-7 place-items-center rounded-full text-mid hover:bg-panel hover:text-hi"
                  aria-label="Increase"
                >
                  <Plus size={14} />
                </button>
              </div>
              <Button onClick={() => acceptEstimate(hours)}>Use {formatDuration(hours)}</Button>
              <Button
                variant="quiet"
                onClick={() => {
                  setEditing(false)
                  setValue(null)
                }}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <>
              <Button size="lg" onClick={() => acceptEstimate(estimate.bestHours)}>
                Accept {formatDuration(estimate.bestHours)}
              </Button>
              <Button size="lg" variant="ghost" onClick={() => setEditing(true)}>
                Set my own
              </Button>
            </>
          )}
          <span className="ml-auto hidden text-2xs text-lo sm:block">
            This fills the task’s Estimate field. Nothing reaches the client.
          </span>
        </div>
      </div>
    </div>
  )
}
