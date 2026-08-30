import clsx from 'clsx'
import {StatStrip, ToolbarPill} from '../components/ui'
import { useDemo } from '../state/DemoContext'
import { accuracyPct, estimateHistory } from '../lib/estimate'
import { HERO_TASK, USER } from '../data/demo'
import { formatDuration } from '../lib/time'

/** Task titles are too long for an axis; the first two words identify them. */
const shortLabel = (title: string) => title.split(' ').slice(0, 2).join(' ')

export function SummaryPage() {
  const { phase, planHours, trackedHours } = useDemo()
  const done = phase === 'complete' || phase === 'reported'
  const history = estimateHistory()

  const rows = [
    ...history,
    ...(done
      ? [
          {
            id: HERO_TASK.ref,
            title: HERO_TASK.title,
            estimateHours: planHours,
            actualHours: trackedHours,
            completedAt: '2026-09-15',
            accuracy: accuracyPct(planHours, trackedHours),
          },
        ]
      : []),
  ]

  const mean = Math.round(rows.reduce((s, r) => s + r.accuracy, 0) / rows.length)
  const recent = rows.slice(-3)
  const recentMean = Math.round(recent.reduce((s, r) => s + r.accuracy, 0) / recent.length)

  const W = 720
  const H = 190
  const P = { t: 14, r: 16, b: 28, l: 36 }
  const x = (i: number) => P.l + (i / Math.max(1, rows.length - 1)) * (W - P.l - P.r)
  const y = (v: number) => P.t + (1 - (v - 60) / 40) * (H - P.t - P.b)

  return (
    <div className="scrollbar-slim min-h-0 flex-1 overflow-y-auto">
      <div className="flex flex-wrap items-center gap-3 px-5 pb-3 pt-4">
        <h1 className="font-display text-[21px] font-semibold text-hi">
          My Summary <span className="text-lo">· Estimate accuracy</span>
        </h1>
        <div className="ml-auto flex flex-wrap gap-2">
          <ToolbarPill caret>Last 90 days</ToolbarPill>
          <ToolbarPill caret>All projects</ToolbarPill>
        </div>
      </div>

      <div className="space-y-4 px-5 pb-10">
        <StatStrip
          items={[
            { label: 'Tasks estimated', value: rows.length },
            { label: 'Mean accuracy', value: `${mean}%` },
            {
              label: 'Last three',
              value: `${recentMean}%`,
              tone: recentMean >= mean ? 'ok' : 'warn',
              sub: recentMean >= mean ? 'Improving' : 'Slipping',
            },
            { label: 'Weeks tracked', value: USER.weeksTracked },
          ]}
        />

        <div className="card">
          <div className="px-5 py-4">
            <h3 className="font-display text-[15px] font-semibold text-hi">
              Estimate accuracy over time
            </h3>
            <p className="mt-0.5 text-[13px] text-mid">
              Every completed task moves the model. This is the loop the concept closes.
            </p>
          </div>

          <div className="overflow-x-auto px-3 pb-4">
            <svg viewBox={`0 0 ${W} ${H}`} className="h-[190px] w-full min-w-[560px]">
              {[60, 70, 80, 90, 100].map((v) => (
                <g key={v}>
                  <line
                    x1={P.l}
                    x2={W - P.r}
                    y1={y(v)}
                    y2={y(v)}
                    stroke="rgb(var(--c-hairline))"
                  />
                  <text
                    x={P.l - 8}
                    y={y(v) + 4}
                    textAnchor="end"
                    className="fill-[rgb(var(--c-lo))] text-[10px]"
                  >
                    {v}%
                  </text>
                </g>
              ))}

              <path
                d={rows
                  .map((r, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(r.accuracy).toFixed(1)}`)
                  .join(' ')}
                fill="none"
                stroke="rgb(var(--c-pink))"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />

              {rows.map((r, i) => (
                <g key={r.id}>
                  <circle
                    cx={x(i)}
                    cy={y(r.accuracy)}
                    r={i === rows.length - 1 && done ? 5 : 3.5}
                    fill="rgb(var(--c-pink))"
                  />
                  <text
                    x={x(i)}
                    y={H - 10}
                    textAnchor="middle"
                    className="fill-[rgb(var(--c-lo))] text-[9px]"
                  >
                    {shortLabel(r.title)}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          <div className="overflow-x-auto border-t border-hairline">
            <table className="w-full min-w-[600px] border-collapse">
              <thead>
                <tr className="border-b border-hairline text-left">
                  {['Task', 'Estimated', 'Actual', 'Accuracy'].map((h, i) => (
                    <th
                      key={h}
                      className={clsx(
                        'py-2.5 font-display text-2xs font-semibold uppercase tracking-[0.08em] text-mid',
                        i === 0 ? 'pl-5' : 'text-right',
                        i === 3 && 'pr-5',
                      )}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr
                    key={r.id}
                    className={clsx(
                      'border-b border-hairline',
                      i === rows.length - 1 && done && 'bg-pink-lo/40',
                    )}
                  >
                    <td className="py-2.5 pl-5">
                      <div className="font-display text-[13px] font-medium text-hi">{r.title}</div>
                    </td>
                    <td className="tnum py-2.5 text-right text-[13px] text-hi">
                      {formatDuration(r.estimateHours)}
                    </td>
                    <td className="tnum py-2.5 text-right text-[13px] text-hi">
                      {formatDuration(r.actualHours)}
                    </td>
                    <td
                      className={clsx(
                        'tnum py-2.5 pr-5 text-right font-display text-[13px] font-semibold',
                        r.accuracy >= 90 ? 'text-ok' : r.accuracy >= 80 ? 'text-warn' : 'text-bad',
                      )}
                    >
                      {r.accuracy}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="card px-5 py-4">
            <h3 className="font-display text-[15px] font-semibold text-hi">
              Starting from nothing
            </h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-mid">
              A brand-new user has none of this. Their first estimates come from the project and
              the workspace — comparable work by other contributors — and are deliberately wider
              and more conservative. Personal signal takes over as it accumulates. The honest
              version of this feature says which of those it is currently using, which is why
              the reasoning panel shows source weights rather than a single confidence badge.
            </p>
          </div>
          <div className="card px-5 py-4">
            <h3 className="font-display text-[15px] font-semibold text-hi">
              Knowing when to forget
            </h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-mid">
              History is not automatically a guide. The nature of the work changes — AI coding
              assistants have moved component work here about 15% faster inside two months. So
              recent weeks are weighted far more heavily than old ones, and a sustained shift in
              pace is treated as a new baseline rather than an outlier to average away.
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}
