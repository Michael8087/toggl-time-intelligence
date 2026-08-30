import clsx from 'clsx'
import { useState } from 'react'
import { createPortal } from 'react-dom'
import {
  ArrowRight,
  Calendar,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Clock,
  DollarSign,
  FileText,
  Folder,
  Info,
  MoreVertical,
  Play,
  Plus,
  Repeat,
  SignalHigh,
  Sparkles,
  Star,
  Tag,
  Timer as TimerIcon,
  Upload,
  UserRound,
  Users,
  X,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useDemo } from '../state/DemoContext'
import { HERO_TASK, PROJECTS, USER } from '../data/demo'
import {
  formatDate,
  formatDayLong,
  formatDuration,
  formatRange,
  formatTime,
  hoursBetween,
  parse,
} from '../lib/time'
import { Button, Note } from './ui'
import { PlanSheet } from './PlanSheet'

/* ---------------------------------------------------------------- property */

function Row({
  icon: Icon,
  label,
  children,
  hint,
  star,
}: {
  icon: typeof Clock
  label: string
  children: ReactNode
  hint?: boolean
  star?: boolean
}) {
  return (
    <div className="flex items-start gap-4 px-6 py-[7px]">
      <div className="flex w-[150px] shrink-0 items-center gap-2.5 pt-0.5 text-[14px] text-mid">
        <Icon size={15} className="shrink-0" />
        <span className="truncate">{label}</span>
        {hint && <Info size={12} className="shrink-0 text-lo" />}
        {star && <Star size={11} className="shrink-0 fill-lo text-lo" />}
      </div>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}

function Empty() {
  return <span className="text-[14px] text-lo">Empty</span>
}

function Section({
  title,
  open,
  onToggle,
  action,
  children,
}: {
  title: string
  open: boolean
  onToggle: () => void
  action?: ReactNode
  children?: ReactNode
}) {
  return (
    <div className="border-t border-hairline">
      <div className="flex items-center gap-2 px-6 py-3.5">
        <button
          onClick={onToggle}
          className="flex items-center gap-2 font-display text-[15px] font-semibold text-hi"
        >
          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          {title}
        </button>
        {action && <div className="ml-auto">{action}</div>}
      </div>
      {open && children && <div className="px-6 pb-5">{children}</div>}
    </div>
  )
}

/* ------------------------------------------------------------ Time section */

function TimeBox({
  label,
  value,
  tone = 'default',
  onClick,
}: {
  label: string
  value: ReactNode
  tone?: 'default' | 'pink' | 'lo'
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={clsx(
        'flex-1 px-4 py-3 text-left transition-colors',
        onClick && 'hover:bg-panel-2',
      )}
    >
      <div className="flex items-center gap-1.5 text-[13px] text-mid">
        {label}
        <Info size={11} className="text-lo" />
      </div>
      <div
        className={clsx(
          'tnum mt-1 font-display text-xl font-bold',
          tone === 'pink' ? 'text-pink' : tone === 'lo' ? 'text-lo' : 'text-hi',
        )}
      >
        {value}
      </div>
    </button>
  )
}

/** Mirrors Track's planned-time editor: date · start → end · duration. */
function PlannedTimeEditor() {
  const { slots, planHours, setTimeView } = useDemo()
  return (
    <div className="animate-fade-in">
      <button
        onClick={() => setTimeView('summary')}
        className="mb-4 flex items-center gap-1.5 font-display text-[14px] font-medium text-mid hover:text-hi"
      >
        <ChevronLeft size={16} />
        Back
      </button>

      <div className="mb-5 flex items-center gap-5 border-b border-hairline">
        <button
          onClick={() => setTimeView('logged')}
          className="flex items-center gap-2 pb-2.5 font-display text-[14px] font-medium text-mid hover:text-hi"
        >
          <TimerIcon size={15} />
          Logged
        </button>
        <span className="relative flex items-center gap-2 pb-2.5 font-display text-[14px] font-semibold text-pink">
          <Calendar size={15} />
          Planned
          <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-t bg-pink" />
        </span>
      </div>

      {slots.length === 0 ? (
        <p className="text-[14px] text-lo">No planned time yet.</p>
      ) : (
        <div className="space-y-5">
          {slots.map((slot) => {
            const s = parse(slot.start)
            const e = parse(slot.end)
            return (
              <div key={slot.id}>
                <div className="mb-2 font-display text-[15px] font-semibold text-hi">
                  {formatDayLong(s)} {formatDate(s)}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-hairline-2 px-3 text-[13px] text-hi">
                    <Calendar size={13} className="text-mid" />
                    {formatDate(s)}
                  </span>
                  <span className="tnum inline-flex h-9 items-center rounded-lg border border-hairline-2 px-3 text-[13px] text-hi">
                    {formatTime(s)}
                  </span>
                  <ArrowRight size={14} className="text-lo" />
                  <span className="tnum inline-flex h-9 items-center rounded-lg border border-hairline-2 px-3 text-[13px] text-hi">
                    {formatTime(e)}
                  </span>
                  <span className="tnum inline-flex h-9 items-center rounded-lg border border-hairline-2 px-3 text-[13px] text-hi">
                    {formatDuration(hoursBetween(s, e))}
                  </span>
                  <button className="ml-auto text-lo hover:text-hi">
                    <MoreVertical size={16} />
                  </button>
                </div>
              </div>
            )
          })}

          <div className="flex items-center justify-between border-t border-hairline pt-4">
            <button className="font-display text-[14px] font-medium text-lo">
              + Add planned time
            </button>
            <div className="flex items-center gap-6">
              <span className="text-[14px] text-mid">Total</span>
              <span className="tnum font-display text-[15px] font-semibold text-hi">
                {formatDuration(planHours)}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="mt-5">
        <Note title="What actually changed">
          These rows are Toggl 2.0’s existing planned-time editor, unmodified. Today a contractor
          types every one of them by hand — pick a date, pick a start, pick an end, repeat.
          The concept does not add a field. It fills these in, from an estimate the user
          accepted and capacity Toggl already knows about.
        </Note>
      </div>
    </div>
  )
}

function LoggedTimeList() {
  const { entries, setTimeView, trackedHours } = useDemo()
  return (
    <div className="animate-fade-in">
      <button
        onClick={() => setTimeView('summary')}
        className="mb-4 flex items-center gap-1.5 font-display text-[14px] font-medium text-mid hover:text-hi"
      >
        <ChevronLeft size={16} />
        Back
      </button>

      <div className="mb-5 flex items-center gap-5 border-b border-hairline">
        <span className="relative flex items-center gap-2 pb-2.5 font-display text-[14px] font-semibold text-pink">
          <TimerIcon size={15} />
          Logged
          <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-t bg-pink" />
        </span>
        <button
          onClick={() => setTimeView('planned')}
          className="flex items-center gap-2 pb-2.5 font-display text-[14px] font-medium text-mid hover:text-hi"
        >
          <Calendar size={15} />
          Planned
        </button>
      </div>

      {entries.length === 0 ? (
        <p className="text-[14px] text-lo">Nothing tracked yet.</p>
      ) : (
        <ul className="space-y-2">
          {entries.map((e) => {
            const s = parse(e.start)
            const en = parse(e.end)
            return (
              <li
                key={e.id}
                className="flex items-center gap-3 rounded-lg border border-hairline px-3 py-2.5"
              >
                <span className="h-2 w-2 shrink-0 rounded-full bg-e-pink" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-display text-[13px] font-medium text-hi">
                    {e.activity}
                  </div>
                  <div className="tnum text-2xs text-mid">
                    {formatDayLong(s)} · {formatRange(s, en)}
                  </div>
                </div>
                <span className="rounded bg-panel-3 px-1.5 py-0.5 text-2xs font-semibold text-mid">
                  auto
                </span>
                <span className="tnum font-display text-[13px] font-semibold text-hi">
                  {formatDuration(hoursBetween(s, en))}
                </span>
              </li>
            )
          })}
        </ul>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-hairline pt-4">
        <span className="text-[14px] text-mid">Total</span>
        <span className="tnum font-display text-[15px] font-semibold text-hi">
          {formatDuration(trackedHours)}
        </span>
      </div>
    </div>
  )
}

function TimeSection() {
  const {
    phase,
    planHours,
    acceptedHours,
    trackedHours,
    estimate,
    slots,
    entries,
    timeView,
    setTimeView,
    setPhase,
  } = useDemo()

  const planned = slots.reduce((s, x) => s + hoursBetween(parse(x.start), parse(x.end)), 0)
  const estimated = acceptedHours
  const pct = estimated ? Math.round((trackedHours / estimated) * 100) : 0
  const left = estimated ? estimated - trackedHours : 0
  const unplanned = phase === 'intake' || phase === 'estimate'

  if (timeView === 'planned') return <PlannedTimeEditor />
  if (timeView === 'logged') return <LoggedTimeList />

  return (
    <>
      {/* The proposal. Present because the task arrived, not because anyone asked. */}
      {unplanned && (
        <div className="animate-fade-up mb-4 rounded-xl border border-pink/35 bg-pink-lo px-4 py-3.5">
          <div className="flex items-start gap-2.5">
            <Sparkles size={16} className="mt-0.5 shrink-0 text-pink" />
            <div className="min-w-0 flex-1">
              <div className="font-display text-[14px] font-semibold text-hi">
                Toggl can plan this task
              </div>
              <p className="mt-0.5 text-[13px] leading-relaxed text-mid">
                Around{' '}
                <span className="font-semibold text-hi">
                  {formatDuration(estimate.bestHours)}
                </span>{' '}
                of work, and it fits your calendar before Wednesday. Nothing is committed until
                you say so.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" onClick={() => setPhase('estimate')}>
                  Plan this task
                </Button>
                <Button size="sm" variant="quiet" onClick={() => setPhase('estimate')}>
                  Show reasoning
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toggl's own empty state for a task nobody has logged or planned against. */}
      {trackedHours === 0 && planned === 0 && !estimated && (
        <div className="mb-4 text-center">
          <div className="font-display text-[15px] font-semibold text-hi">
            No time on this task yet
          </div>
          <div className="mt-0.5 text-[14px] text-mid">
            Log or plan time to track your progress
          </div>
        </div>
      )}

      <div className="flex divide-x divide-hairline overflow-hidden rounded-xl border border-hairline">
        <TimeBox
          label="Logged"
          value={trackedHours > 0 ? formatDuration(trackedHours) : '—'}
          tone={trackedHours > 0 ? 'default' : 'lo'}
          onClick={entries.length ? () => setTimeView('logged') : undefined}
        />
        <TimeBox
          label="Planned"
          value={planned > 0 ? formatDuration(planned) : '—'}
          tone={planned > 0 ? 'default' : 'lo'}
          onClick={slots.length ? () => setTimeView('planned') : undefined}
        />
        <TimeBox
          label="Estimate"
          value={estimated ? formatDuration(estimated) : '—'}
          tone={estimated ? 'default' : 'lo'}
        />
      </div>

      {estimated && trackedHours > 0 && (
        <div className="mt-4">
          <div className="tnum mb-1.5 font-display text-[14px] font-semibold text-pink">
            {pct}% ·{' '}
            {left >= 0
              ? `${formatDuration(left)} left`
              : `${formatDuration(-left)} over`}
          </div>
          <div className="h-2 overflow-hidden rounded-pill bg-panel-3">
            <div
              className="h-full rounded-pill bg-pink transition-[width] duration-500"
              style={{ width: `${Math.min(100, pct)}%` }}
            />
          </div>
        </div>
      )}

      {planHours > 0 && slots.length > 0 && phase === 'scheduled' && (
        <p className="mt-3 text-[13px] leading-relaxed text-mid">
          Planned time was generated from the estimate and dropped into your calendar. Tracking
          starts on its own when the first block begins.
        </p>
      )}

      <div className="mt-4">
        <Note title="The gap, stated plainly">
          Toggl 2.0 already ships all three of these numbers. In practice the middle one is almost
          always empty, because filling it means hand-entering blocks that respect a calendar,
          a dependency and a deadline the user has to hold in their head. That empty box is the
          whole opportunity.
        </Note>
      </div>
    </>
  )
}

/* ------------------------------------------------------------------ drawer */

export function TaskDrawer() {
  const { drawerTaskId, closeDrawer, phase, acceptedHours, estimate, trackedHours } = useDemo()
  const [openSections, setOpenSections] = useState({
    subtasks: false,
    dependencies: true,
    allocation: false,
    time: true,
  })
  const [moreProps, setMoreProps] = useState(false)
  const [billable, setBillable] = useState(true)

  if (!drawerTaskId) return null
  const task = HERO_TASK
  const project = PROJECTS.find((p) => p.id === task.projectId)!
  const planning = phase === 'estimate' || phase === 'capacity' || phase === 'schedule'

  const status =
    phase === 'complete' || phase === 'reported'
      ? 'Done'
      : phase === 'working'
        ? 'In progress'
        : 'Todo'

  const toggle = (k: keyof typeof openSections) =>
    setOpenSections((s) => ({ ...s, [k]: !s[k] }))

  // Portaled to the body so the scrim covers the whole window — rail and
  // sidebar included — the way the real drawer does.
  return createPortal(
    <>
      <div
        className="fixed inset-0 z-40 animate-fade-in bg-black/35"
        onClick={closeDrawer}
      />
      <aside className="scrollbar-slim fixed inset-y-0 right-0 z-50 w-full max-w-[600px] animate-fade-in overflow-y-auto border-l border-hairline bg-panel shadow-pop">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-hairline bg-panel px-6 py-4">
          <span className="h-5 w-5 shrink-0 rounded bg-e-pink" />
          <span className="truncate font-display text-[15px] font-semibold text-hi">
            {project.name}
          </span>
          <div className="ml-auto flex items-center gap-3 text-mid">
            <Users size={17} className="cursor-pointer hover:text-hi" />
            <MoreVertical size={17} className="cursor-pointer hover:text-hi" />
            <button onClick={closeDrawer} className="hover:text-hi" aria-label="Close">
              <X size={19} />
            </button>
          </div>
        </div>

        {/* Title */}
        <div className="flex items-start gap-4 px-6 pb-1 pt-5">
          <h2 className="min-w-0 flex-1 font-display text-[23px] font-semibold leading-snug text-hi">
            {task.title}
          </h2>
          <button
            className={clsx(
              'grid h-12 w-12 shrink-0 place-items-center rounded-full transition-colors',
              phase === 'working'
                ? 'bg-pink text-white'
                : 'bg-pink-lo text-pink ring-1 ring-pink/40 hover:bg-pink hover:text-white',
            )}
            aria-label="Start timer"
          >
            <Play size={19} fill="currentColor" />
          </button>
        </div>

        <p className="px-6 pb-4 text-[14px] leading-relaxed text-mid">{task.description}</p>

        {/* Properties */}
        <div className="pb-3">
          <Row icon={Folder} label="Project">
            <span className="inline-flex flex-wrap items-center gap-2">
              <Folder size={14} className="text-e-blue" />
              {/* The client lives on the project, not on the task. */}
              <span className="font-display text-[14px] font-semibold text-e-blue">
                {project.name}
              </span>
            </span>
          </Row>

          <Row icon={Calendar} label="Dates">
            <span className="font-display text-[14px] font-semibold text-hi">
              Due {formatDayLong(parse(task.dueAt!))} {formatDate(parse(task.dueAt!))}
            </span>
          </Row>

          <Row icon={Clock} label="Estimate" hint>
            {acceptedHours ? (
              <span className="inline-flex items-center gap-2">
                <span className="tnum font-display text-[14px] font-semibold text-hi">
                  {formatDuration(acceptedHours)}
                </span>
                <span className="inline-flex items-center gap-1 text-[13px] text-mid">
                  total <ChevronDown size={13} />
                </span>
              </span>
            ) : (
              <span className="inline-flex flex-wrap items-center gap-2">
                {/* Toggl shows 0h, not an empty state — which is the whole point. */}
                <span className="tnum font-display text-[14px] font-semibold text-lo">0h</span>
                <span className="inline-flex items-center gap-1 text-[13px] text-mid">
                  total <ChevronDown size={13} />
                </span>
                {/* The suggestion, inline in the field it belongs to. */}
                <span className="inline-flex items-center gap-1.5 rounded-pill border border-pink/35 bg-pink-lo px-2 py-0.5 font-display text-2xs font-semibold text-pink">
                  <Sparkles size={11} />
                  {formatDuration(estimate.bestHours)} suggested
                </span>
              </span>
            )}
          </Row>

          <Row icon={SignalHigh} label="Priority">
            <span className="font-display text-[14px] font-semibold text-hi">High</span>
          </Row>

          <Row icon={Tag} label="Tags">
            <span className="flex flex-wrap items-center gap-1.5">
              {task.tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 rounded border border-hairline bg-panel-2 px-1.5 py-0.5 text-2xs text-mid"
                >
                  <Tag size={10} className="text-e-green" />
                  {t}
                </span>
              ))}
              <Plus size={13} className="text-lo" />
            </span>
          </Row>

          <Row icon={UserRound} label="Assignee">
            <span className="inline-flex items-center gap-2">
              <span className="grid h-5 w-5 place-items-center rounded-full bg-panel-3 text-[9px] font-bold text-hi">
                {USER.initials}
              </span>
              <span className="font-display text-[14px] font-semibold text-hi">{USER.name}</span>
              <Plus size={13} className="text-lo" />
            </span>
          </Row>

          <Row icon={CheckCircle2} label="Status">
            <span
              className={clsx(
                'inline-flex items-center gap-1.5 rounded px-1.5 py-0.5 font-display text-[13px] font-semibold',
                status === 'Done'
                  ? 'bg-ok-lo text-ok'
                  : status === 'In progress'
                    ? 'bg-pink-lo text-pink'
                    : 'text-hi',
              )}
            >
              {status}
            </span>
          </Row>

          {/* Billable sits above the fold in the real panel, not under More properties. */}
          <Row icon={DollarSign} label="Billable" hint star>
            <button
              onClick={() => setBillable(!billable)}
              className={clsx(
                'flex h-5 w-9 items-center rounded-pill px-0.5 transition-colors',
                billable ? 'bg-pink' : 'bg-hairline-2',
              )}
              role="switch"
              aria-checked={billable}
              aria-label="Billable"
            >
              <span
                className={clsx(
                  'h-4 w-4 rounded-full bg-white transition-transform',
                  billable && 'translate-x-4',
                )}
              />
            </button>
          </Row>

          {moreProps && (
            <>
              <Row icon={Repeat} label="Repeat">
                <Empty />
              </Row>
              <Row icon={Clock} label="Rate">
                <span className="tnum font-display text-[14px] font-semibold text-hi">
                  {project.rate}.00 {project.currency} / h
                </span>
              </Row>
            </>
          )}

          <button
            onClick={() => setMoreProps(!moreProps)}
            className="flex items-center gap-1.5 px-6 py-2 font-display text-[14px] font-medium text-mid hover:text-hi"
          >
            {moreProps ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
            {moreProps ? 'Fewer properties' : 'More properties'}
          </button>
        </div>

        <Section
          title="Subtasks"
          open={openSections.subtasks}
          onToggle={() => toggle('subtasks')}
        >
          <p className="text-[14px] text-lo">None.</p>
        </Section>

        <Section
          title="Allocation"
          open={openSections.allocation}
          onToggle={() => toggle('allocation')}
        >
          <p className="text-[14px] text-lo">Not allocated.</p>
        </Section>

        <Section
          title="Time"
          open={openSections.time}
          onToggle={() => toggle('time')}
          action={
            <span className="inline-flex items-center gap-1.5 text-[13px] text-mid">
              <span className="grid h-4 w-4 place-items-center rounded-full bg-panel-3 text-[9px] font-bold">
                {trackedHours > 0 ? 7 : 0}
              </span>
              View entries →
            </span>
          }
        >
          <TimeSection />
        </Section>

        <div className="flex flex-wrap gap-3 border-t border-hairline px-6 py-5">
          <button className="inline-flex h-10 items-center gap-2 rounded-lg border border-hairline-2 px-4 font-display text-[14px] font-medium text-hi transition-colors hover:border-lo">
            <Upload size={15} />
            Add attachment
          </button>
          <button className="inline-flex h-10 items-center gap-2 rounded-lg border border-hairline-2 px-4 font-display text-[14px] font-medium text-hi transition-colors hover:border-lo">
            <FileText size={15} />
            Add notes
          </button>
        </div>

        <div className="h-8" />
      </aside>

      {planning && <PlanSheet />}
    </>,
    document.body,
  )
}

export { CalendarClock }
