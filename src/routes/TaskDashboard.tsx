import clsx from 'clsx'
import { useState } from 'react'
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Link2,
  MoreVertical,
  Sparkles,
  TrendingDown,
  Wallet,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button, Note, StatStrip, Tabs, ToolbarPill } from '../components/ui'
import { useDemo } from '../state/DemoContext'
import { HERO_TASK, PROJECTS, USER } from '../data/demo'
import { accuracyPct } from '../lib/estimate'
import { formatDuration, formatRange, hoursBetween, parse } from '../lib/time'

/* ------------------------------------------------ actual vs estimated time */

/** Working-time axis: Monday 13:00–17:00, then Tuesday 09:00–17:00. */
function axisPos(d: Date): number {
  const h = d.getHours() + d.getMinutes() / 60
  return d.getDay() === 1 ? h - 13 : 4 + (h - 9)
}
const AXIS_MAX = 12

const TICKS = [
  { at: 0, label: 'Mon 13:00' },
  { at: 2, label: '15:00' },
  { at: 4, label: 'Mon 17:00' },
  { at: 6, label: 'Tue 11:00' },
  { at: 8, label: '13:00' },
  { at: 10, label: '15:00' },
  { at: 12, label: 'Tue 17:00' },
]

function BurnUpChart() {
  const { entries, slots, planHours } = useDemo()
  const W = 780
  const H = 260
  const P = { t: 16, r: 20, b: 34, l: 46 }
  const yMax = 12

  const x = (v: number) => P.l + (v / AXIS_MAX) * (W - P.l - P.r)
  const y = (v: number) => P.t + (1 - v / yMax) * (H - P.t - P.b)

  // Cumulative planned, from the scheduled blocks.
  const planned: [number, number][] = [[0, 0]]
  let pAcc = 0
  for (const s of slots) {
    const st = parse(s.start)
    const en = parse(s.end)
    planned.push([axisPos(st), pAcc])
    pAcc += hoursBetween(st, en)
    planned.push([axisPos(en), pAcc])
  }

  // Cumulative logged, from the tracked entries.
  const logged: [number, number][] = [[0, 0]]
  let lAcc = 0
  for (const e of entries) {
    const st = parse(e.start)
    const en = parse(e.end)
    logged.push([axisPos(st), lAcc])
    lAcc += hoursBetween(st, en)
    logged.push([axisPos(en), lAcc])
  }

  const path = (pts: [number, number][]) =>
    pts.map(([px, py], i) => `${i ? 'L' : 'M'}${x(px).toFixed(1)},${y(py).toFixed(1)}`).join(' ')

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-[260px] w-full min-w-[640px]" role="img">
        <title>Cumulative logged time against the planned curve</title>

        {[0, 2, 4, 6, 8, 10, 12].map((v) => (
          <g key={v}>
            <line
              x1={P.l}
              x2={W - P.r}
              y1={y(v)}
              y2={y(v)}
              stroke="rgb(var(--c-hairline))"
              strokeWidth="1"
            />
            <text
              x={P.l - 8}
              y={y(v) + 4}
              textAnchor="end"
              className="fill-[rgb(var(--c-lo))] text-[10px]"
            >
              {v}h
            </text>
          </g>
        ))}

        {TICKS.map((t) => (
          <text
            key={t.label}
            x={x(t.at)}
            y={H - 12}
            textAnchor="middle"
            className="fill-[rgb(var(--c-lo))] text-[10px]"
          >
            {t.label}
          </text>
        ))}

        {/* The estimate the user committed to */}
        <line
          x1={P.l}
          x2={W - P.r}
          y1={y(planHours)}
          y2={y(planHours)}
          stroke="rgb(var(--c-mid))"
          strokeWidth="1.5"
          strokeDasharray="5 4"
        />
        <text
          x={W - P.r}
          y={y(planHours) - 7}
          textAnchor="end"
          className="fill-[rgb(var(--c-mid))] text-[10px]"
        >
          Estimate: {formatDuration(planHours)}
        </text>

        {/* Planned curve */}
        <path
          d={path(planned)}
          fill="none"
          stroke="rgb(var(--c-e-blue))"
          strokeWidth="2"
          strokeDasharray="4 4"
          strokeLinejoin="round"
        />
        {/* Logged curve */}
        <path
          d={path(logged)}
          fill="none"
          stroke="rgb(var(--c-pink))"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {logged.length > 1 && (
          <circle
            cx={x(logged[logged.length - 1][0])}
            cy={y(logged[logged.length - 1][1])}
            r="4"
            fill="rgb(var(--c-pink))"
          />
        )}
      </svg>

      <div className="flex flex-wrap items-center gap-5 pl-11 pt-1">
        <span className="inline-flex items-center gap-2 text-2xs text-mid">
          <span className="h-0.5 w-5 rounded bg-pink" /> Logged time
        </span>
        <span className="inline-flex items-center gap-2 text-2xs text-mid">
          <span className="h-0.5 w-5 rounded border-t-2 border-dashed border-e-blue" /> Planned
        </span>
        <span className="inline-flex items-center gap-2 text-2xs text-mid">
          <span className="h-0.5 w-5 rounded border-t-2 border-dashed border-mid" /> Estimate
        </span>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ page -- */

export function TaskDashboard() {
  const navigate = useNavigate()
  const { entries, trackedHours, planHours, phase, report } = useDemo()
  const [tab, setTab] = useState('dashboard')
  const project = PROJECTS.find((p) => p.id === HERO_TASK.projectId)!

  const variance = trackedHours - planHours
  const acc = accuracyPct(planHours, trackedHours)
  const amount = trackedHours * project.rate

  const finished = phase === 'complete' || phase === 'reported'

  return (
    <div className="scrollbar-slim min-h-0 flex-1 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 px-5 pb-1 pt-4">
        <button
          onClick={() => navigate('/tasks')}
          className="grid h-8 w-8 place-items-center rounded-pill text-mid hover:bg-panel-2 hover:text-hi"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="h-5 w-5 shrink-0 rounded bg-e-pink" />
        <h1 className="min-w-0 font-display text-[21px] font-semibold text-hi">
          {HERO_TASK.title}
        </h1>
        <span className="font-display text-[13px] uppercase tracking-wide text-mid">
          {project.name} · {project.client}
        </span>
        <MoreVertical size={17} className="text-mid" />

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <ToolbarPill caret>Saved views</ToolbarPill>
          <ToolbarPill>Invite</ToolbarPill>
          <Button size="md" variant="secondary">
            Save view
          </Button>
          <span className="grid h-9 w-9 place-items-center rounded-pill border border-hairline-2 text-mid">
            <Link2 size={15} />
          </span>
        </div>
      </div>

      <div className="mt-3">
        <Tabs
          tabs={[
            { id: 'overview', label: 'Overview', enabled: false },
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'entries', label: 'Time entries' },
            { id: 'members', label: 'Members', enabled: false },
          ]}
          active={tab}
          onChange={setTab}
        />
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2 px-5 py-4">
        <ToolbarPill caret>
          <Wallet size={13} /> Shown in {project.currency}
        </ToolbarPill>
        <ToolbarPill caret>
          Show: <span className="text-hi">Time progress</span>
        </ToolbarPill>
      </div>

      <div className="space-y-4 px-5 pb-10">
        <StatStrip
          items={[
            { label: 'Estimated time', value: formatDuration(planHours) },
            { label: 'Logged time', value: formatDuration(trackedHours) },
            {
              label: 'Variance',
              value: `${variance <= 0 ? '−' : '+'}${formatDuration(Math.abs(variance))}`,
              tone: variance <= 0 ? 'ok' : 'bad',
            },
            { label: 'Estimate accuracy', value: `${acc}%`, tone: acc >= 90 ? 'ok' : 'warn' },
            {
              label: 'Amount',
              value: `${amount.toFixed(2)} ${project.currency}`,
              sub: `${project.rate}.00 ${project.currency}/h · billable`,
            },
          ]}
        />

        {tab === 'dashboard' && (
          <>
            <div className="card">
              <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <h3 className="font-display text-[15px] font-semibold text-hi">
                  Actual vs estimated time
                </h3>
                <ToolbarPill caret>Logged time</ToolbarPill>
              </div>
              <div className="px-3 pb-4">
                <BurnUpChart />
              </div>
            </div>

            {finished && (
              <div className="card animate-fade-up overflow-hidden">
                <div className="flex items-start gap-3 bg-ok-lo px-5 py-4">
                  <TrendingDown size={20} className="mt-0.5 shrink-0 text-ok" />
                  <div>
                    <h3 className="font-display text-[15px] font-semibold text-hi">
                      Finished {formatDuration(Math.abs(variance))} inside the estimate.
                    </h3>
                    <p className="mt-1 text-[13px] leading-relaxed text-mid">
                      {formatDuration(trackedHours)} against {formatDuration(planHours)} —{' '}
                      {acc}% accurate. Close enough that the model treats this as a confirming
                      example rather than a correction.
                    </p>
                  </div>
                </div>

                <div className="grid gap-px bg-hairline sm:grid-cols-3">
                  {[
                    {
                      k: 'Comparable set',
                      v: '3 → 4 tasks',
                      d: 'This task joins the component baseline.',
                    },
                    {
                      k: 'Next similar estimate',
                      v: '9–11h',
                      d: 'The range narrows from 8–12h.',
                    },
                    {
                      k: 'Confidence',
                      v: 'Medium → High',
                      d: 'Four close comparables, one open dependency pattern learned.',
                    },
                  ].map((r) => (
                    <div key={r.k} className="bg-panel px-5 py-4">
                      <div className="eyebrow mb-1.5">{r.k}</div>
                      <div className="font-display text-[17px] font-bold text-hi">{r.v}</div>
                      <p className="mt-1 text-2xs leading-snug text-mid">{r.d}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-4 px-5 py-4">
                  <p className="text-[13px] leading-relaxed text-mid">
                    The dependency factor is the interesting one. This task carried{' '}
                    <strong className="text-hi">+1h for an unfinished API</strong> and the rework
                    never materialised, because the contract landed on time. One example is not
                    evidence — but if the next two behave the same way, that contingency shrinks
                    on its own.
                  </p>
                  <Note title="Guarding against stale history">
                    Estimates weight recent work more heavily on purpose. Component tasks here
                    got roughly 15% faster once an AI coding assistant entered the workflow — a
                    model averaging a flat year of history would still be quoting the old pace
                    and quietly overcharging the client. The learning loop has to be able to
                    forget.
                  </Note>
                </div>

                {phase === 'complete' && (
                  <div className="flex flex-wrap items-center gap-3 border-t border-hairline px-5 py-4">
                    <Button size="lg" onClick={() => { report(); navigate('/reports') }}>
                      Create client report
                    </Button>
                    <span className="text-[13px] text-mid">
                      Built from tracked time — nothing to reconstruct.
                    </span>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Session breakdown */}
        <div className="card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
            <h3 className="font-display text-[15px] font-semibold text-hi">Session breakdown</h3>
            <div className="flex flex-wrap gap-2">
              <ToolbarPill caret>
                Breakdown by: <span className="text-hi">Session</span>
              </ToolbarPill>
              <ToolbarPill caret>
                and: <span className="text-hi">Activity</span>
              </ToolbarPill>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] border-collapse">
              <thead>
                <tr className="border-y border-hairline text-left">
                  {['Session | activity', 'Logged time', 'Revenue', 'Source', 'Billable'].map(
                    (h, i) => (
                      <th
                        key={h}
                        className={clsx(
                          'py-2.5 font-display text-2xs font-semibold uppercase tracking-[0.08em] text-mid',
                          i === 0 ? 'pl-5' : 'text-right',
                          i === 4 && 'pr-5',
                        )}
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => {
                  const s = parse(e.start)
                  const en = parse(e.end)
                  const h = hoursBetween(s, en)
                  return (
                    <tr key={e.id} className="border-b border-hairline">
                      <td className="py-3 pl-5">
                        <div className="flex items-center gap-2">
                          <ChevronRight size={14} className="text-lo" />
                          <div>
                            <div className="font-display text-[13px] font-medium text-hi">
                              {e.activity}
                            </div>
                            <div className="tnum text-2xs text-mid">
                              {s.toLocaleDateString('en-GB', { weekday: 'short' })}{' '}
                              {formatRange(s, en)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="tnum py-3 text-right font-display text-[13px] text-hi">
                        {formatDuration(h)}
                      </td>
                      <td className="tnum py-3 text-right font-display text-[13px] text-hi">
                        {(h * project.rate).toFixed(2)} {project.currency}
                      </td>
                      <td className="py-3 text-right">
                        <span className="rounded bg-panel-3 px-1.5 py-0.5 text-2xs font-semibold text-mid">
                          auto
                        </span>
                      </td>
                      <td className="py-3 pr-5 text-right text-[13px] text-mid">Yes</td>
                    </tr>
                  )
                })}
                <tr className="bg-surface">
                  <td className="py-3 pl-5 font-display text-[13px] font-semibold text-hi">
                    {USER.name} ({entries.length})
                  </td>
                  <td className="tnum py-3 text-right font-display text-[13px] font-bold text-hi">
                    {formatDuration(trackedHours)}
                  </td>
                  <td className="tnum py-3 text-right font-display text-[13px] font-bold text-hi">
                    {amount.toFixed(2)} {project.currency}
                  </td>
                  <td className="py-3" />
                  <td className="py-3 pr-5" />
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-end gap-2 px-5 py-3 text-[13px] text-mid">
            <span className="inline-flex items-center gap-1 rounded border border-hairline-2 px-2 py-0.5">
              1 <ChevronDown size={12} />
            </span>
            of 1
            <ChevronLeft size={15} />
            <ChevronRight size={15} />
          </div>
        </div>

        {!finished && (
          <div className="rounded-xl border border-dashed border-hairline-2 px-5 py-8 text-center">
            <Sparkles size={18} className="mx-auto mb-2 text-lo" />
            <p className="text-[13px] text-mid">
              Variance and accuracy fill in once the task is complete. Run the week from the
              Timer to get there.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
