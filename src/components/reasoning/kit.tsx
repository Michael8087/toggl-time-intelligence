import clsx from 'clsx'
import { ArrowRight, ArrowUp, Quote as QuoteIcon } from 'lucide-react'
import type { ReactNode } from 'react'

/**
 * The reasoning page runs on the same tokens as the product, but it is not the
 * product — it is the argument behind it. So it gets its own small kit, and one
 * consistent colour code for the four kinds of input a decision is made from:
 *
 *   evidence  — what users said        (blue)
 *   strategy  — what Toggl said        (pink)
 *   analysis  — what I found myself    (lilac)
 *   decision  — what I concluded       (gold)
 *
 * Every block on the page carries one of these, so the reader can always tell
 * whose claim they are reading.
 */
export type Tone = 'evidence' | 'strategy' | 'analysis' | 'decision' | 'neutral'

export const TONE: Record<Tone, { text: string; border: string; bg: string; dot: string }> = {
  evidence: {
    text: 'text-e-blue',
    border: 'border-e-blue/35',
    bg: 'bg-e-blue/[0.07]',
    dot: 'bg-e-blue',
  },
  strategy: { text: 'text-pink', border: 'border-pink/35', bg: 'bg-pink-lo/70', dot: 'bg-pink' },
  analysis: {
    text: 'text-e-lilac',
    border: 'border-e-lilac/35',
    bg: 'bg-e-lilac/[0.07]',
    dot: 'bg-e-lilac',
  },
  decision: { text: 'text-warn', border: 'border-warn/35', bg: 'bg-warn-lo/60', dot: 'bg-warn' },
  neutral: { text: 'text-mid', border: 'border-hairline', bg: 'bg-panel-2', dot: 'bg-lo' },
}

/* ------------------------------------------------------------------ Layout */

export function Section({
  id,
  index,
  tone = 'neutral',
  kicker,
  title,
  lede,
  children,
}: {
  id: string
  index: string
  tone?: Tone
  kicker: string
  title: string
  lede?: ReactNode
  children: ReactNode
}) {
  const t = TONE[tone]
  return (
    <section id={id} className="scroll-mt-24 border-t border-hairline py-8 first:border-t-0">
      <div className="flex items-center gap-3">
        <span className={clsx('h-1.5 w-1.5 rounded-full', t.dot)} />
        <span className={clsx('eyebrow', t.text)}>{kicker}</span>
        <span className="tnum ml-auto font-display text-2xs font-semibold text-dim">{index}</span>
      </div>
      <h2 className="mt-2.5 max-w-3xl font-display text-[22px] font-bold leading-[1.22] text-hi sm:text-[26px]">
        {title}
      </h2>
      {lede && <p className="mt-2.5 max-w-2xl text-[14.5px] leading-relaxed text-mid">{lede}</p>}
      <div className="mt-5 space-y-3.5">{children}</div>
    </section>
  )
}

export function Prose({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={clsx('max-w-2xl text-[15px] leading-relaxed text-mid', className)}>{children}</p>
  )
}

export function Grid({
  cols = 2,
  children,
  className,
}: {
  cols?: 2 | 3 | 4
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={clsx(
        'grid gap-4',
        cols === 2 && 'sm:grid-cols-2',
        cols === 3 && 'sm:grid-cols-2 lg:grid-cols-3',
        cols === 4 && 'sm:grid-cols-2 lg:grid-cols-4',
        className,
      )}
    >
      {children}
    </div>
  )
}

/* ------------------------------------------------------------------- Cards */

export function Panel({
  tone = 'neutral',
  title,
  eyebrow,
  children,
  className,
  filled = false,
}: {
  tone?: Tone
  title?: ReactNode
  eyebrow?: string
  children: ReactNode
  className?: string
  filled?: boolean
}) {
  const t = TONE[tone]
  return (
    <div
      className={clsx(
        'rounded-xl border p-[18px]',
        filled ? clsx(t.border, t.bg) : 'border-hairline bg-panel',
        className,
      )}
    >
      {eyebrow && <div className={clsx('eyebrow mb-2', t.text)}>{eyebrow}</div>}
      {title && (
        <h3 className="font-display text-[15.5px] font-semibold leading-snug text-hi">{title}</h3>
      )}
      <div className={clsx('text-[14px] leading-relaxed text-mid', title || eyebrow ? 'mt-2' : '')}>
        {children}
      </div>
    </div>
  )
}

/** A list of short claims with a leading rule — the page's workhorse. */
export function Bullets({
  items,
  tone = 'neutral',
  className,
}: {
  items: ReactNode[]
  tone?: Tone
  className?: string
}) {
  const t = TONE[tone]
  return (
    <ul className={clsx('space-y-2', className)}>
      {items.map((item, i) => (
        <li key={i} className="flex gap-3 text-[14px] leading-relaxed text-mid">
          <span className={clsx('mt-[9px] h-px w-3 shrink-0', t.dot)} />
          <span className="min-w-0">{item}</span>
        </li>
      ))}
    </ul>
  )
}

/* ------------------------------------------------------------------ Quotes */

/** Toggl's own words, or anyone else's — always attributed. */
export function Quote({
  children,
  source,
  href,
  tone = 'strategy',
}: {
  children: ReactNode
  source: string
  href?: string
  tone?: Tone
}) {
  const t = TONE[tone]
  return (
    <figure className={clsx('rounded-xl border p-5', t.border, t.bg)}>
      <QuoteIcon size={15} className={clsx('mb-2.5', t.text)} />
      <blockquote className="font-display text-[17px] font-medium leading-relaxed text-hi">
        {children}
      </blockquote>
      <figcaption className={clsx('mt-3 font-display text-2xs font-semibold', t.text)}>
        {href ? (
          <a href={href} target="_blank" rel="noreferrer" className="underline-offset-2 hover:underline">
            {source} ↗
          </a>
        ) : (
          source
        )}
      </figcaption>
    </figure>
  )
}

/** My own claim, set apart so it is never mistaken for Toggl's. */
export function Assertion({ children, label = 'My reading' }: { children: ReactNode; label?: string }) {
  return (
    <div className="flex gap-4 rounded-xl border-l-2 border-hi/70 bg-panel-2/60 py-4 pl-5 pr-5">
      <div className="min-w-0">
        <div className="eyebrow text-lo">{label}</div>
        <p className="mt-1.5 font-display text-[16px] font-medium leading-relaxed text-hi">
          {children}
        </p>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------- Flows */

export interface FlowStep {
  label: string
  /** Steps the prototype actually builds, versus steps Toggl already ships. */
  built?: boolean
}

export function Flow({ steps, className }: { steps: FlowStep[]; className?: string }) {
  return (
    <div className={clsx('flex flex-wrap items-center gap-x-1.5 gap-y-2', className)}>
      {steps.map((s, i) => (
        <div key={s.label} className="flex items-center gap-1.5">
          <span
            className={clsx(
              'inline-flex items-center rounded-pill border px-3 py-1.5 font-display text-[12.5px] font-semibold',
              s.built
                ? 'border-pink/45 bg-pink-lo text-pink-hi'
                : 'border-hairline-2 bg-panel text-mid',
            )}
          >
            {s.label}
          </span>
          {i < steps.length - 1 && <ArrowRight size={13} className="shrink-0 text-dim" />}
        </div>
      ))}
    </div>
  )
}

/** A + B + C = D, laid out so the equals sign carries the argument. */
export function Equation({
  terms,
  result,
  note,
}: {
  terms: string[]
  result: string
  note?: string
}) {
  return (
    <div className="rounded-xl border border-hairline bg-panel p-5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        {terms.map((term, i) => (
          <div key={term} className="flex items-center gap-3">
            <span className="rounded-lg bg-panel-2 px-3 py-1.5 font-display text-[13px] font-semibold text-hi">
              {term}
            </span>
            {i < terms.length - 1 && <span className="font-display text-[15px] text-dim">+</span>}
          </div>
        ))}
        <span className="font-display text-[15px] text-dim">=</span>
        <span className="rounded-lg bg-pink-lo px-3 py-1.5 font-display text-[13px] font-bold text-pink-hi">
          {result}
        </span>
      </div>
      {note && <p className="mt-3.5 text-[13.5px] leading-relaxed text-lo">{note}</p>}
    </div>
  )
}

/** The recurring loop: a chain that visibly returns to its own start. */
export function Loop({ steps, caption }: { steps: FlowStep[]; caption: string }) {
  return (
    <div className="rounded-xl border border-hairline bg-panel p-5">
      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-2">
        {steps.map((s, i) => (
          <div key={s.label} className="flex items-center gap-1.5">
            <span
              className={clsx(
                'inline-flex items-center rounded-pill border px-3 py-1.5 font-display text-[12.5px] font-semibold',
                s.built
                  ? 'border-pink/45 bg-pink-lo text-pink-hi'
                  : 'border-hairline-2 bg-panel text-mid',
              )}
            >
              {s.label}
            </span>
            {i < steps.length - 1 && <ArrowRight size={13} className="shrink-0 text-dim" />}
          </div>
        ))}
      </div>
      {/* The return leg, drawn as a dashed U so the chain visibly closes. */}
      <div className="relative mt-3 h-7">
        <div className="absolute inset-x-2 top-0 h-full rounded-b-xl border-b border-l border-r border-dashed border-pink/45" />
        <ArrowUp
          size={12}
          strokeWidth={2.5}
          className="absolute -top-[7px] left-2 -translate-x-1/2 text-pink"
        />
      </div>
      <p className="mt-2.5 text-center font-display text-[12.5px] font-medium text-pink">
        {caption}
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------ Rating */

export type Level = 'high' | 'med' | 'low'

const LEVEL_FILL: Record<Level, number> = { high: 3, med: 2, low: 1 }
const LEVEL_TONE: Record<Level, string> = {
  high: 'bg-ok',
  med: 'bg-warn',
  low: 'bg-lo/70',
}

export function Rating({ level }: { level: Level }) {
  return (
    <span className="inline-flex items-center gap-[3px]" title={level}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={clsx(
            'h-3.5 w-1.5 rounded-sm',
            i < LEVEL_FILL[level] ? LEVEL_TONE[level] : 'bg-hairline',
          )}
        />
      ))}
    </span>
  )
}

export function Verdict({ kind }: { kind: 'build' | 'later' | 'no' }) {
  const map = {
    build: { label: 'The bet', cls: 'bg-pink text-white' },
    later: { label: 'Later', cls: 'bg-panel-3 text-mid' },
    no: { label: 'Not this bet', cls: 'bg-transparent text-dim border border-hairline-2' },
  }[kind]
  return (
    <span
      className={clsx(
        'inline-flex whitespace-nowrap rounded-pill px-2.5 py-0.5 font-display text-2xs font-bold',
        map.cls,
      )}
    >
      {map.label}
    </span>
  )
}
