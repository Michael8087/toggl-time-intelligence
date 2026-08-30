import clsx from 'clsx'
import {
  BarChart3,
  Bell,
  CheckCircle2,
  ChevronDown,
  Clock,
  Columns3,
  CircleHelp,
  Download,
  Folder,
  GanttChartSquare,
  ListTodo,
  PanelLeftClose,
  PieChart,
  RotateCcw,
  Send,
  Settings,
  Sparkles,
  ScrollText,
  TrendingUp,
  Users,
  ArrowUp,
  Palmtree,
  Star,
} from 'lucide-react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { USER } from '../data/demo'
import { useDemo } from '../state/DemoContext'

/** The Toggl 2.0 mark: a power symbol in a filled pink disc. */
function TogglMark() {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="grid h-8 w-8 place-items-center rounded-full bg-pink">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 3v8"
            stroke="#fff"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
          <path
            d="M18.4 6.2a9 9 0 1 1-12.8 0"
            stroke="#fff"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <span className="font-display text-[9px] font-bold text-mid">2.0</span>
    </div>
  )
}

interface NavItem {
  label: string
  icon: typeof Clock
  to?: string
  star?: boolean
  /** Favourited projects take their own colour, on the same folder icon the
   *  Projects table uses. */
  tone?: string
}

const SECTIONS: { title: string; items: NavItem[] }[] = [
  { title: 'Track', items: [{ label: 'Timer', icon: Clock, to: '/timer' }] },
  { title: 'Analyze', items: [{ label: 'Reports', icon: BarChart3, to: '/reports' }] },
  {
    title: 'Plan',
    items: [
      { label: 'Projects', icon: Folder, to: '/projects' },
      { label: 'Tasks', icon: ListTodo, to: '/tasks' },
      { label: 'Timeline', icon: GanttChartSquare, star: true },
    ],
  },
  {
    title: 'Manage',
    items: [
      { label: 'Members', icon: Users },
      { label: 'Approvals', icon: CheckCircle2, star: true },
      { label: 'Time off', icon: Palmtree, star: true },
    ],
  },
  {
    title: 'Favorites',
    items: [
      { label: 'My Summary', icon: TrendingUp, to: '/summary' },
      { label: 'My Profitability', icon: PieChart },
      { label: 'My Workload', icon: Columns3 },
      { label: 'My Utilization', icon: Clock },
      { label: 'Infotainment Frontend', icon: Folder, tone: 'text-e-pink' },
      { label: 'Sensor Dashboard', icon: Folder, tone: 'text-e-blue' },
    ],
  },
]

function Rail() {
  return (
    <div className="flex w-[52px] shrink-0 flex-col items-center justify-between bg-panel py-4">
      <TogglMark />

      <button
        className="text-lo transition-colors hover:text-hi"
        title="Collapse sidebar"
        aria-label="Collapse sidebar"
      >
        <PanelLeftClose size={18} />
      </button>

      <div className="flex flex-col items-center gap-4">
        <div className="grid h-7 w-7 place-items-center rounded-full bg-panel-3 font-display text-[10px] font-bold text-hi">
          {USER.initials}
        </div>
        <button className="relative text-lo transition-colors hover:text-hi" aria-label="Notifications">
          <Bell size={17} />
          <span className="absolute -right-1 -top-1 grid h-3.5 w-3.5 place-items-center rounded-full bg-pink text-[8px] font-bold text-white">
            1
          </span>
        </button>
        <button className="text-lo transition-colors hover:text-hi" aria-label="Send feedback">
          <Send size={17} />
        </button>
        <button className="text-lo transition-colors hover:text-hi" aria-label="Help">
          <CircleHelp size={17} />
        </button>
      </div>
    </div>
  )
}

function Sidebar() {
  const { pathname } = useLocation()
  const { phase } = useDemo()
  // Point the eye at the surface the plan just landed on.
  const nudgeTimer = phase === 'scheduled' && !pathname.startsWith('/timer')

  const isActive = (to?: string) => {
    if (!to) return false
    if (to === '/projects') return pathname === '/projects'
    if (to === '/tasks') return pathname.startsWith('/tasks')
    return pathname.startsWith(to)
  }

  return (
    <aside className="scrollbar-slim flex w-[236px] shrink-0 flex-col overflow-y-auto bg-panel pb-3">
      {/* Workspace */}
      <button className="mx-3 mt-4 flex items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-panel-2">
        <span className="truncate font-display text-[15px] font-semibold text-hi">
          {USER.workspace}
        </span>
        <ChevronDown size={15} className="ml-auto shrink-0 text-mid" />
      </button>

      {/* Ask Toggl */}
      <div className="mx-3 mt-3">
        <div className="flex h-9 items-center gap-2 rounded-lg border border-hairline-2 px-3">
          <span className="font-display text-[13px] text-lo">Ask Toggl</span>
          <span className="text-[11px] text-dim">⏎</span>
          <span className="ml-auto rounded border border-hairline-2 px-1 text-[10px] text-dim">
            ⌘K
          </span>
        </div>
      </div>

      <nav className="mt-1 flex-1 px-3">
        {SECTIONS.map((section) => (
          <div key={section.title}>
            <div className="nav-section">{section.title}</div>
            <ul className="space-y-px">
              {section.items.map((item) => {
                const active = isActive(item.to)
                const Icon = item.icon
                const body = (
                  <>
                    <Icon
                      size={15}
                      strokeWidth={2}
                      className={item.tone ?? (active ? 'text-pink' : 'text-mid')}
                    />
                    <span className="truncate">{item.label}</span>
                    {item.to === '/timer' && nudgeTimer && (
                      <span className="relative ml-auto grid h-2 w-2 place-items-center">
                        <span className="h-2 w-2 rounded-full bg-pink" />
                        <span className="absolute h-2 w-2 animate-pulse-ring rounded-full bg-pink" />
                      </span>
                    )}
                    {item.star && (
                      <Star size={11} className="ml-auto shrink-0 fill-mid text-mid" />
                    )}
                  </>
                )
                return (
                  <li key={item.label}>
                    {item.to ? (
                      <NavLink
                        to={item.to}
                        className={clsx(
                          'flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] font-display text-[13.5px] transition-colors',
                          active
                            ? 'bg-plum font-semibold text-on-plum'
                            : 'font-medium text-mid hover:bg-panel-2 hover:text-hi',
                        )}
                      >
                        {body}
                      </NavLink>
                    ) : (
                      <span
                        className={clsx(
                          'flex cursor-default items-center gap-2.5 rounded-lg px-2.5 py-[7px] font-display text-[13.5px] font-medium',
                          // A favourited project is real, just not navigable here;
                          // an unbuilt feature reads as genuinely inactive.
                          item.tone ? 'text-mid' : 'text-dim',
                        )}
                        title={item.tone ? undefined : 'Not part of this prototype'}
                      >
                        {body}
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="mt-4 space-y-px px-3">
        <div className="flex items-center gap-2.5 rounded-lg px-2.5 py-[7px]">
          <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-pink">
            <ArrowUp size={12} className="text-white" strokeWidth={3} />
          </span>
          <span className="font-display text-[13.5px] font-semibold text-hi">Upgrade</span>
          <span className="ml-auto rounded bg-panel-3 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-mid">
            31 days
          </span>
        </div>
        <span className="flex cursor-default items-center gap-2.5 rounded-lg px-2.5 py-[7px] font-display text-[13.5px] font-medium text-mid">
          <Download size={15} />
          Download apps
        </span>
        <span className="flex cursor-default items-center gap-2.5 rounded-lg px-2.5 py-[7px] font-display text-[13.5px] font-medium text-mid">
          <Settings size={15} />
          Admin settings
        </span>
      </div>
    </aside>
  )
}

/** Sits above the content: the case-study controls, kept out of the product chrome. */
function DemoBar() {
  const { showNotes, toggleNotes, reset, variant, setVariant } = useDemo()
  const navigate = useNavigate()

  return (
    <div className="flex h-9 shrink-0 items-center gap-2 border-b border-hairline bg-surface px-4">
      <span className="font-display text-2xs font-semibold uppercase tracking-[0.12em] text-lo">
        Concept prototype
      </span>
      <span className="text-2xs text-dim">·</span>
      <span className="truncate text-2xs text-lo">
        Toggl 2.0 · time intelligence for individual contractors
      </span>
      <div className="ml-auto flex items-center gap-1.5">
        {/* Two routes from estimate to calendar; switching restarts the run. */}
        <span className="flex items-center rounded-pill bg-panel-2 p-0.5 ring-1 ring-hairline">
          {(
            [
              [
                'A',
                'Compact',
                'Estimate, capacity and scheduling in one sheet on the task.',
              ],
              [
                'B',
                'In place',
                'Estimate on the task; scheduling on the calendar, where planning already lives.',
              ],
            ] as const
          ).map(([v, name, description]) => (
            <button
              key={v}
              onClick={() => {
                setVariant(v)
                navigate('/tasks')
              }}
              title={`Variant ${v} · ${name} — ${description}`}
              className={clsx(
                'inline-flex items-center gap-1.5 rounded-pill px-2.5 py-0.5 font-display text-[11px] font-semibold transition-colors',
                variant === v ? 'bg-pink text-white' : 'text-mid hover:text-hi',
              )}
            >
              <span className={clsx(variant === v ? 'text-white/70' : 'text-lo')}>{v}</span>
              {name}
            </button>
          ))}
        </span>
        <Link
          to="/reasoning"
          className="inline-flex h-6 items-center gap-1.5 rounded-pill border border-hairline-2 px-2.5 font-display text-[11px] font-semibold text-mid transition-colors hover:border-lo hover:text-hi"
        >
          <ScrollText size={11} />
          Reasoning
        </Link>
        <button
          onClick={toggleNotes}
          className={clsx(
            'inline-flex h-6 items-center gap-1.5 rounded-pill border px-2.5 font-display text-[11px] font-semibold transition-colors',
            showNotes
              ? 'border-warn/40 bg-warn-lo text-warn'
              : 'border-hairline-2 text-mid hover:border-lo hover:text-hi',
          )}
        >
          <Sparkles size={11} />
          Case-study notes
        </button>
        <button
          onClick={() => {
            reset()
            navigate('/tasks')
          }}
          className="inline-flex h-6 items-center gap-1.5 rounded-pill px-2.5 font-display text-[11px] font-semibold text-mid transition-colors hover:bg-panel-2 hover:text-hi"
        >
          <RotateCcw size={11} />
          Restart
        </button>
      </div>
    </div>
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full overflow-hidden bg-panel">
      <Rail />
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col border-l border-hairline bg-canvas">
        <DemoBar />
        {children}
      </div>
    </div>
  )
}
