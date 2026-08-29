import clsx from 'clsx'
import { useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronsUpDown,
  DollarSign,
  Filter,
  Folder,
  ListFilter,
  ListTree,
  Pin,
  Plus,
  Search,
  Settings,
  Star,
  Tag,
  Users,
} from 'lucide-react'
import { Button } from '../components/ui'
import { useDemo } from '../state/DemoContext'
import { COMPLETED_TASKS, OTHER_TASKS, PROJECTS } from '../data/demo'
import { formatDuration } from '../lib/time'

/** Project name and folder take the project's own colour, as in the real list. */
const TONE: Record<string, string> = {
  'skoda-infotainment': 'text-e-pink',
  'bosch-sensor': 'text-e-blue',
  internal: 'text-e-yellow',
}

type SortKey = 'project' | 'client' | 'billable' | 'dates'

function Th({
  label,
  sortKey,
  active,
  dir,
  onSort,
  className,
  star,
}: {
  label: string
  sortKey?: SortKey
  active?: boolean
  dir?: 'asc' | 'desc'
  onSort?: (k: SortKey) => void
  className?: string
  star?: boolean
}) {
  const inner = (
    <span
      className={clsx(
        'inline-flex items-center gap-1 text-2xs font-semibold uppercase tracking-[0.08em]',
        active ? 'text-hi' : 'text-mid',
      )}
    >
      {label}
      {sortKey &&
        (active ? (
          dir === 'desc' ? (
            <ArrowDown size={12} />
          ) : (
            <ArrowUp size={12} />
          )
        ) : (
          <ChevronsUpDown size={12} className="opacity-60" />
        ))}
      {star && <Star size={11} className="fill-mid text-mid" />}
    </span>
  )
  return (
    <th className={clsx('py-2 font-display', className)}>
      {sortKey && onSort ? (
        <button onClick={() => onSort(sortKey)} className="hover:opacity-80">
          {inner}
        </button>
      ) : (
        inner
      )}
    </th>
  )
}

export function ProjectsPage() {
  const { trackedHours } = useDemo()
  const [sortKey, setSortKey] = useState<SortKey>('project')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const onSort = (k: SortKey) => {
    if (k === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(k)
      setSortDir('asc')
    }
  }

  // Škoda's numbers move with the demo; the others are fixed background.
  const skodaEstimate =
    COMPLETED_TASKS.reduce((s, t) => s + (t.estimateHours ?? 0), 0) +
    OTHER_TASKS.reduce((s, t) => s + (t.estimateHours ?? 0), 0) +
    10
  const skodaLogged =
    COMPLETED_TASKS.reduce((s, t) => s + (t.trackedHours ?? 0), 0) + trackedHours

  const rows = [
    {
      id: 'skoda-infotainment',
      logged: skodaLogged,
      estimate: skodaEstimate,
      dates: '14 Sept – 30 Sept',
      pinned: true,
      shared: true,
      tags: [] as string[],
    },
    {
      id: 'bosch-sensor',
      logged: 12.5,
      estimate: 40,
      dates: '1 Sept – 24 Oct',
      pinned: false,
      shared: true,
      tags: [],
    },
    {
      id: 'internal',
      logged: 3,
      estimate: 0,
      dates: '—',
      pinned: false,
      shared: false,
      tags: ['personal'],
    },
  ]

  const sorted = [...rows].sort((a, b) => {
    const pa = PROJECTS.find((p) => p.id === a.id)!
    const pb = PROJECTS.find((p) => p.id === b.id)!
    let cmp = 0
    switch (sortKey) {
      case 'project':
        cmp = pa.name.localeCompare(pb.name)
        break
      case 'client':
        cmp = pa.client.localeCompare(pb.client)
        break
      case 'billable':
        cmp = Number(pa.billable) - Number(pb.billable)
        break
      case 'dates':
        cmp = a.dates.localeCompare(b.dates)
        break
    }
    return sortDir === 'desc' ? -cmp : cmp
  })

  return (
    <div className="scrollbar-slim min-h-0 flex-1 overflow-y-auto">
      <div className="flex flex-wrap items-center gap-3 px-5 pb-3 pt-4">
        <h1 className="font-display text-[21px] font-semibold text-hi">Projects</h1>
        <Button className="ml-auto">
          <Plus size={15} />
          New project
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2 px-5 pb-2">
        <span className="toolbar-pill">
          <ListTree size={13} /> Active <ChevronDown size={13} />
        </span>
        <span className="toolbar-pill">
          <Filter size={13} /> Filters
        </span>
        <span className="toolbar-pill">
          <ListFilter size={13} /> Group by
        </span>
        <span className="toolbar-pill">Sort by</span>

        <div className="ml-auto flex items-center gap-1">
          <span className="grid h-8 w-8 place-items-center rounded-md text-mid">
            <Search size={16} />
          </span>
          <span className="grid h-8 w-8 place-items-center rounded-md text-mid">
            <Users size={16} />
          </span>
          <span className="grid h-8 w-8 place-items-center rounded-md text-mid">
            <Settings size={16} />
          </span>
        </div>
      </div>

      <div className="px-5 pb-3">
        <span className="font-display text-[13px] text-mid">+ Filter</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] border-collapse">
          <thead>
            <tr className="border-y border-hairline text-left">
              <th className="w-9 py-2 pl-5" />
              <Th
                label="Project"
                sortKey="project"
                active={sortKey === 'project'}
                dir={sortDir}
                onSort={onSort}
                className="pr-4"
              />
              <Th
                label="Client"
                sortKey="client"
                active={sortKey === 'client'}
                dir={sortDir}
                onSort={onSort}
                className="w-[170px] pr-4"
              />
              <Th
                label="Billable"
                sortKey="billable"
                active={sortKey === 'billable'}
                dir={sortDir}
                onSort={onSort}
                className="w-[100px] pr-4"
              />
              <Th label="Rate" className="w-[110px] pr-4" />
              <Th
                label="Dates"
                sortKey="dates"
                active={sortKey === 'dates'}
                dir={sortDir}
                onSort={onSort}
                className="w-[170px] pr-4"
              />
              <Th label="Time status" className="w-[240px] pr-4" />
              <Th label="Fixed fee" className="w-[110px] pr-4" />
              <Th label="Variance" className="w-[120px] pr-4" />
              <Th label="Tags" star className="w-[130px] pr-5" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => {
              const p = PROJECTS.find((x) => x.id === r.id)!
              const pct = r.estimate ? Math.round((r.logged / r.estimate) * 100) : 0
              const variance = r.estimate - r.logged
              return (
                <tr key={r.id} className="border-b border-hairline">
                  <td className="w-9 py-3 pl-5">
                    <span className="block h-3.5 w-3.5 rounded-[3px] border border-hairline-2" />
                  </td>

                  <td className="py-3 pr-4">
                    <span className="flex items-center gap-2">
                      <Folder size={14} className={TONE[p.id]} />
                      <span
                        className={clsx(
                          'whitespace-nowrap font-display text-[14px] font-medium',
                          TONE[p.id],
                        )}
                      >
                        {p.name}
                      </span>
                      {r.shared && (
                        <span className="grid h-5 w-5 place-items-center rounded border border-hairline text-lo">
                          <Users size={11} />
                        </span>
                      )}
                      {r.pinned && <Pin size={13} className="text-pink" />}
                    </span>
                  </td>

                  <td className="py-3 pr-4">
                    {p.client !== p.name && p.billable ? (
                      <span className="font-display text-[14px] uppercase tracking-wide text-hi">
                        {p.client}
                      </span>
                    ) : null}
                  </td>

                  <td className="py-3 pr-4">
                    {p.billable && (
                      <span className="grid h-7 w-7 place-items-center rounded-md bg-pink-lo text-pink">
                        <DollarSign size={14} />
                      </span>
                    )}
                  </td>

                  <td className="py-3 pr-4">
                    {p.billable && (
                      <span className="tnum font-display text-[14px] text-hi">
                        {p.rate}{' '}
                        <span className="text-[13px] text-mid">{p.currency}</span>
                      </span>
                    )}
                  </td>

                  <td className="tnum py-3 pr-4 text-[14px] text-hi">
                    {r.dates === '—' ? '' : r.dates}
                  </td>

                  <td className="py-3 pr-4">
                    {r.estimate ? (
                      <>
                        <div className="tnum text-[13px] text-hi">
                          {formatDuration(r.logged)} of {r.estimate}h{' '}
                          <span className="text-mid">· {pct}%</span>
                        </div>
                        <div className="mt-1.5 h-1 w-full overflow-hidden rounded-pill bg-panel-3">
                          <div
                            className="h-full rounded-pill bg-ok transition-[width] duration-500"
                            style={{ width: `${Math.min(100, pct)}%` }}
                          />
                        </div>
                      </>
                    ) : (
                      <span className="tnum text-[13px] text-hi">
                        {formatDuration(r.logged)}
                      </span>
                    )}
                  </td>

                  <td className="py-3 pr-4" />

                  <td className="py-3 pr-4">
                    {r.estimate ? (
                      <span
                        className={clsx(
                          'tnum font-display text-[14px]',
                          variance >= 0 ? 'text-ok' : 'text-bad',
                        )}
                      >
                        {variance >= 0 ? '+' : '−'}
                        {formatDuration(Math.abs(variance))}
                      </span>
                    ) : null}
                  </td>

                  <td className="py-3 pr-5">
                    <span className="flex flex-wrap gap-1.5">
                      {r.tags.map((t) => (
                        <span
                          key={t}
                          className="inline-flex items-center gap-1 rounded border border-hairline bg-panel-2 px-1.5 py-0.5 text-2xs text-mid"
                        >
                          <Tag size={10} className="text-e-lilac" />
                          {t}
                        </span>
                      ))}
                    </span>
                  </td>
                </tr>
              )
            })}

            <tr>
              <td colSpan={10} className="py-3 pl-5">
                <span className="inline-flex items-center gap-2 font-display text-2xs font-semibold uppercase tracking-[0.08em] text-mid">
                  <Plus size={13} />
                  Add project
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
