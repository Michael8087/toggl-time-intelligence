import { useEffect, useRef, useState, type RefObject } from 'react'
import clsx from 'clsx'
import { ArrowUpRight, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  Assertion,
  Bullets,
  Compare,
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
  { id: 'persona', label: 'Persona & job', tone: 'neutral' },
  { id: 'problem', label: 'The problem', tone: 'neutral' },
  { id: 'evidence', label: 'User evidence', tone: 'evidence' },
  { id: 'strategy', label: 'Toggl strategy', tone: 'strategy' },
  { id: 'analysis', label: 'Product analysis', tone: 'analysis' },
  { id: 'triangulation', label: 'How the three combine', tone: 'decision' },
  { id: 'prioritization', label: 'Prioritization', tone: 'decision' },
  { id: 'hypothesis', label: 'The hypothesis', tone: 'decision' },
  { id: 'commitment', label: 'Estimate ≠ commitment', tone: 'decision' },
  { id: 'workflow', label: 'Proposed workflow', tone: 'strategy' },
  { id: 'retention', label: 'W0 retention loop', tone: 'strategy' },
  { id: 'learning', label: 'Learning loop', tone: 'strategy' },
  { id: 'copilot', label: 'Why not Copilot', tone: 'analysis' },
  { id: 'metrics', label: 'Success metrics', tone: 'neutral' },
  { id: 'risks', label: 'Risks', tone: 'neutral' },
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

const COMMUNITY: { group: string; note: string; items: string[] }[] = [
  {
    group: 'Defending a habit that changed',
    note: 'Regressions in the timer and time-log surfaces. The loudest cluster by some distance.',
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
    note: 'Three separate Goals threads — the one cluster asking about the future rather than the past.',
    items: ['Feedback on Goals', 'Limited to 4 Goals', 'Goals for specific clients'],
  },
  {
    group: 'Everyday gaps',
    note: 'Small, concrete, cheap.',
    items: ['Add notes to time entries'],
  },
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
  why: string
}

const CANDIDATES: Candidate[] = [
  {
    name: 'Intelligent estimation',
    scores: ['high', 'high', 'med', 'high', 'high', 'med'],
    verdict: 'build',
    why: 'Hits the IC’s first question on day one, and it is the one answer only Toggl’s own time history can give well.',
  },
  {
    name: 'Intelligent scheduling',
    scores: ['high', 'high', 'high', 'high', 'med', 'high'],
    verdict: 'build',
    why: 'Turns a number into a commitment. Needs no personal history at all, which is what makes it survive the W0 constraint.',
  },
  {
    name: 'Adaptive replanning',
    scores: ['high', 'med', 'high', 'high', 'high', 'high'],
    verdict: 'build',
    why: 'The only candidate here that generates a reason to come back later in the same week.',
  },
  {
    name: 'Goal updates & limits',
    scores: ['med', 'med', 'med', 'med', 'low', 'med'],
    verdict: 'later',
    why: 'Real, repeatedly asked for, and cheap. But it improves a surface the IC has to go and look at, rather than changing a decision they have to make.',
  },
  {
    name: 'Custom dashboards / charts',
    scores: ['med', 'low', 'low', 'low', 'low', 'med'],
    verdict: 'no',
    why: 'Customisation of a retrospective view. It creates no new workflow and nothing about it is uniquely Toggl.',
  },
  {
    name: 'Personal utilization',
    scores: ['low', 'low', 'med', 'med', 'med', 'med'],
    verdict: 'no',
    why: 'A management question wearing a personal label. A contractor with one client already knows their utilization.',
  },
  {
    name: 'Personal profitability',
    scores: ['med', 'low', 'low', 'med', 'med', 'med'],
    verdict: 'no',
    why: 'Valuable for some freelancers, meaningless for others — hourly, fixed-price and salaried economics do not share a metric.',
  },
  {
    name: 'More reporting depth',
    scores: ['med', 'low', 'med', 'low', 'med', 'high'],
    verdict: 'no',
    why: 'Reporting gets better as data accumulates, which is exactly backwards for a first-week constraint.',
  },
  {
    name: 'Deeper AI Copilot answers',
    scores: ['med', 'med', 'low', 'med', 'med', 'high'],
    verdict: 'no',
    why: 'Toggl already has Copilot. Making it answer more questions still leaves the user responsible for asking.',
  },
]

function Matrix() {
  return (
    <div className="overflow-x-auto rounded-xl border border-hairline bg-panel">
      <table className="w-full min-w-[720px] border-collapse text-left">
        <thead>
          <tr className="border-b border-hairline">
            <th className="px-5 py-3 font-display text-2xs font-semibold uppercase tracking-[0.1em] text-lo">
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
              <td className="px-5 py-3.5 font-display text-[13.5px] font-semibold text-hi">
                {c.name}
              </td>
              {c.scores.map((s, i) => (
                <td key={i} className="px-3 py-3.5">
                  <Rating level={s} />
                </td>
              ))}
              <td className="px-5 py-3.5 text-right">
                <Verdict kind={c.verdict} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ------------------------------------------------------------------- Page */

export function ReasoningPage() {
  const scroller = useRef<HTMLDivElement>(null)
  const active = useActiveSection(scroller)

  return (
    <div ref={scroller} className="scrollbar-slim h-full overflow-y-auto bg-surface">
      {/* Header */}
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
          <span className="hidden truncate text-2xs text-lo sm:inline">
            Toggl 2.0 case study
          </span>
          <Link
            to="/tasks"
            className="ml-auto inline-flex h-7 shrink-0 items-center gap-1.5 rounded-pill bg-pink px-3 font-display text-[12px] font-semibold text-white transition-colors hover:bg-pink-hi"
          >
            Open the prototype
            <ArrowUpRight size={13} />
          </Link>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1180px] gap-10 px-6 pb-28">
        {/* Contents rail */}
        <nav className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-[188px] shrink-0 flex-col justify-center py-8 xl:flex">
          <div className="eyebrow mb-3 text-dim">Contents</div>
          <ul className="space-y-px">
            {CONTENTS.map((c) => (
              <li key={c.id}>
                <a
                  href={`#${c.id}`}
                  className={clsx(
                    'flex items-center gap-2 rounded-lg py-[5px] pl-2 pr-2 font-display text-[12.5px] transition-colors',
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
          <div className="border-b border-hairline py-14">
            <div className="eyebrow text-lo">Toggl 2.0 · product case study</div>
            <h1 className="mt-4 font-display text-[38px] font-bold leading-[1.1] tracking-[-0.02em] text-hi sm:text-[46px]">
              Why I built the commitment layer,
              <br className="hidden sm:block" /> and not the most-requested feature
            </h1>
            <p className="mt-5 max-w-2xl text-[16.5px] leading-relaxed text-mid">
              This page is the argument behind the prototype: what the brief asked for, what
              Toggl’s users are actually saying, what Toggl says it is becoming, what the product
              already contains — and how those four things resolve into one deliberate bet.
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              {[
                ['Brief', 'Improve the IC / freelancer / independent contractor experience'],
                ['Hard constraint', 'W0 — value inside the first week, before history exists'],
                ['Deliverable', 'A working concept prototype, and the reasoning behind it'],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl border border-hairline bg-panel px-4 py-3.5">
                  <div className="eyebrow text-lo">{k}</div>
                  <div className="mt-1.5 text-[13.5px] leading-snug text-hi">{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 01 — Brief */}
          <Section
            id="brief"
            index="01"
            kicker="The brief"
            title="One question, asked under a first-week constraint"
            lede="The assignment is to improve the experience of an individual contributor, freelancer or independent contractor, with particular attention to W0 retention. That second half does most of the work: it rules out every concept whose payoff arrives in month three."
          >
            <Assertion label="The question I set myself">
              How might Toggl make an individual feel immediate value from its time intelligence, so
              that they want to come back and use it as part of their work?
            </Assertion>

            <Grid cols={2}>
              <Panel tone="decision" eyebrow="What W0 rules in" filled>
                <Bullets
                  tone="decision"
                  items={[
                    'Value on the first task, from data the user has not yet produced',
                    'A reason to return during the same week, not the same quarter',
                    'Something that works when the account is empty',
                  ]}
                />
              </Panel>
              <Panel eyebrow="What W0 rules out">
                <Bullets
                  items={[
                    'Anything that needs months of personal history to be interesting',
                    'Retrospective analysis, which is thin until the data is thick',
                    'Features whose value is “more of what you already track”',
                  ]}
                />
              </Panel>
            </Grid>
          </Section>

          {/* 02 — Persona */}
          <Section
            id="persona"
            index="02"
            kicker="Persona & job"
            title="An engineer with a client, not a manager with a team"
            lede="The representative user here is an individual software engineer working as a contractor on a client project. Work arrives in their queue and they have to decide what to do with it."
          >
            <Grid cols={2}>
              <Panel tone="analysis" eyebrow="The five questions they actually ask" filled>
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
              <Panel eyebrow="Legitimate elsewhere in Toggl — not here">
                <Bullets
                  items={[
                    'Team utilization',
                    'Resource allocation',
                    'Agency profitability',
                    'Bill rate minus cost rate',
                  ]}
                />
                <p className="mt-3 text-[13.5px] leading-relaxed text-lo">
                  These are real Toggl jobs. They belong to whoever is running the team — not to the
                  person the brief points me at.
                </p>
              </Panel>
            </Grid>

            <Assertion label="The job to be done">
              Make a realistic commitment to work.
            </Assertion>
          </Section>

          {/* 03 — Problem */}
          <Section
            id="problem"
            index="03"
            kicker="The problem"
            title="The estimate is still a guess, next to a database of answers"
            lede="The core problem is not time tracking. Toggl solved that. The problem is that planning and committing to work still runs on human guesswork, while Toggl is already holding the record of what that same work actually took."
          >
            <Grid cols={2}>
              <Panel eyebrow="What a bad estimate costs">
                <Bullets
                  items={[
                    'Overcommitment, then missed deadlines',
                    'Quotes that turn out to be wrong, where quoting applies',
                    'Planning done in your head, repeatedly',
                    'Commitments the client learns not to trust',
                  ]}
                />
              </Panel>
              <Panel tone="analysis" eyebrow="What Toggl already holds" filled>
                <Bullets
                  tone="analysis"
                  items={[
                    'How long comparable work took, per project and per person',
                    'Where the week is already committed',
                    'How estimates have historically diverged from actuals',
                  ]}
                />
              </Panel>
            </Grid>

            <Assertion>
              Toggl knows what work took. The opportunity is to spend that knowledge{' '}
              <em>before</em> the work happens, not after it.
            </Assertion>
          </Section>

          {/* 04 — Evidence */}
          <Section
            id="evidence"
            index="04"
            tone="evidence"
            kicker="User evidence"
            title="What Toggl’s users are actually saying"
            lede="I read the Toggl Community product-feedback board ranked by engagement, plus public reviews on Capterra and G2. The ranked list matters more than any single thread, because rank is the closest thing to a vote that this data has."
          >
            <div className="space-y-4">
              {COMMUNITY.map((g) => (
                <div key={g.group} className="rounded-xl border border-hairline bg-panel p-5">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h3 className="font-display text-[15px] font-semibold text-hi">{g.group}</h3>
                    <span className="tnum font-display text-2xs font-semibold text-e-blue">
                      {g.items.length} thread{g.items.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-lo">{g.note}</p>
                  <ul className="mt-3.5 space-y-1.5">
                    {g.items.map((t) => (
                      <li
                        key={t}
                        className="flex gap-2.5 text-[13.5px] leading-snug text-mid"
                      >
                        <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-e-blue" />
                        <span className="min-w-0">“{t}”</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <Panel tone="evidence" eyebrow="Reading the list honestly" filled>
              <p>
                Most of the engagement sits on regressions — the timer page, the time-log view, the
                Windows mini timer. That is a community defending a habit that changed underneath
                them, and it is the correct thing for them to be loud about.
              </p>
              <p className="mt-3">
                What the list does <strong className="text-hi">not</strong> contain is a request for
                anything resembling this concept. Nobody asks for an estimate they did not have to
                write, or for a plan that repairs itself. That absence is information, not
                permission to ignore the list: engagement rewards the loss of something familiar far
                more reliably than the absence of something never offered.
              </p>
              <p className="mt-3">
                The one cluster pointed forward rather than back is Goals — three separate threads
                about limits, scope and client-specific targets. People are asking Toggl to help
                them steer, not only to record. It is weak evidence, but it points the same way the
                strategy does.
              </p>
            </Panel>

            <Prose>
              I also read public reviews on Capterra and G2. I am not quoting numbers from them here,
              because I did not run a structured sample and inventing a statistic would undercut
              the rest of the argument. They informed my sense of the pain; the ranked board is the
              evidence I am actually leaning on.
            </Prose>
          </Section>

          {/* 05 — Strategy */}
          <Section
            id="strategy"
            index="05"
            tone="strategy"
            kicker="Toggl strategy"
            title="What Toggl says it is becoming"
            lede="Toggl’s own 2.0 announcement is the clearest available statement of where the company intends to go — and it is a statement about decisions, not about records."
          >
            <Quote
              source="Toggl Community — Introducing Toggl 2.0"
              href="https://community.toggl.com/t/introducing-toggl-2-0/4757"
            >
              “a Toggl that doesn’t stop at recording your hours, but helps you understand what to
              do with them.”
            </Quote>

            <Grid cols={2}>
              <Panel tone="strategy" eyebrow="Toggl’s framing of the shift" filled>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-lg bg-panel px-3 py-1.5 font-display text-[13px] font-semibold text-mid">
                    “where did our time go?”
                  </span>
                  <span className="font-display text-[15px] text-pink">→</span>
                  <span className="rounded-lg bg-panel px-3 py-1.5 font-display text-[13px] font-semibold text-hi">
                    “what should we do next?”
                  </span>
                </div>
                <p className="mt-3.5 text-[13.5px] leading-relaxed text-mid">
                  2.0 is described as the direction itself — the roadmap, the investment and the
                  brand — rather than a release.
                </p>
              </Panel>
              <Panel eyebrow="The questions the announcement names">
                <Bullets
                  tone="strategy"
                  items={[
                    'Do we have the capacity to take this on?',
                    'Are we making money on work we already said yes to?',
                    'What is the right resourcing decision?',
                    'What should we take on next?',
                  ]}
                />
              </Panel>
            </Grid>

            <Prose>
              Three of those four are asked in the plural, by someone running a team. The brief
              points me at one person. So the honest move is not to borrow the language — it is to
              translate it.
            </Prose>

            <Assertion label="My interpretation — not Toggl’s claim">
              For an individual contributor, “do we have the capacity to take this on?” becomes:
              can I realistically commit to this work, and when can I actually do it?
            </Assertion>

            <Panel tone="strategy" eyebrow="The Focus / 2.0 material, in the same direction" filled>
              <p>
                The product material aimed at freelancers makes the same promise from the other end:
                that tracking builds{' '}
                <span className="text-hi">
                  “a time history that makes every future estimate smarter.”
                </span>{' '}
                The company is already telling this persona that the payoff of tracking is a better
                estimate. Today, nothing in the product actually hands them one.
              </p>
              <p className="mt-3">
                Which means the strategic opportunity is not “add AI to Track”. It is to connect
                three things Toggl currently keeps apart:
              </p>
              <div className="mt-3.5">
                <Flow
                  steps={[
                    { label: 'Time data' },
                    { label: 'Planning', built: true },
                    { label: 'Decision', built: true },
                  ]}
                />
              </div>
            </Panel>
          </Section>

          {/* 06 — Product analysis */}
          <Section
            id="analysis"
            index="06"
            tone="analysis"
            kicker="Product analysis"
            title="Toggl is not missing the pieces. It is missing the sequence."
            lede="Before assuming a gap, I went through the product: Timer in all four views — Calendar, Split View, Time Log, Timesheet — plus Analyze and Reports, Projects, Timeline, the AI Copilot, the existing planning fields, planned versus actual, alerts, and the task and project model."
          >
            <Grid cols={2}>
              <Panel eyebrow="What I expected to conclude">
                <p className="text-hi">“Toggl is missing planning, reporting or AI.”</p>
                <p className="mt-3 text-[13.5px] leading-relaxed text-lo">
                  It is not. All three exist, and several are good. Split view already draws logged
                  time on the left of each day and planned time on the right — the app has a
                  vocabulary for plan versus actual and has had one for years.
                </p>
              </Panel>
              <Panel tone="analysis" eyebrow="What I actually found" filled>
                <p className="text-hi">
                  The intelligence is fragmented, and it waits to be asked.
                </p>
                <p className="mt-3 text-[13.5px] leading-relaxed text-mid">
                  Copilot can already answer a question about an estimate or a utilization figure.
                  But the user has to know the question exists, know to ask it, and then act on the
                  answer somewhere else in the product.
                </p>
              </Panel>
            </Grid>

            <Panel tone="analysis" eyebrow="The specific gap" filled>
              <p>
                Toggl 2.0 ships three fields on every task —{' '}
                <span className="text-hi">Estimate</span>,{' '}
                <span className="text-hi">Planned</span> and{' '}
                <span className="text-hi">Logged</span>. Logged fills itself. Estimate gets a guess.
                Planned is almost always empty, because filling it means hand-entering blocks around
                a calendar, a dependency and a deadline you are holding in your head.
              </p>
              <p className="mt-3">
                So the loop never closes. The prototype does not add a field. It fills in the one
                that is already there.
              </p>
            </Panel>

            <Grid cols={4}>
              {[
                ['Proactive', 'Arrives with the task, unprompted'],
                ['Contextual', 'Knows the project, the week and the deadline'],
                ['Embedded', 'Lives on the task panel and the calendar'],
                ['Actionable', 'Ends in a scheduled block, not an answer'],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl border border-e-lilac/35 bg-e-lilac/[0.07] p-4">
                  <div className="font-display text-[13.5px] font-bold text-e-lilac">{k}</div>
                  <div className="mt-1.5 text-[13px] leading-snug text-mid">{v}</div>
                </div>
              ))}
            </Grid>
          </Section>

          {/* 07 — Triangulation */}
          <Section
            id="triangulation"
            index="07"
            tone="decision"
            kicker="How the three combine"
            title="Feedback is not a roadmap"
            lede="The three inputs answer three different questions. Treating any one of them as the decision is the mistake."
          >
            <Grid cols={3}>
              {(
                [
                  ['evidence', 'User feedback', 'tells me what hurts'],
                  ['strategy', 'Strategy', 'tells me where the company is going'],
                  ['analysis', 'Product analysis', 'tells me what is feasible and differentiated'],
                ] as const
              ).map(([tone, k, v]) => (
                <div
                  key={k}
                  className={clsx('rounded-xl border p-5', TONE[tone].border, TONE[tone].bg)}
                >
                  <div className={clsx('eyebrow', TONE[tone].text)}>{k}</div>
                  <div className="mt-2 font-display text-[15px] font-medium leading-snug text-hi">
                    {v}
                  </div>
                </div>
              ))}
            </Grid>

            <div className="flex justify-center py-1">
              <div className="h-6 w-px bg-hairline-2" />
            </div>

            <Panel tone="decision" eyebrow="Prioritization" filled>
              <p className="font-display text-[16px] font-medium leading-relaxed text-hi">
                Prioritization is the only place all three are allowed to argue with each other.
              </p>
              <p className="mt-3">
                Community feedback gave me the opportunity space and a map of the pain. It did not
                choose the bet. If it had, I would be shipping a revert of the timer page — which is
                genuinely worth doing, and is a maintenance decision rather than a strategic one.
              </p>
              <p className="mt-3">
                Goal updates are the sharper test. Three ranked threads, obviously wanted, cheap to
                build. I still did not prioritise them, and the reason is the brief: they are weakly
                connected to the IC’s job of committing to work, weakly connected to time
                intelligence, and they improve a screen rather than change a decision.
              </p>
            </Panel>

            <Panel eyebrow="What I let win, and in what order">
              <Bullets
                tone="decision"
                items={[
                  'Immediate value to a brand-new IC, on their first task',
                  'A workflow that recurs, rather than a screen that improves',
                  'Something only Toggl’s time data can do well',
                  'A step toward proactive time intelligence, not more retrospect',
                  'Help making a decision — not more information about one',
                ]}
              />
            </Panel>
          </Section>

          {/* 08 — Prioritization */}
          <Section
            id="prioritization"
            index="08"
            tone="decision"
            kicker="Prioritization"
            title="Nine candidates against six dimensions"
            lede="Scores are my judgement, not measurements — the value of the matrix is that it forces the same six questions on every candidate, including the ones I wanted to build."
          >
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
            </div>

            <div className="space-y-3">
              {CANDIDATES.map((c) => (
                <div
                  key={c.name}
                  className={clsx(
                    'flex flex-col gap-1.5 rounded-xl border p-4 sm:flex-row sm:items-start sm:gap-5',
                    c.verdict === 'build'
                      ? 'border-pink/35 bg-pink-lo/50'
                      : 'border-hairline bg-panel',
                  )}
                >
                  <div className="flex w-full shrink-0 items-center justify-between gap-3 sm:w-[210px] sm:justify-start">
                    <span className="font-display text-[13.5px] font-semibold text-hi">
                      {c.name}
                    </span>
                    <span className="sm:hidden">
                      <Verdict kind={c.verdict} />
                    </span>
                  </div>
                  <p className="min-w-0 flex-1 text-[13.5px] leading-relaxed text-mid">{c.why}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* 09 — Hypothesis */}
          <Section
            id="hypothesis"
            index="09"
            tone="decision"
            kicker="The hypothesis"
            title="An intelligent commitment layer, not an AI estimate"
          >
            <div className="rounded-xl border border-pink/40 bg-pink-lo/70 p-7">
              <div className="eyebrow text-pink">Product hypothesis</div>
              <p className="mt-3 font-display text-[21px] font-semibold leading-[1.35] text-hi">
                If Toggl turns its time intelligence into a proactive estimate, and then translates
                that estimate into a realistic schedule, an individual contributor can make better
                commitments with less cognitive effort.
              </p>
            </div>

            <Compare
              left={{
                caption: 'What this is not',
                title: 'A standalone AI estimation feature',
                body: 'An estimate on its own is a number in a box. It is impressive once and useful rarely, and it leaves every hard part — the calendar, the deadline, the other client — with the user.',
              }}
              right={{
                caption: 'What this is',
                title: 'A commitment and planning layer on top of Toggl’s time data',
                body: 'The estimate is the entry point. The value is that it becomes a plan, and the plan stays honest while the week happens to it.',
              }}
            />
          </Section>

          {/* 10 — Estimate ≠ commitment */}
          <Section
            id="commitment"
            index="10"
            tone="decision"
            kicker="Estimate ≠ commitment"
            title="Ten hours is not an answer"
            lede="Knowing that a task will take ten hours does not tell me whether I can do it. It tells me the size of a thing I still have to fit somewhere."
          >
            <Grid cols={2}>
              <Panel eyebrow="What an estimate says">
                <p className="font-display text-[16px] text-hi">
                  “This task will take about 10 hours.”
                </p>
                <p className="mt-3 text-[13.5px] leading-relaxed text-lo">
                  Useful. Not yet actionable.
                </p>
              </Panel>
              <Panel tone="decision" eyebrow="What a commitment says" filled>
                <p className="font-display text-[16px] text-hi">
                  “About 10 hours — and you have 12 free before Wednesday 17:00, so it fits.”
                </p>
                <p className="mt-3 text-[13.5px] leading-relaxed text-mid">
                  Now it is a decision the user can actually make.
                </p>
              </Panel>
            </Grid>

            <Equation
              terms={['Estimate', 'Capacity', 'Existing commitments', 'Deadline']}
              result="Realistic commitment"
              note="This is why scheduling is not the secondary half of the concept. It is the action layer that makes the intelligence worth having — and, usefully for a first-week constraint, it needs no personal history at all."
            />
          </Section>

          {/* 11 — Workflow */}
          <Section
            id="workflow"
            index="11"
            tone="strategy"
            kicker="Proposed workflow"
            title="The whole loop, and the part the prototype builds"
          >
            <Panel>
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
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-2xs text-lo">
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm border border-pink/45 bg-pink-lo" />
                  Built in the prototype
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm border border-hairline-2 bg-panel" />
                  Closed by Toggl as it already is — tracking, planned vs actual, reporting
                </span>
              </div>
            </Panel>

            <Prose>
              The prototype concentrates on the four steps where nothing exists today: intelligent
              intake, the estimate, turning that estimate into a schedule, and repairing the
              schedule when the week moves. Everything else is Toggl doing what Toggl already does
              well, which is the point — the concept is a layer, not a replacement.
            </Prose>
          </Section>

          {/* 12 — Retention */}
          <Section
            id="retention"
            index="12"
            tone="strategy"
            kicker="W0 retention loop"
            title="The estimate gets me in. The living plan gives me a reason to come back."
            lede="It is worth being precise about which half of W0 each part of the concept serves, because they are not the same problem."
          >
            <Grid cols={2}>
              <Panel eyebrow="Activation — day one">
                <p className="text-hi">“Toggl immediately helped me understand this task.”</p>
                <p className="mt-3 text-[13.5px] leading-relaxed text-lo">
                  Real, and worth having. But an estimate is a moment. A moment does not retain
                  anyone.
                </p>
              </Panel>
              <Panel tone="strategy" eyebrow="Retention — the rest of the week" filled>
                <p className="text-hi">“My plan stopped being true, and Toggl told me first.”</p>
                <p className="mt-3 text-[13.5px] leading-relaxed text-mid">
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
                  'You could not start when you planned to',
                  'New work arrives on top',
                  'Something the task quietly waits on slips',
                ]}
              />
              <p className="mt-4 text-[13.5px] leading-relaxed text-lo">
                Deliberately not a dependency-management system. Dependencies exist in the work, but
                Toggl does not need a new model of them to be useful here. Every trigger above is
                something it can already observe: its own tracked time, the connected calendar, and
                edits to the task. “Falling behind” is only one of six, and deliberately not the
                first — a concept that only ever speaks up to tell you that you are late will get
                muted in a week.
              </p>
            </Panel>
          </Section>

          {/* 13 — Learning */}
          <Section
            id="learning"
            index="13"
            tone="strategy"
            kicker="Learning loop"
            title="Every finished task is the next estimate’s evidence"
          >
            <Panel>
              <Flow
                steps={[
                  { label: 'Estimate', built: true },
                  { label: 'Actual' },
                  { label: 'Variance' },
                  { label: 'Learn', built: true },
                  { label: 'Better next estimate', built: true },
                ]}
              />
            </Panel>

            <Grid cols={2}>
              <Panel eyebrow="Cold start, answered honestly">
                <p>
                  A new user has no history, so the first estimate does not pretend to. It leans on
                  the client’s existing project data and the task’s own scope, and says so — a wide
                  range at low confidence rather than a confident single number.
                </p>
                <p className="mt-3 text-[13.5px] text-lo">
                  In the prototype: 7–15h on day one, tightening to 8–12h by day five, with the
                  sources of each version on screen.
                </p>
              </Panel>
              <Panel tone="strategy" eyebrow="Why history has to expire" filled>
                <p>
                  How long work takes is not a constant. Component work on a project can get
                  materially faster the month an AI coding assistant enters the workflow, and a
                  model averaging a flat year of history would still be quoting the old pace.
                </p>
                <p className="mt-3 text-[13.5px] text-mid">
                  So the baseline has to be recent, contextual and adaptive — weighted toward recent
                  work on purpose, not treated as permanent truth.
                </p>
              </Panel>
            </Grid>
          </Section>

          {/* 14 — Copilot */}
          <Section
            id="copilot"
            index="14"
            tone="analysis"
            kicker="Why not Copilot"
            title="Copilot answers questions. This changes the workflow."
            lede="Toggl already has an AI Copilot, and it can already answer a question about an estimate. So the concept has to justify itself against the thing that exists."
          >
            <Compare
              left={{
                caption: 'Today',
                title: 'The user carries the workflow',
                body: (
                  <>
                    <p>The user has to know the question exists, and then ask it:</p>
                    <p className="mt-2.5 font-display text-[14.5px] text-hi">
                      “How long do you think this will take?”
                    </p>
                    <p className="mt-2.5">
                      The AI answers. The calendar, the deadline and the decision are still entirely
                      theirs.
                    </p>
                  </>
                ),
              }}
              right={{
                caption: 'Proposed',
                title: 'The workflow carries the user',
                body: (
                  <ol className="space-y-1.5">
                    {[
                      'A task arrives',
                      'Toggl estimates it, unprompted',
                      'It checks the week for capacity',
                      'It proposes a schedule that fits',
                      'It keeps watching whether the plan is still true',
                      'It replans when it is not',
                    ].map((s, i) => (
                      <li key={s} className="flex gap-2.5">
                        <span className="tnum mt-px font-display text-[12px] font-bold text-pink">
                          {i + 1}
                        </span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ol>
                ),
              }}
            />

            <Assertion>
              The opportunity was never to make the AI answer more questions. It was to stop
              requiring the question.
            </Assertion>
          </Section>

          {/* 15 — Metrics */}
          <Section
            id="metrics"
            index="15"
            kicker="Success metrics"
            title="What would tell me this is working"
            lede="Split by what they actually prove — activation is not retention, and neither is quality."
          >
            <Grid cols={3}>
              <Panel tone="decision" eyebrow="Activation" filled>
                <Bullets
                  tone="decision"
                  items={[
                    'Share of eligible users who engage with an intelligent estimate',
                    'Share who accept or edit it rather than ignore it',
                    'Share who turn an estimate into a schedule',
                  ]}
                />
              </Panel>
              <Panel tone="strategy" eyebrow="W0 retention" filled>
                <Bullets
                  tone="strategy"
                  items={[
                    'Share who return to review or adjust a plan',
                    'Share who use intelligent planning more than once in week one',
                    'Response rate on a suggested replanning action',
                  ]}
                />
              </Panel>
              <Panel tone="analysis" eyebrow="Quality" filled>
                <Bullets
                  tone="analysis"
                  items={[
                    'Estimate versus actual variance',
                    'Recommendation acceptance rate',
                    'Manual override rate',
                    'Change in estimate accuracy over time',
                  ]}
                />
              </Panel>
            </Grid>

            <Prose>
              None of these establish causation on their own. Movement in the retention numbers
              alongside a flat override rate would be encouraging; movement in acceptance with
              variance getting worse would mean users are trusting something that has not earned it.
              The pairs matter more than any single figure.
            </Prose>
          </Section>

          {/* 16 — Risks */}
          <Section
            id="risks"
            index="16"
            kicker="Risks & assumptions"
            title="What would make this fail"
          >
            <Grid cols={2}>
              {[
                [
                  'Trust',
                  'An estimate the user did not make is an estimate they have no reason to believe. Mitigated in the prototype by showing the estimate as an auditable sum of factors, each one disagreeable with individually.',
                ],
                [
                  'False precision',
                  'A confident single number on day one would be a lie. Hence a range and an explicit confidence level, widest exactly when the system knows least.',
                ],
                [
                  'Cold start',
                  'The estimate leans on project and workspace data before it has personal data. If a user’s first project has no comparable work at all, the estimate is weak — the capacity check still is not.',
                ],
                [
                  'Stale history',
                  'Work patterns shift. A baseline that averages everything will quote a pace that no longer exists.',
                ],
                [
                  'Users prefer their own numbers',
                  'Many will, and should be able to. The plan has to be worth having even when the estimate is overridden.',
                ],
                [
                  'Intervention fatigue',
                  'A system that raises every wobble becomes noise, then gets muted. The threshold for “this plan is no longer realistic” is the hardest unsolved part of the concept.',
                ],
                [
                  'Detecting real change',
                  'Distinguishing a meaningful divergence from an ordinary bad morning is a modelling problem I have assumed rather than solved.',
                ],
                [
                  'Scope of the prototype',
                  'Frontend only, mocked data, a deterministic estimator rather than a model. It validates the interaction and the argument, not the accuracy.',
                ],
              ].map(([k, v]) => (
                <Panel key={k} title={k}>
                  {v}
                </Panel>
              ))}
            </Grid>
          </Section>

          {/* 17 — Thesis */}
          <Section id="thesis" index="17" kicker="Thesis" title="The bet, in four lines">
            <div className="rounded-xl border border-hairline bg-panel p-7">
              <p className="font-display text-[19px] leading-[1.5] text-mid">
                Toggl has spent years building a trusted record of what happened to our time.
              </p>
              <p className="mt-4 font-display text-[19px] leading-[1.5] text-mid">
                Toggl 2.0 is about turning that record into better decisions.
              </p>
              <p className="mt-4 font-display text-[19px] leading-[1.5] text-mid">
                For an individual contributor, one of the most important decisions is:{' '}
                <span className="font-semibold text-hi">“Can I realistically commit to this?”</span>
              </p>
              <p className="mt-4 font-display text-[19px] font-semibold leading-[1.5] text-hi">
                The concept makes Toggl answer that question proactively — and keep the answer
                honest as the work changes.
              </p>
            </div>

            <Panel tone="decision" eyebrow="Why this one" filled>
              <p className="font-display text-[15.5px] leading-relaxed text-hi">
                I did not choose this because it was the most requested feature. It was not
                requested at all.
              </p>
              <p className="mt-3">
                I chose it because it is the only candidate sitting at the intersection of all four
                constraints the brief actually imposes: a real IC need, value inside week zero,
                Toggl’s stated strategic direction, and the data advantage nobody else in the
                category has.
              </p>
            </Panel>

            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                to="/tasks"
                className="inline-flex h-10 items-center gap-2 rounded-pill bg-pink px-5 font-display text-[13.5px] font-semibold text-white transition-colors hover:bg-pink-hi"
              >
                See it working
                <ArrowUpRight size={15} />
              </Link>
            </div>
          </Section>

          {/* 18 — Sources */}
          <Section id="sources" index="18" kicker="Sources" title="What this is built on">
            <div className="divide-y divide-hairline rounded-xl border border-hairline bg-panel">
              {(
                [
                  [
                    'strategy',
                    'Toggl 2.0 announcement',
                    'Toggl’s own statement of direction. Source of every quoted phrase in section 05.',
                    'https://community.toggl.com/t/introducing-toggl-2-0/4757',
                  ],
                  [
                    'strategy',
                    'Toggl Focus / 2.0 product material',
                    'The freelancer-facing promise that tracking makes future estimates smarter.',
                    '',
                  ],
                  [
                    'evidence',
                    'Toggl Community product feedback, ranked',
                    'The engagement-ranked feedback board. Thread titles quoted in section 04 are taken from it verbatim.',
                    'https://community.toggl.com/c/product-feedback',
                  ],
                  [
                    'evidence',
                    'Capterra & G2 reviews',
                    'Read for context on recurring pain. No figures drawn from them, because I did not sample them systematically.',
                    '',
                  ],
                  [
                    'analysis',
                    'My own walkthrough of Toggl Track / 2.0',
                    'Timer in all four views, Analyze, Reports, Projects, Timeline, Copilot, planning fields, planned vs actual, alerts, tasks and projects.',
                    '',
                  ],
                ] as const
              ).map(([tone, title, note, href]) => (
                <div key={title} className="flex gap-4 p-5">
                  <span className={clsx('mt-2 h-1.5 w-1.5 shrink-0 rounded-full', TONE[tone].dot)} />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="font-display text-[14px] font-semibold text-hi">
                        {title}
                      </span>
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
                    <p className="mt-1 text-[13.5px] leading-relaxed text-mid">{note}</p>
                  </div>
                </div>
              ))}
            </div>

            <Prose className="text-[13.5px] text-lo">
              No statistic, quotation or citation on this page is invented. Where I had an
              impression but not a measurement — the review sites — I have said so rather than
              manufacture a number.
            </Prose>
          </Section>
        </main>
      </div>
    </div>
  )
}
