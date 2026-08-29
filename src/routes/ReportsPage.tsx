import clsx from 'clsx'
import { Check, Download, Link2, Send, ShieldCheck } from 'lucide-react'
import { Button, Note, StatStrip, ToolbarPill } from '../components/ui'
import { useDemo } from '../state/DemoContext'
import { COMPLETED_TASKS, HERO_TASK, PROJECTS, USER } from '../data/demo'
import { formatDate, formatDuration, weekDays, DEMO_NOW } from '../lib/time'

export function ReportsPage() {
  const { trackedHours, planHours, entries, phase } = useDemo()
  const project = PROJECTS.find((p) => p.id === HERO_TASK.projectId)!
  const days = weekDays(DEMO_NOW)
  const done = phase === 'complete' || phase === 'reported'

  const rows = [
    {
      ref: HERO_TASK.ref,
      title: HERO_TASK.title,
      estimate: planHours,
      actual: trackedHours,
      status: done ? 'Delivered' : 'In progress',
    },
    ...COMPLETED_TASKS.slice(-2).map((t) => ({
      ref: t.ref,
      title: t.title,
      estimate: t.estimateHours ?? 0,
      actual: t.trackedHours ?? 0,
      status: 'Delivered',
    })),
  ]

  const totalActual = rows.reduce((s, r) => s + r.actual, 0)
  const totalEstimate = rows.reduce((s, r) => s + r.estimate, 0)

  function exportCsv() {
    const header = ['Task', 'Estimated (h)', 'Actual (h)', 'Variance (h)', 'Status']
    const body = rows.map((r) => [
      r.title,
      r.estimate.toFixed(2),
      r.actual.toFixed(2),
      (r.actual - r.estimate).toFixed(2),
      r.status,
    ])
    const csv = [header, ...body].map((l) => l.map((c) => `"${c}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'skoda-infotainment-week-38.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="scrollbar-slim min-h-0 flex-1 overflow-y-auto">
      <div className="flex flex-wrap items-center gap-3 px-5 pb-3 pt-4">
        <h1 className="font-display text-[21px] font-semibold text-hi">
          Reports <span className="text-lo">· Client summary</span>
        </h1>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <ToolbarPill caret>Week 38</ToolbarPill>
          <ToolbarPill caret>{project.client}</ToolbarPill>
          <Button variant="ghost" onClick={exportCsv}>
            <Download size={15} />
            CSV
          </Button>
          <Button>
            <Send size={15} />
            Send to client
          </Button>
        </div>
      </div>

      <div className="space-y-4 px-5 pb-10">
        <StatStrip
          items={[
            { label: 'Period', value: `${formatDate(days[0])} – ${formatDate(days[4])}` },
            { label: 'Tracked', value: formatDuration(totalActual) },
            { label: 'Estimated', value: formatDuration(totalEstimate) },
            {
              label: 'Amount',
              value: `${(totalActual * project.rate).toFixed(2)} ${project.currency}`,
              sub: `${project.rate}.00 ${project.currency}/h`,
            },
          ]}
        />

        <div className="card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline px-5 py-4">
            <div>
              <h3 className="font-display text-[15px] font-semibold text-hi">
                {project.client} — {project.name}
              </h3>
              <p className="mt-0.5 text-2xs text-mid">
                Prepared by {USER.name} · via {project.via} · generated from tracked time
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-pill bg-ok-lo px-2.5 py-1 text-2xs font-semibold text-ok">
              <ShieldCheck size={12} />
              No manual reconstruction
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse">
              <thead>
                <tr className="border-b border-hairline text-left">
                  {['Task', 'Estimated', 'Actual', 'Variance', 'Status'].map((h, i) => (
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
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const v = r.actual - r.estimate
                  return (
                    <tr key={r.title} className="border-b border-hairline">
                      <td className="py-3 pl-5">
                        <div className="font-display text-[13px] font-medium text-hi">
                          {r.title}
                        </div>
                      </td>
                      <td className="tnum py-3 text-right text-[13px] text-hi">
                        {formatDuration(r.estimate)}
                      </td>
                      <td className="tnum py-3 text-right text-[13px] text-hi">
                        {formatDuration(r.actual)}
                      </td>
                      <td
                        className={clsx(
                          'tnum py-3 text-right font-display text-[13px] font-semibold',
                          v <= 0 ? 'text-ok' : 'text-bad',
                        )}
                      >
                        {v <= 0 ? '−' : '+'}
                        {formatDuration(Math.abs(v))}
                      </td>
                      <td className="py-3 pr-5 text-right">
                        <span
                          className={clsx(
                            'inline-flex items-center gap-1 rounded-pill px-2 py-0.5 text-2xs font-semibold',
                            r.status === 'Delivered' ? 'bg-ok-lo text-ok' : 'bg-pink-lo text-pink',
                          )}
                        >
                          {r.status === 'Delivered' && <Check size={10} />}
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  )
                })}
                <tr className="bg-surface">
                  <td className="py-3 pl-5 font-display text-[13px] font-bold text-hi">Total</td>
                  <td className="tnum py-3 text-right font-display text-[13px] font-bold text-hi">
                    {formatDuration(totalEstimate)}
                  </td>
                  <td className="tnum py-3 text-right font-display text-[13px] font-bold text-hi">
                    {formatDuration(totalActual)}
                  </td>
                  <td
                    className={clsx(
                      'tnum py-3 text-right font-display text-[13px] font-bold',
                      totalActual <= totalEstimate ? 'text-ok' : 'text-bad',
                    )}
                  >
                    {totalActual <= totalEstimate ? '−' : '+'}
                    {formatDuration(Math.abs(totalActual - totalEstimate))}
                  </td>
                  <td className="pr-5" />
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-hairline px-5 py-4">
            <span className="inline-flex items-center gap-2 rounded-lg border border-hairline-2 px-3 py-1.5 text-2xs text-mid">
              <Link2 size={13} />
              toggl.com/share/skoda-w38-{HERO_TASK.ref.toLowerCase()}
            </span>
            <span className="text-2xs text-lo">
              Read-only. {entries.length} tracked entries behind these totals.
            </span>
          </div>
        </div>

        <Note title="Why the report is the easy part">
          Everything on this page is a by-product. The estimate came from the planning step, the
          actuals from automatic tracking, the variance from the difference. Reporting stops
          being a Friday-afternoon reconstruction job and becomes a read of data that was
          already correct — which is also what makes the accuracy number trustworthy enough to
          feed back into estimating.
        </Note>
      </div>
    </div>
  )
}
