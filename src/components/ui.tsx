import clsx from 'clsx'
import { ChevronDown, Info } from 'lucide-react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

/* ------------------------------------------------------------------ Button */

type Variant = 'primary' | 'secondary' | 'ghost' | 'quiet'
type Size = 'sm' | 'md' | 'lg'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-pink text-white hover:bg-pink-hi disabled:bg-pink/30',
  secondary: 'bg-panel-3 text-hi hover:bg-hairline-2',
  ghost: 'border border-hairline-2 text-hi hover:border-lo hover:bg-panel',
  quiet: 'text-mid hover:bg-panel hover:text-hi',
}

const SIZES: Record<Size, string> = {
  sm: 'h-7 px-2.5 text-[12px]',
  md: 'h-9 px-4 text-[13px]',
  lg: 'h-11 px-5 text-[14px]',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-pill font-display font-semibold',
        'transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}

/** The outlined pill from the Track toolbar. Visual only — no menu behind it. */
export function ToolbarPill({
  children,
  active,
  caret,
  className,
  onClick,
}: {
  children: ReactNode
  active?: boolean
  caret?: boolean
  className?: string
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'toolbar-pill',
        active && 'border-pink/60 bg-pink-lo text-hi',
        className,
      )}
    >
      {children}
      {caret && <ChevronDown size={13} className="-mr-0.5 opacity-70" />}
    </button>
  )
}

/* -------------------------------------------------------------------- Chip */

export function Chip({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode
  tone?: 'neutral' | 'pink' | 'ok' | 'warn' | 'bad'
  className?: string
}) {
  const tones = {
    neutral: 'bg-panel-3 text-mid',
    pink: 'bg-pink-lo text-pink-hi',
    ok: 'bg-ok-lo text-ok',
    warn: 'bg-warn-lo text-warn',
    bad: 'bg-bad-lo text-bad',
  }
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-pill px-2 py-0.5',
        'font-display text-2xs font-semibold',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

/* ----------------------------------------------------------------- Tooltip -
 * The floating card Toggl uses on calendar hovers, with its little caret.    */

export function TooltipCard({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={clsx(
        'relative rounded-xl border border-hairline bg-panel px-4 py-3 shadow-pop',
        className,
      )}
    >
      <span className="absolute -top-[5px] left-1/2 block h-2 w-2 -translate-x-1/2 rotate-45 border-l border-t border-hairline bg-panel" />
      {children}
    </div>
  )
}

/** One `icon · label · value` line inside a tooltip. */
export function TooltipRow({
  icon: Icon,
  label,
  value,
  tone = 'mid',
}: {
  icon: typeof Info
  label: string
  value: ReactNode
  tone?: 'pink' | 'mid'
}) {
  const c = tone === 'pink' ? 'text-pink' : 'text-mid'
  return (
    <div className="flex items-center gap-2.5">
      <Icon size={15} className={clsx('shrink-0', c)} />
      <span className={clsx('font-display text-[14px]', c)}>{label}</span>
      <span
        className={clsx(
          'tnum ml-auto pl-6 font-display text-[14px] font-semibold',
          tone === 'pink' ? 'text-pink' : 'text-hi',
        )}
      >
        {value}
      </span>
    </div>
  )
}

/* -------------------------------------------------------------------- Card */

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={clsx('card', className)}>{children}</section>
}

export function CardHeader({
  title,
  action,
  className,
}: {
  title: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={clsx('flex items-center justify-between gap-4 px-5 py-4', className)}>
      <h3 className="font-display text-[15px] font-semibold text-hi">{title}</h3>
      {action}
    </div>
  )
}

/* -------------------------------------------------------------- Stat strip -
 * The five-across metric row from the project dashboard.                    */

export interface StatItem {
  label: string
  value: ReactNode
  tone?: 'default' | 'ok' | 'warn' | 'bad' | 'pink'
  sub?: ReactNode
}

export function StatStrip({ items, className }: { items: StatItem[]; className?: string }) {
  const tones = {
    default: 'text-hi',
    ok: 'text-ok',
    warn: 'text-warn',
    bad: 'text-bad',
    pink: 'text-pink-hi',
  }
  return (
    <div
      className={clsx(
        'grid divide-y divide-hairline rounded-xl border border-hairline bg-panel',
        'sm:grid-flow-col sm:auto-cols-fr sm:divide-x sm:divide-y-0',
        className,
      )}
    >
      {items.map((s) => (
        <div key={s.label} className="px-6 py-5">
          <div className="font-display text-[13px] font-medium text-mid">{s.label}</div>
          <div
            className={clsx(
              'tnum mt-1.5 font-display text-[26px] font-bold leading-none',
              tones[s.tone ?? 'default'],
            )}
          >
            {s.value}
          </div>
          {s.sub && <div className="mt-1.5 text-2xs leading-snug text-lo">{s.sub}</div>}
        </div>
      ))}
    </div>
  )
}

/* ---------------------------------------------------------------- Progress */

export function Progress({
  value,
  max,
  tone = 'pink',
  className,
}: {
  value: number
  max: number
  tone?: 'pink' | 'ok'
  className?: string
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <div className={clsx('h-2 w-full overflow-hidden rounded-pill bg-panel-3', className)}>
      <div
        className={clsx(
          'h-full rounded-pill transition-[width] duration-500',
          tone === 'pink' ? 'bg-pink' : 'bg-ok',
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

/* ------------------------------------------------------------ Step hint --
 * The demo's own wayfinding. The flow crosses two surfaces — the task panel
 * and the calendar — and nothing in the product itself would tell a first-time
 * viewer to make that jump, so the prototype says it out loud.               */

export function StepHint({
  step,
  badge,
  children,
  action,
  className,
}: {
  step: number
  /** An extra chip, e.g. the "Day 1" framing on the first step. */
  badge?: string
  children: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      className={clsx(
        'flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-pink/30 bg-pink-lo px-4 py-3',
        className,
      )}
    >
      {badge && (
        <span className="inline-flex items-center rounded-pill bg-pink px-2 py-0.5 font-display text-2xs font-bold text-white">
          {badge}
        </span>
      )}
      <span className="inline-flex items-center rounded-pill border border-pink/40 px-2 py-0.5 font-display text-2xs font-bold text-pink">
        Step {step}
      </span>
      <span className="min-w-[12rem] flex-1 text-[13px] leading-relaxed text-hi">{children}</span>
      {action}
    </div>
  )
}

/* -------------------------------------------------------------------- Misc */

export function Placeholder({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-dashed border-hairline-2 px-6 py-16 text-center">
      <h3 className="font-display text-[15px] font-semibold text-hi">{title}</h3>
      <p className="mx-auto mt-1.5 max-w-sm text-[13px] leading-relaxed text-mid">{body}</p>
    </div>
  )
}

export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: string; label: string; enabled?: boolean }[]
  active: string
  onChange: (id: string) => void
}) {
  return (
    <div className="flex items-center gap-1 border-b border-hairline px-5">
      {tabs.map((t) => {
        const on = t.id === active
        const enabled = t.enabled !== false
        return (
          <button
            key={t.id}
            disabled={!enabled}
            onClick={() => enabled && onChange(t.id)}
            className={clsx(
              'relative px-3.5 py-3 font-display text-[14px] transition-colors',
              on ? 'font-semibold text-hi' : enabled ? 'text-mid hover:text-hi' : 'text-dim',
            )}
          >
            {t.label}
            {on && <span className="absolute inset-x-2.5 -bottom-px h-0.5 rounded-t bg-pink" />}
          </button>
        )
      })}
    </div>
  )
}
