import clsx from 'clsx'
import {
  ChevronDown,
  ClipboardList,
  DollarSign,
  Filter,
  Folder,
  Layers,
  ListFilter,
  SignalHigh,
  Sparkles,
  Circle,
  CheckCircle2,
} from 'lucide-react'
import { useDemo } from '../state/DemoContext'
import { TaskDrawer } from '../components/TaskDrawer'
import { Note } from '../components/ui'
import { COMPLETED_TASKS, HERO_TASK, OTHER_TASKS, PROJECTS, USER } from '../data/demo'
import { formatDuration } from '../lib/time'
import type { Task } from '../types'

const PRIORITY: Record<string, string> = {
  'INF-241': 'High',
  'INF-236': 'High',
  'INF-238': 'Medium',
  'INF-244': 'Medium',
}

function Header() {
  return (
    <>
      <div className="flex items-center gap-3 px-5 pb-3 pt-4">
        <h1 className="font-display text-[21px] font-semibold text-hi">
          Tasks <span className="text-lo">· List</span>
        </h1>
      </div>

      <div className="flex flex-wrap items-center gap-2 px-5 pb-3">
        <span className="toolbar-pill">
          <Layers size={13} /> Custom <ChevronDown size={13} />
        </span>
        <span className="toolbar-pill border-pink/50 text-pink">
          <Filter size={13} /> Filters
          <span className="grid h-4 w-4 place-items-center rounded-full bg-pink text-[9px] font-bold text-white">
            1
          </span>
        </span>
        <span className="toolbar-pill">
          <ListFilter size={13} /> Group by: <span className="text-hi">Status</span>
        </span>
        <span className="toolbar-pill">
          Sort by: <span className="text-hi">Priority</span> ↓
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3 px-5 pb-3">
        <span className="inline-flex h-8 items-center gap-2 rounded-pill bg-pink-lo px-3 font-display text-[13px] font-medium text-pink">
          <span className="grid h-4 w-4 place-items-center rounded-full bg-pink text-[9px] font-bold text-white">
            {USER.initials[0]}
          </span>
          {USER.name.split(' ')[0]}
        </span>
        <span className="font-display text-[13px] text-mid">+ Filter</span>
        <span className="font-display text-[13px] text-mid">Reset</span>
      </div>
    </>
  )
}

function Row({ task, onOpen }: { task: Task; onOpen: () => void }) {
  const { phase, acceptedHours, trackedHours } = useDemo()
  const project = PROJECTS.find((p) => p.id === task.projectId)!
  const isHero = task.id === HERO_TASK.id
  const unplanned = isHero && (phase === 'intake' || phase === 'estimate')

  const status = isHero
    ? phase === 'complete' || phase === 'reported'
      ? 'Done'
      : phase === 'working'
        ? 'In progress'
        : 'Todo'
    : task.status === 'done'
      ? 'Done'
      : task.status === 'in_progress'
        ? 'In progress'
        : 'Todo'

  return (
    <tr
      onClick={onOpen}
      className={clsx(
        'cursor-pointer border-b border-hairline transition-colors hover:bg-panel-2',
        isHero && 'bg-pink-lo/40',
      )}
    >
      <td className="w-9 py-3 pl-5">
        {status === 'Done' ? (
          <CheckCircle2 size={16} className="text-ok" />
        ) : (
          <Circle size={16} className="text-lo" />
        )}
      </td>
      <td className="py-3 pr-4">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={clsx(
              'font-display text-[14px]',
              isHero ? 'font-semibold text-hi' : 'text-hi',
            )}
          >
            {task.title}
          </span>
          <span className="text-2xs text-lo">{task.ref}</span>
          {unplanned && (
            <span className="inline-flex items-center gap-1 rounded-pill border border-pink/35 bg-pink-lo px-1.5 py-0.5 text-2xs font-semibold text-pink">
              <Sparkles size={10} />
              Ready to plan
            </span>
          )}
          {isHero && acceptedHours && (
            <span className="tnum text-2xs text-mid">
              {formatDuration(trackedHours)} / {formatDuration(acceptedHours)}
            </span>
          )}
        </div>
      </td>
      <td className="py-3 pr-4">
        <span
          className={clsx(
            'inline-flex items-center gap-1.5 whitespace-nowrap font-display text-[13px]',
            status === 'Done' ? 'text-ok' : status === 'In progress' ? 'text-pink' : 'text-mid',
          )}
        >
          <ClipboardList size={13} />
          {status}
        </span>
      </td>
      <td className="py-3 pr-4">
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap font-display text-[13px] text-e-blue">
          <Folder size={13} />
          {project.name}
        </span>
      </td>
      <td className="py-3 pr-4">
        {project.billable && <DollarSign size={14} className="text-mid" />}
      </td>
      <td className="py-3 pr-5">
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap font-display text-[13px] text-mid">
          <SignalHigh size={13} />
          {PRIORITY[task.id] ?? 'Medium'}
        </span>
      </td>
    </tr>
  )
}

export function TasksPage() {
  const { openDrawer, phase } = useDemo()
  const todo = [HERO_TASK, ...OTHER_TASKS]
  const done = COMPLETED_TASKS

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="scrollbar-slim min-h-0 flex-1 overflow-y-auto">
        <Header />

        {(phase === 'intake' || phase === 'estimate') && (
          <div className="space-y-3 px-5 pb-4">
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-pink/30 bg-pink-lo px-4 py-3">
              <span className="inline-flex items-center gap-1.5 rounded-pill bg-pink px-2 py-0.5 font-display text-2xs font-bold text-white">
                Day 1
              </span>
              <span className="min-w-0 text-[13px] leading-relaxed text-hi">
                You signed up this morning and connected your calendar. You have tracked{' '}
                <strong>nothing</strong> — the four finished tasks below belong to the client’s
                other contractors. Open{' '}
                <strong>Implement navigation component</strong> to start.
              </span>
            </div>
            <Note title="The W0 constraint, taken literally">
              Everything in this prototype has to work for a user with zero personal history,
              because that is the only user week one has. So the estimate leans on the client’s
              existing project data and the task’s own scope, and the two steps that need no
              history at all — the capacity check and automatic scheduling — carry the day-one
              value. Personal history makes it sharper by Friday; it is not the price of entry.
            </Note>
          </div>
        )}

        <table className="w-full border-collapse">
          <thead>
            <tr className="border-y border-hairline text-left">
              <th className="w-9 py-2 pl-5" />
              <th className="py-2 pr-4 font-display text-2xs font-semibold uppercase tracking-[0.08em] text-mid">
                Tasks
              </th>
              <th className="w-[130px] py-2 pr-4 font-display text-2xs font-semibold uppercase tracking-[0.08em] text-mid">
                Status
              </th>
              <th className="w-[200px] py-2 pr-4 font-display text-2xs font-semibold uppercase tracking-[0.08em] text-mid">
                Project
              </th>
              <th className="w-[90px] py-2 pr-4 font-display text-2xs font-semibold uppercase tracking-[0.08em] text-mid">
                Billable
              </th>
              <th className="w-[120px] py-2 pr-5 font-display text-2xs font-semibold uppercase tracking-[0.08em] text-mid">
                Priority
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-hairline bg-surface">
              <td colSpan={6} className="py-2 pl-5">
                <span className="inline-flex items-center gap-2 font-display text-[13px] font-semibold text-hi">
                  <ChevronDown size={15} />
                  Todo <span className="text-lo">· {todo.length}</span>
                </span>
              </td>
            </tr>
            {todo.map((t) => (
              <Row key={t.id} task={t} onOpen={() => openDrawer(t.id)} />
            ))}

            <tr className="border-b border-hairline bg-surface">
              <td colSpan={6} className="py-2 pl-5">
                <span className="inline-flex items-center gap-2 font-display text-[13px] font-semibold text-hi">
                  <ChevronDown size={15} />
                  Done <span className="text-lo">· {done.length}</span>
                </span>
              </td>
            </tr>
            {done.map((t) => (
              <Row key={t.id} task={t} onOpen={() => openDrawer(t.id)} />
            ))}
          </tbody>
        </table>

        <div className="h-10" />
      </div>

      <TaskDrawer />
    </div>
  )
}
