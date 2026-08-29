import { useNavigate } from 'react-router-dom'
import { Folder, ChevronRight } from 'lucide-react'
import { StatStrip, ToolbarPill } from '../components/ui'
import { useDemo } from '../state/DemoContext'
import { COMPLETED_TASKS, HERO_TASK, OTHER_TASKS, PROJECTS } from '../data/demo'
import { formatDuration } from '../lib/time'

export function ProjectsPage() {
  const navigate = useNavigate()
  const { trackedHours, planHours } = useDemo()

  const loggedToDate =
    COMPLETED_TASKS.reduce((s, t) => s + (t.trackedHours ?? 0), 0) + trackedHours
  const estimatedToDate =
    COMPLETED_TASKS.reduce((s, t) => s + (t.estimateHours ?? 0), 0) +
    OTHER_TASKS.reduce((s, t) => s + (t.estimateHours ?? 0), 0) +
    planHours

  return (
    <div className="scrollbar-slim min-h-0 flex-1 overflow-y-auto">
      <div className="flex flex-wrap items-center gap-3 px-5 pb-3 pt-4">
        <h1 className="font-display text-[21px] font-semibold text-hi">Projects</h1>
        <div className="ml-auto flex gap-2">
          <ToolbarPill caret>Active</ToolbarPill>
          <ToolbarPill caret>All clients</ToolbarPill>
        </div>
      </div>

      <div className="space-y-4 px-5 pb-10">
        <StatStrip
          items={[
            { label: 'Estimated time', value: formatDuration(estimatedToDate) },
            { label: 'Logged time', value: formatDuration(loggedToDate) },
            {
              label: 'Remaining',
              value: formatDuration(Math.max(0, estimatedToDate - loggedToDate)),
            },
            { label: 'Amount', value: `${(loggedToDate * 78).toFixed(2)} EUR` },
          ]}
        />

        <div className="card divide-y divide-hairline overflow-hidden">
          {PROJECTS.map((p) => {
            const isHero = p.id === HERO_TASK.projectId
            return (
              <button
                key={p.id}
                onClick={() => isHero && navigate('/tasks')}
                className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-panel-2"
              >
                <span
                  className="grid h-8 w-8 shrink-0 place-items-center rounded"
                  style={{ background: p.color }}
                >
                  <Folder size={15} className="text-white" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-display text-[14px] font-semibold text-hi">{p.name}</div>
                  <div className="text-2xs text-mid">
                    {p.client} · via {p.via}
                    {p.billable && ` · ${p.rate}.00 ${p.currency}/h`}
                  </div>
                </div>
                {isHero && (
                  <span className="tnum hidden text-2xs text-mid sm:block">
                    {formatDuration(loggedToDate)} logged
                  </span>
                )}
                <ChevronRight size={16} className="shrink-0 text-lo" />
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
