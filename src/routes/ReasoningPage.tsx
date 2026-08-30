import { Fragment, useEffect, useRef, useState, type RefObject } from 'react'
import clsx from 'clsx'
import { ArrowRight, ArrowUpRight, ChevronDown, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  Assertion,
  Bullets,
  Equation,
  Flow,
  Grid,
  Loop,
  Panel,
  Prose,
  Quote,
  Rating,
  Section,
  TONE,
  Verdict,
  type Level,
} from '../components/reasoning/kit'

/* ---------------------------------------------------------------- Contents */

const CONTENTS: { id: string; label: string; tone: keyof typeof TONE }[] = [
  { id: 'brief', label: 'The brief', tone: 'neutral' },
  { id: 'evidence', label: 'User evidence', tone: 'evidence' },
  { id: 'strategy', label: 'Toggl strategy', tone: 'strategy' },
  { id: 'analysis', label: 'Product analysis', tone: 'analysis' },
  { id: 'prioritization', label: 'Prioritization', tone: 'decision' },
  { id: 'hypothesis', label: 'The bet', tone: 'decision' },
  { id: 'loops', label: 'The two loops', tone: 'strategy' },
  { id: 'measure', label: 'Metrics & risks', tone: 'neutral' },
  { id: 'thesis', label: 'Thesis', tone: 'neutral' },
  { id: 'sources', label: 'Sources', tone: 'neutral' },
]

/**
 * Highlights the section currently under the header.
 *
 * The observer only reports sections whose visibility *changed*, so a jump —
 * an anchor click, or a restored scroll position — can deliver a callback
 * containing nothing visible at all. Keeping the whole visible set means the
 * topmost one is always known, whatever arrived in that particular callback.
 */
function useActiveSection(root: RefObject<HTMLElement | null>) {
  const [active, setActive] = useState(CONTENTS[0].id)
  const visible = useRef(new Set<string>())

  useEffect(() => {
    const el = root.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.current.add(e.target.id)
          else visible.current.delete(e.target.id)
        }
        const first = CONTENTS.find((c) => visible.current.has(c.id))
        if (first) setActive(first.id)
      },
      { root: el, rootMargin: '-88px 0px -60% 0px', threshold: 0 },
    )
    CONTENTS.forEach((c) => {
      const node = document.getElementById(c.id)
      if (node) observer.observe(node)
    })
    return () => observer.disconnect()
  }, [root])

  return active
}

/* -------------------------------------------------------- The ranked list -
 * Titles as captured from the Toggl Community product-feedback board, ranked
 * by engagement. Grouped here by what the thread is actually asking for.     */

/** Verified against capterra.com/p/247745/Toggl/reviews/ on fetch — quoted verbatim,
 *  reviewer name and role exactly as Capterra displays them. G2 could not be added: its
 *  review pages return HTTP 403 to fetching, so nothing from it is quoted here. */
const CAPTERRA_REVIEWS: { quote: string; who: string }[] = [
  { quote: 'the jump to get more users is a bit pricey', who: 'Renato R. · Director' },
  {
    quote: 'Custom reporting and deeper filtering are locked behind paid plans, which feels limiting for more advanced needs.',
    who: 'Cristiano F. · Consultant',
  },
]

const COMMUNITY: { group: string; note: string; items: string[] }[] = [
  {
    group: 'Defending a habit that changed',
    note: 'Timer and time-log regressions. The loudest cluster by some distance.',
    items: [
      'Go back to time when old timer ended',
      'Timer is showing no time entries for the last 90 days',
      'Please Revert the Windows Mini Timer',
      'What they have done to the Timer-list view?',
      'Please completely revert changes to timer page',
      'Issues with Toggl in browser',
    ],
  },
  {
    group: 'Reach & packaging',
    note: 'Where Toggl runs, and what a free account still gets.',
    items: [
      'Could you please consider making the report view unlimited again for Free plan users?',
      'Please relaunch Linux app',
      'Feature Request: Official Toggl Track MCP Server',
    ],
  },
  {
    group: 'Forward-looking control',
    note: 'The one cluster asking about the future rather than the past.',
    items: ['Feedback on Goals', 'Limited to 4 Goals', 'Goals for specific clients'],
  },
  { group: 'Everyday gaps', note: 'Small, concrete, cheap.', items: ['Add notes to time entries'] },
]

/* --------------------------------------------------------------- The matrix */

const DIMENSIONS = [
  'IC value',
  'W0 immediacy',
  'Recurring use',
  'Toggl 2.0 fit',
  'Data advantage',
  'Uses what exists',
]

interface Candidate {
  name: string
  scores: Level[]
  verdict: 'build' | 'later' | 'no'
}

const CANDIDATES: Candidate[] = [
  { name: 'Intelligent estimation', scores: ['high', 'high', 'med', 'high', 'high', 'med'], verdict: 'build' },
  { name: 'Intelligent scheduling', scores: ['high', 'high', 'high', 'high', 'med', 'high'], verdict: 'build' },
  { name: 'Adaptive replanning', scores: ['high', 'med', 'high', 'high', 'high', 'high'], verdict: 'build' },
  { name: 'Goal updates & limits', scores: ['med', 'med', 'med', 'med', 'low', 'med'], verdict: 'later' },
  { name: 'Custom dashboards / charts', scores: ['med', 'low', 'low', 'low', 'low', 'med'], verdict: 'no' },
  { name: 'Personal utilization', scores: ['low', 'low', 'med', 'med', 'med', 'med'], verdict: 'no' },
  { name: 'Personal profitability', scores: ['med', 'low', 'low', 'med', 'med', 'med'], verdict: 'no' },
  { name: 'More reporting depth', scores: ['med', 'low', 'med', 'low', 'med', 'high'], verdict: 'no' },
  { name: 'Deeper AI Copilot answers', scores: ['med', 'med', 'low', 'med', 'med', 'high'], verdict: 'no' },
]

function Matrix() {
  return (
    <div className="overflow-x-auto rounded-xl border border-hairline bg-panel">
      <table className="w-full min-w-[720px] border-collapse text-left">
        <thead>
          <tr className="border-b border-hairline">
            <th className="px-5 py-2.5 font-display text-2xs font-semibold uppercase tracking-[0.1em] text-lo">
              Opportunity
            </th>
            {DIMENSIONS.map((d) => (
              <th
                key={d}
                className="px-3 py-3 font-display text-2xs font-semibold uppercase tracking-[0.06em] text-lo"
              >
                {d}
              </th>
            ))}
            <th className="px-5 py-3 text-right font-display text-2xs font-semibold uppercase tracking-[0.1em] text-lo">
              Call
            </th>
          </tr>
        </thead>
        <tbody>
          {CANDIDATES.map((c) => (
            <tr
              key={c.name}
              className={clsx(
                'border-b border-hairline last:border-b-0',
                c.verdict === 'build' && 'bg-pink-lo/40',
              )}
            >
              <td className="px-5 py-2.5 font-display text-[13.5px] font-semibold text-hi">
                {c.name}
              </td>
              {c.scores.map((s, i) => (
                <td key={i} className="px-3 py-2.5">
                  <Rating level={s} />
                </td>
              ))}
              <td className="px-5 py-2.5 text-right">
                <Verdict kind={c.verdict} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** The community board, collapsed to titles-and-counts until a group is opened. */
function CommunityBoard() {
  const [open, setOpen] = useState<Set<string>>(new Set())
  const toggle = (group: string) =>
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(group)) next.delete(group)
      else next.add(group)
      return next
    })

  return (
    <div className="rounded-xl border border-hairline bg-panel">
      <div className="border-b border-hairline px-5 py-3">
        <span className="eyebrow text-e-blue">Community feedback — ranked by engagement</span>
      </div>
      <div className="divide-y divide-hairline">
      {COMMUNITY.map((g) => {
        const isOpen = open.has(g.group)
        return (
          <div key={g.group} className="px-5 py-3.5">
            <button
              onClick={() => toggle(g.group)}
              className="flex w-full flex-wrap items-baseline gap-x-2.5 text-left"
              aria-expanded={isOpen}
            >
              <span className="font-display text-[13.5px] font-semibold text-hi">{g.group}</span>
              <span className="inline-flex items-center gap-1 font-display text-2xs font-semibold text-e-blue">
                {g.items.length} thread{g.items.length > 1 ? 's' : ''}
                <ChevronDown
                  size={11}
                  className={clsx('transition-transform', isOpen && 'rotate-180')}
                />
              </span>
              <span className="text-[12.5px] text-lo">{g.note}</span>
            </button>
            {isOpen && (
              <ul className="mt-2.5 space-y-1.5">
                {g.items.map((t) => (
                  <li key={t} className="flex gap-2.5 text-[13px] leading-snug text-mid">
                    <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-e-blue" />
                    <span className="min-w-0">“{t}”</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )
      })}
      </div>
    </div>
  )
}

/** A tight label — one-line explanation list, for the places prose would bloat. */
function Terms({ items, tone = 'neutral' }: { items: [string, string][]; tone?: keyof typeof TONE }) {
  return (
    <div className="divide-y divide-hairline rounded-xl border border-hairline bg-panel">
      {items.map(([term, note]) => (
        <div key={term} className="flex flex-col gap-0.5 px-5 py-3 sm:flex-row sm:gap-5">
          <span
            className={clsx(
              'shrink-0 font-display text-[13.5px] font-semibold sm:w-[168px]',
              TONE[tone].text === 'text-mid' ? 'text-hi' : TONE[tone].text,
            )}
          >
            {term}
          </span>
          <span className="min-w-0 text-[13.5px] leading-relaxed text-mid">{note}</span>
        </div>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------- Page */

export function ReasoningPage() {
  const scroller = useRef<HTMLDivElement>(null)
  const active = useActiveSection(scroller)

  return (
    <div ref={scroller} className="scrollbar-slim h-full overflow-y-auto bg-surface">
      <header className="sticky top-0 z-20 border-b border-hairline bg-surface/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1180px] items-center gap-3 px-6">
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-pink">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M12 3v8" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
              <path
                d="M18.4 6.2a9 9 0 1 1-12.8 0"
                stroke="#fff"
                strokeWidth="2.6"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <span className="truncate font-display text-[13.5px] font-semibold text-hi">
            Reasoning & product strategy
          </span>
          <span className="hidden text-2xs text-dim sm:inline">·</span>
          <span className="hidden truncate text-2xs text-lo sm:inline">Toggl 2.0 case study</span>
          <Link
            to="/tasks"
            className="ml-auto inline-flex h-7 shrink-0 items-center gap-1.5 rounded-pill bg-pink px-3 font-display text-[12px] font-semibold text-white transition-colors hover:bg-pink-hi"
          >
            Open the prototype
            <ArrowUpRight size={13} />
          </Link>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1180px] gap-10 px-6 pb-24">
        {/* Contents rail */}
        <nav className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-[188px] shrink-0 flex-col justify-center py-8 xl:flex">
          <div className="eyebrow mb-3 text-dim">Contents</div>
          <ul className="space-y-px">
            {CONTENTS.map((c) => (
              <li key={c.id}>
                <a
                  href={`#${c.id}`}
                  className={clsx(
                    'flex items-center gap-2 rounded-lg px-2 py-[5px] font-display text-[12.5px] transition-colors',
                    active === c.id
                      ? 'bg-panel-2 font-semibold text-hi'
                      : 'font-medium text-lo hover:text-hi',
                  )}
                >
                  <span
                    className={clsx(
                      'h-1 w-1 shrink-0 rounded-full',
                      active === c.id ? TONE[c.tone].dot : 'bg-transparent',
                    )}
                  />
                  <span className="truncate">{c.label}</span>
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-6 space-y-1.5 border-t border-hairline pt-4">
            {(
              [
                ['evidence', 'What users said'],
                ['strategy', 'What Toggl said'],
                ['analysis', 'What I found'],
                ['decision', 'What I decided'],
              ] as const
            ).map(([tone, label]) => (
              <div key={tone} className="flex items-center gap-2 text-2xs text-lo">
                <span className={clsx('h-1.5 w-1.5 rounded-full', TONE[tone].dot)} />
                {label}
              </div>
            ))}
          </div>
        </nav>

        {/* Content */}
        <main className="min-w-0 max-w-[860px] flex-1">
          {/* Hero */}
          <div className="border-b border-hairline py-10">
            <div className="eyebrow text-lo">Toggl 2.0 · product case study</div>
            <h1 className="mt-4 font-display text-[32px] font-bold leading-[1.12] tracking-[-0.02em] text-hi sm:text-[40px]">
              AI scheduler for time intelligence
            </h1>
            <p className="mt-4 max-w-2xl text-[15.5px] leading-relaxed text-mid">
              The argument behind the prototype: what Toggl’s users are saying, what Toggl says it
              is becoming, what the product already contains — and how those resolve into one
              deliberate bet.
            </p>
          </div>

          {/* 01 — Brief, persona, problem */}
          <Section
            id="brief"
            index="01"
            kicker="The brief"
            title="Improve the product for individual contributors"
            lede="Improve the experience of an individual contributor, freelancer or contractor, with particular attention to W0 retention. That second half does the work: it rules out every concept whose payoff comes later than that."
          >
            <Assertion label="The question I set myself">
              How might Toggl make an individual feel immediate value from its time intelligence, so
              that they want to come back and use it as part of their work?
            </Assertion>

            <Grid cols={2}>
              <Panel tone="analysis" eyebrow="The persona" filled>
                <p className="mb-2.5 text-[13.5px] text-hi">
                  An engineer contracting on a client project — not a manager with a team.
                </p>
                <Bullets
                  tone="analysis"
                  items={[
                    'How long will this take?',
                    'Can I realistically commit to it?',
                    'When can I deliver it?',
                    'What happens when reality changes?',
                    'How do my future estimates get better?',
                  ]}
                />
              </Panel>
              <Panel eyebrow="Not this persona">
                <Bullets
                  items={[
                    'Team utilization and resource allocation',
                    'Agency profitability, bill rate minus cost rate',
                  ]}
                />
                <p className="mt-3 text-[13.5px] leading-relaxed text-lo">
                  Real Toggl jobs, belonging to whoever runs the team.
                </p>
                <div className="mt-4 border-t border-hairline pt-3">
                  <div className="eyebrow text-lo">W0 rules out</div>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-mid">
                    Anything needing months of personal history — which is most retrospective
                    analysis.
                  </p>
                </div>
              </Panel>
            </Grid>

            <Assertion label="The job to be done">
              Make a realistic commitment to work. Toggl solved tracking; what is unsolved is that
              committing to work still runs on guesswork, while Toggl already holds the record of
              what that same work took. The opportunity is to spend what it knows{' '}
              <em>before</em> the work happens.
            </Assertion>
          </Section>

          {/* 02 — Evidence */}
          <Section
            id="evidence"
            index="02"
            tone="evidence"
            kicker="User evidence"
            title="What Toggl’s users are actually saying"
            lede="I read the Toggl Community product-feedback board, ranked by engagement, plus public reviews on Capterra. Rank matters more than any single thread — it is the closest thing to a vote this data has. Click a group to see the threads in it."
          >
            <CommunityBoard />

            <Panel eyebrow={`Capterra reviews — ${CAPTERRA_REVIEWS.length} quoted`}>
              <div className="space-y-2.5">
                {CAPTERRA_REVIEWS.map((r) => (
                  <p key={r.who} className="text-[13px] leading-relaxed text-mid">
                    “{r.quote}” <span className="text-lo">— {r.who}</span>
                  </p>
                ))}
              </div>
              <a
                href="https://www.capterra.com/p/247745/Toggl/reviews/"
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-1 font-display text-2xs font-semibold text-e-blue underline-offset-2 hover:underline"
              >
                See the reviews <ExternalLink size={10} />
              </a>
            </Panel>

            <Panel tone="evidence" eyebrow="Reading it honestly" filled>
              <p>
                Most of this is people defending a habit that changed under them — that’s feedback
                for change management, not a request for a new feature. There’s also real feedback
                on pricing and packaging, and a scatter of smaller gaps. The one group looking
                forward rather than back is Goals — people asking Toggl to help them plan, not
                only record.
              </p>
              <p className="mt-2.5">
                None of this is exhaustive, though: feedback like this mostly reflects what people
                already had and miss, not what they’ve never been offered or thought to ask for.
              </p>
            </Panel>
          </Section>

          {/* 03 — Strategy */}
          <Section
            id="strategy"
            index="03"
            tone="strategy"
            kicker="Toggl strategy"
            title="What is Toggl becoming"
          >
            <Quote
              source="Toggl Community — Introducing Toggl 2.0"
              href="https://community.toggl.com/t/introducing-toggl-2-0/4757"
            >
              “a Toggl that doesn’t stop at recording your hours, but helps you understand what to
              do with them.”
            </Quote>

            <div>
              <div className="eyebrow text-pink">The shift, in Toggl’s framing</div>
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <span className="rounded-lg bg-panel-2 px-3 py-1.5 font-display text-[13px] font-semibold text-mid">
                  “where did our time go?”
                </span>
                <span className="font-display text-[15px] text-pink">→</span>
                <span className="rounded-lg bg-panel-2 px-3 py-1.5 font-display text-[13px] font-semibold text-hi">
                  “what should we do next?”
                </span>
              </div>
            </div>

            <div>
              <div className="eyebrow text-lo">The questions it names</div>
              <div className="mt-2.5">
                <Bullets
                  tone="strategy"
                  items={[
                    'Do we have the capacity to take this on?',
                    'Are we making money on work we already said yes to?',
                    'What is the right resourcing decision?',
                    'What should we take on next?',
                  ]}
                />
              </div>
              <p className="mt-2.5 text-[13px] leading-relaxed text-lo">
                Three of four are asked in the plural, by someone running a team.
              </p>
            </div>

            <Panel tone="strategy" eyebrow="The Focus / 2.0 page, same direction" filled>
              <p>
                Its headline is already the whole thesis —{' '}
                <a
                  href="https://toggl.com/focus/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-hi underline-offset-2 hover:underline"
                >
                  “Toggl 2.0 turns time data into your next smart decision”
                </a>{' '}
                — and the freelancer promise underneath it is{' '}
                <span className="text-hi">
                  “Build a time history that makes every future estimate smarter.”
                </span>{' '}
                Toggl already tells this persona the payoff is a better estimate; nothing in the
                product hands them one. So the opportunity is not “add AI to Track” — it is to
                connect three things the product keeps apart:
              </p>
              <div className="mt-3">
                <Flow
                  steps={[
                    { label: 'Time data' },
                    { label: 'Planning', built: true },
                    { label: 'Decision', built: true },
                  ]}
                />
              </div>
            </Panel>

            <Assertion label="My interpretation — not Toggl’s claim">
              For an individual contributor, “do we have the capacity to take this on?” becomes: can
              I realistically commit to this work, and when can I actually do it?
            </Assertion>
          </Section>

          {/* 04 — Product analysis */}
          <Section
            id="analysis"
            index="04"
            tone="analysis"
            kicker="Product analysis"
            title="Toggl is missing the sequence"
            lede="I went through the product first: Timer in all four views — Calendar, Split View, Time Log, Timesheet — plus Analyze and Reports, Projects, Timeline, the AI Copilot, the planning fields, planned versus actual, alerts, tasks and projects."
          >
            <Panel tone="analysis" eyebrow="What I actually found" filled>
              <p className="text-hi">The intelligence is fragmented, and it waits to be asked.</p>
              <p className="mt-2.5 text-[13.5px] leading-relaxed text-mid">
                Split view already draws logged time on the left of each day and planned on the
                right — a vocabulary for plan versus actual it has had for years. Copilot can
                already answer a question about an estimate. What is missing is not a piece; it is
                the user having to know it exists, ask it, then act on the answer somewhere else.
              </p>
            </Panel>

            <Panel tone="analysis" eyebrow="The specific gap" filled>
              <p>
                Every task in 2.0 already carries <span className="text-hi">Estimate</span>,{' '}
                <span className="text-hi">Planned</span> and <span className="text-hi">Logged</span>
                . Logged fills itself, Estimate gets a guess, and Planned is almost always empty —
                filling it means hand-entering blocks around a calendar, a dependency and a deadline
                you hold in your head. So the loop never closes.
              </p>
              <p className="mt-2.5 font-display text-[15px] font-medium text-hi">
                The prototype does not add a field. It fills in the one already there.
              </p>
            </Panel>

            <Grid cols={2}>
              <Panel eyebrow="Today — Copilot">
                <p className="font-display text-[14.5px] text-hi">
                  “How long do you think this will take?”
                </p>
                <p className="mt-2 text-[13px] leading-relaxed text-lo">
                  You have to know the question exists and ask it. The AI answers; the calendar, the
                  deadline and the decision stay yours.
                </p>
              </Panel>
              <Panel tone="strategy" eyebrow="Proposed" filled>
                <Flow
                  steps={[
                    { label: 'Task arrives' },
                    { label: 'Estimate', built: true },
                    { label: 'Capacity', built: true },
                    { label: 'Schedule', built: true },
                    { label: 'Replan', built: true },
                  ]}
                />
                <p className="mt-2.5 text-[13px] leading-relaxed text-mid">
                  Nobody had to ask anything.
                </p>
              </Panel>
            </Grid>

            <Assertion>
              The opportunity was never to make the AI answer more questions. It was to stop
              requiring the question.
            </Assertion>
          </Section>

          {/* 05 — Prioritization */}
          <Section
            id="prioritization"
            index="05"
            tone="decision"
            kicker="Prioritization"
            title="Feedback is not a roadmap"
            lede="The three inputs answer three different questions. Prioritization is the only place they are allowed to argue with each other."
          >
            <Grid cols={3}>
              {(
                [
                  ['evidence', 'User feedback', 'what hurts'],
                  ['strategy', 'Strategy', 'where the company is going'],
                  ['analysis', 'Product analysis', 'what is feasible and differentiated'],
                ] as const
              ).map(([tone, k, v]) => (
                <div
                  key={k}
                  className={clsx('rounded-xl border p-4', TONE[tone].border, TONE[tone].bg)}
                >
                  <div className={clsx('eyebrow', TONE[tone].text)}>{k}</div>
                  <div className="mt-1.5 font-display text-[14px] font-medium leading-snug text-hi">
                    tells me {v}
                  </div>
                </div>
              ))}
            </Grid>

            <Matrix />

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-2xs text-lo">
              <span className="flex items-center gap-2">
                <Rating level="high" /> High
              </span>
              <span className="flex items-center gap-2">
                <Rating level="med" /> Medium
              </span>
              <span className="flex items-center gap-2">
                <Rating level="low" /> Low
              </span>
              <span className="ml-auto">My judgement, not measurements</span>
            </div>

            <div className="grid gap-x-8 gap-y-4 rounded-xl border border-hairline bg-panel p-[18px] sm:grid-cols-2">
              <div>
                <div className="eyebrow text-warn">Why these three</div>
                <div className="mt-2 space-y-1.5 text-[13px] leading-relaxed text-mid">
                  <p>
                    <strong className="text-hi">Estimation</strong> — the IC’s first question, and
                    only Toggl’s time history answers it well.
                  </p>
                  <p>
                    <strong className="text-hi">Scheduling</strong> — turns a number into a
                    commitment, and needs no personal history, which is what survives W0.
                  </p>
                  <p>
                    <strong className="text-hi">Replanning</strong> — the only one that gives a
                    reason to come back later the same week.
                  </p>
                </div>
              </div>
              <div>
                <div className="eyebrow text-lo">Why not the rest</div>
                <div className="mt-2 space-y-1.5 text-[13px] leading-relaxed text-mid">
                  <p>
                    <strong className="text-hi">Goal updates</strong> — improve a screen, not a
                    decision.
                  </p>
                  <p>
                    <strong className="text-hi">Dashboards & reporting</strong> — retrospective, and
                    better the more data you already have: backwards for W0.
                  </p>
                  <p>
                    <strong className="text-hi">Utilization</strong> — a management question wearing
                    a personal label.
                  </p>
                  <p>
                    <strong className="text-hi">Profitability</strong> — hourly, fixed-price and
                    salaried economics share no metric.
                  </p>
                  <p>
                    <strong className="text-hi">Deeper Copilot</strong> — still leaves the user
                    responsible for asking.
                  </p>
                </div>
              </div>
            </div>
          </Section>

          {/* 06 — The bet */}
          <Section
            id="hypothesis"
            index="06"
            tone="decision"
            kicker="The bet"
            title="An intelligent commitment layer, not an AI estimate"
          >
            <div className="rounded-xl border border-pink/40 bg-pink-lo/70 p-6">
              <div className="eyebrow text-pink">Product hypothesis</div>
              <p className="mt-3 font-display text-[20px] font-semibold leading-[1.35] text-hi">
                If Toggl turns its time intelligence into a proactive estimate, and then translates
                that estimate into a realistic schedule, an individual contributor can make better
                commitments with less cognitive effort.
              </p>
              <div className="mt-5 flex flex-wrap items-start gap-x-3 gap-y-4 border-t border-pink/25 pt-5">
                {[
                  ['Proactive', 'Arrives with the task'],
                  ['Contextual', 'Knows the week and the deadline'],
                  ['Embedded', 'On the task panel and calendar'],
                  ['Actionable', 'Ends in a block, not an answer'],
                ].map(([k, v], i, arr) => (
                  <Fragment key={k}>
                    <div className="min-w-[130px] max-w-[160px]">
                      <div className="font-display text-[13.5px] font-bold text-pink-hi">{k}</div>
                      <div className="mt-1 text-[13px] leading-snug text-mid">{v}</div>
                    </div>
                    {i < arr.length - 1 && (
                      <ArrowRight size={14} className="mt-1 shrink-0 text-pink/50" />
                    )}
                  </Fragment>
                ))}
              </div>
            </div>

            <Grid cols={2}>
              <Panel eyebrow="What an estimate says">
                <p className="font-display text-[15px] text-hi">
                  “This task will take about 10 hours.”
                </p>
                <p className="mt-2.5 text-[13.5px] text-lo">Useful. Not yet actionable.</p>
              </Panel>
              <Panel tone="decision" eyebrow="What a commitment says" filled>
                <p className="font-display text-[15px] text-hi">
                  “About 10 hours — and you have 12 free before Wednesday 17:00, so it fits.”
                </p>
                <p className="mt-2.5 text-[13.5px] text-mid">Now it is a decision.</p>
              </Panel>
            </Grid>

            <Equation
              terms={['Estimate', 'Capacity', 'Existing commitments', 'Deadline']}
              result="Realistic commitment"
              note="Scheduling is not the secondary half of the concept. It is the action layer that makes the intelligence worth having — and, usefully for a first-week constraint, it needs no personal history at all."
            />

            <Panel eyebrow="Where it sits in the whole loop">
              <Flow
                steps={[
                  { label: 'Task intake', built: true },
                  { label: 'Intelligent estimate', built: true },
                  { label: 'Capacity check', built: true },
                  { label: 'Schedule', built: true },
                  { label: 'Work' },
                  { label: 'Reality changes' },
                  { label: 'Adjust plan', built: true },
                  { label: 'Complete' },
                  { label: 'Learn' },
                ]}
              />
              <div className="mt-3.5 flex flex-wrap items-center gap-x-5 gap-y-2 text-2xs text-lo">
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm border border-pink/45 bg-pink-lo" />
                  Built in the prototype — the four steps where nothing exists today
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm border border-hairline-2 bg-panel" />
                  Closed by Toggl as it already is
                </span>
              </div>
            </Panel>
          </Section>

          {/* 07 — The two loops */}
          <Section
            id="loops"
            index="07"
            tone="strategy"
            kicker="The two loops"
            title="The estimate gets me in. The living plan gives me a reason to come back."
          >
            <Grid cols={2}>
              <Panel eyebrow="Activation — day one">
                <p className="text-hi">“Toggl immediately helped me understand this task.”</p>
                <p className="mt-2.5 text-[13.5px] leading-relaxed text-lo">
                  Worth having, but an estimate is a moment, and a moment retains nobody.
                </p>
              </Panel>
              <Panel tone="strategy" eyebrow="Retention — the rest of the week" filled>
                <p className="text-hi">“My plan stopped being true, and Toggl told me first.”</p>
                <p className="mt-2.5 text-[13.5px] leading-relaxed text-mid">
                  This is the part that recurs, because reality keeps happening to plans.
                </p>
              </Panel>
            </Grid>

            <Loop
              steps={[
                'Plan',
                'Work',
                'Reality changes',
                'Toggl notices',
                'Suggested adjustment',
                'Accept or edit',
              ]}
              caption="and again, every time the week moves"
            />

            <Panel eyebrow="What can make a plan untrue">
              <Bullets
                tone="strategy"
                items={[
                  'A meeting lands inside a block you had set aside',
                  'The work is running longer than the estimate assumed',
                  'The task description grows a second surface',
                  'You could not start when you planned to, or new work arrives on top',
                  'Something the task quietly waits on slips',
                ]}
              />
              <p className="mt-3 text-[13.5px] leading-relaxed text-lo">
                Deliberately not a dependency-management system — every trigger is something Toggl
                already observes: tracked time, the connected calendar, edits to the task. “Falling
                behind” is deliberately not the first: a concept that only tells you that you are
                late gets muted in a week.
              </p>
            </Panel>

            <Panel>
              <div className="eyebrow mb-3 text-lo">The slower loop</div>
              <Flow
                steps={[
                  { label: 'Estimate', built: true },
                  { label: 'Actual' },
                  { label: 'Variance' },
                  { label: 'Learn', built: true },
                  { label: 'Better next estimate', built: true },
                ]}
              />
              <div className="mt-3.5 space-y-1.5 border-t border-hairline pt-3.5 text-[13px] leading-relaxed text-mid">
                <p>
                  <strong className="text-hi">Cold start, answered honestly</strong> — day one leans
                  on the client’s project data and the task’s scope, and says so: 7–15h at low
                  confidence, tightening to 8–12h by day five.
                </p>
                <p>
                  <strong className="text-hi">History has to expire</strong> — an AI coding
                  assistant entering the workflow resets the pace, and a model averaging a flat year
                  would still quote the old one.
                </p>
              </div>
            </Panel>
          </Section>

          {/* 08 — Metrics & risks */}
          <Section
            id="measure"
            index="08"
            kicker="Metrics & risks"
            title="What would tell me this is working, and what would sink it"
          >
            <Grid cols={3}>
              <Panel tone="decision" eyebrow="Activation" filled>
                <Bullets
                  tone="decision"
                  items={[
                    'Users who engage with an intelligent estimate',
                    'Who accept or edit rather than ignore it',
                    'Who turn an estimate into a schedule',
                  ]}
                />
              </Panel>
              <Panel tone="strategy" eyebrow="W0 retention" filled>
                <Bullets
                  tone="strategy"
                  items={[
                    'Who return to review or adjust a plan',
                    'Who plan more than once in week one',
                    'Response rate on a suggested adjustment',
                  ]}
                />
              </Panel>
              <Panel tone="analysis" eyebrow="Quality" filled>
                <Bullets
                  tone="analysis"
                  items={[
                    'Estimate versus actual variance',
                    'Acceptance and manual override rates',
                    'Accuracy change over time',
                  ]}
                />
              </Panel>
            </Grid>

            <Prose className="text-[13.5px]">
              None establishes causation alone. Retention moving with a flat override rate would be
              encouraging; acceptance rising while variance worsens would mean users are trusting
              something that has not earned it. The pairs matter more than any figure.
            </Prose>

            <Terms
              items={[
                ['Trust & false precision', 'An estimate you did not make is one you have no reason to believe — hence an auditable sum of factors, and a range that is widest exactly when the system knows least.'],
                ['Thin or stale data', 'Cold start leans on project data before personal data; work patterns then shift, so a baseline that averages everything quotes a pace that no longer exists.'],
                ['Own numbers', 'Many users will prefer their own estimate. The plan has to be worth having when the estimate is overridden.'],
                ['Intervention fatigue', 'A system that raises every wobble becomes noise, then gets muted. That threshold is the hardest unsolved part.'],
                ['Prototype scope', 'Frontend only, mocked data, a deterministic estimator rather than a model — it validates the interaction and the argument, not the accuracy.'],
              ]}
            />
          </Section>

          {/* 09 — Thesis */}
          <Section id="thesis" index="09" kicker="Thesis" title="The bet, in four lines">
            <div className="rounded-xl border border-hairline bg-panel p-6">
              <p className="font-display text-[16.5px] leading-[1.5] text-mid">
                Toggl has spent years building a trusted record of what happened to our time.
              </p>
              <p className="mt-3 font-display text-[16.5px] leading-[1.5] text-mid">
                Toggl 2.0 is about turning that record into better decisions.
              </p>
              <p className="mt-3 font-display text-[16.5px] leading-[1.5] text-mid">
                For an individual contributor, one of the most important is:{' '}
                <span className="font-semibold text-hi">“Can I realistically commit to this?”</span>
              </p>
              <p className="mt-3 font-display text-[16.5px] font-semibold leading-[1.5] text-hi">
                The concept makes Toggl answer that proactively — and keep the answer honest as the
                work changes.
              </p>
            </div>

            <Panel tone="decision" eyebrow="Why this one" filled>
              <p className="font-display text-[15px] leading-relaxed text-hi">
                I did not choose this because it was the most requested feature. It was not
                requested at all.
              </p>
              <p className="mt-2">
                I chose it because it is the only candidate at the intersection of all four
                constraints the brief imposes: a real IC need, value inside week zero, Toggl’s
                stated direction, and the data advantage nobody else in the category has.
              </p>
            </Panel>

            <div className="pt-1">
              <Link
                to="/tasks"
                className="inline-flex h-10 items-center gap-2 rounded-pill bg-pink px-5 font-display text-[13.5px] font-semibold text-white transition-colors hover:bg-pink-hi"
              >
                See it working
                <ArrowUpRight size={15} />
              </Link>
            </div>
          </Section>

          {/* 10 — Sources */}
          <Section id="sources" index="10" kicker="Sources" title="What this is built on">
            <div className="divide-y divide-hairline rounded-xl border border-hairline bg-panel">
              {(
                [
                  [
                    'strategy',
                    'Toggl 2.0 announcement',
                    'Source of every quoted phrase in section 03.',
                    'https://community.toggl.com/t/introducing-toggl-2-0/4757',
                  ],
                  [
                    'strategy',
                    'Toggl Focus — the 2.0 product page',
                    'The freelancer-facing promise that tracking makes future estimates smarter.',
                    'https://toggl.com/focus/',
                  ],
                  [
                    'evidence',
                    'Toggl Community feedback, ranked',
                    'Thread titles in section 02 are taken from it verbatim.',
                    'https://community.toggl.com/c/product-feedback',
                  ],
                  [
                    'evidence',
                    'Capterra reviews',
                    'Two quotes in section 02 are taken from it verbatim.',
                    'https://www.capterra.com/p/247745/Toggl/reviews/',
                  ],
                  [
                    'evidence',
                    'G2 reviews',
                    'Attempted — G2 blocks fetching (HTTP 403), so nothing from it is quoted here.',
                    '',
                  ],
                  [
                    'analysis',
                    'My own walkthrough of Toggl',
                    'Timer in all four views, Analyze, Reports, Projects, Timeline, Copilot, planning fields, planned vs actual, alerts.',
                    '',
                  ],
                ] as const
              ).map(([tone, title, note, href]) => (
                <div key={title} className="flex gap-4 px-5 py-3">
                  <span className={clsx('mt-2 h-1.5 w-1.5 shrink-0 rounded-full', TONE[tone].dot)} />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="font-display text-[14px] font-semibold text-hi">{title}</span>
                      {href && (
                        <a
                          href={href}
                          target="_blank"
                          rel="noreferrer"
                          className={clsx(
                            'inline-flex items-center gap-1 font-display text-2xs font-semibold underline-offset-2 hover:underline',
                            TONE[tone].text,
                          )}
                        >
                          open <ExternalLink size={10} />
                        </a>
                      )}
                    </div>
                    <p className="mt-0.5 text-[13.5px] leading-relaxed text-mid">{note}</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </main>
      </div>
    </div>
  )
}
