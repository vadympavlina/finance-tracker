import { Link } from 'react-router-dom'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { formatMoney, formatPercent } from '../../utils/format'
import { cn } from '../../utils/cn'
import { FitText } from '../ui/FitText'

export interface MonthStat {
  label: string
  value: number
  tone: 'income' | 'expense' | 'debt'
  to: string
  /** % vs the same part of the previous month; null — nothing to compare. */
  change?: number | null
  /** Growth is bad (expenses). */
  inverse?: boolean
  hint?: string
}

const DOT = { income: 'bg-income', expense: 'bg-expense', debt: 'bg-warning' }

/** One card, three columns: Доходи · Витрати · Борги for the current month. */
export function StatStrip({ items, caption }: { items: MonthStat[]; caption: string }) {
  return (
    <section aria-label={caption} className="@container rounded-[26px] bg-surface shadow-card">
      {/* Narrow cards (< 340px): one row per figure. Wider: three columns. */}
      <div className="grid grid-cols-1 divide-y divide-border @[340px]:grid-cols-3 @[340px]:divide-x @[340px]:divide-y-0">
        {items.map((s) => (
          <Link
            key={s.label}
            to={s.to}
            className="press flex min-w-0 items-center justify-between gap-3 px-4 py-3 first:rounded-t-[26px] last:rounded-b-[26px] hover:bg-surface-2 @[340px]:block @[340px]:px-3 @[340px]:py-3.5 @[340px]:first:rounded-l-[26px] @[340px]:first:rounded-tr-none @[340px]:last:rounded-r-[26px] @[340px]:last:rounded-bl-none sm:@[340px]:px-4"
          >
            <span className="flex shrink-0 items-center gap-1.5 text-[12.5px] font-medium text-muted">
              <span className={cn('size-1.5 shrink-0 rounded-full', DOT[s.tone])} aria-hidden />
              {s.label}
            </span>
            <span className="min-w-0 text-right @[340px]:text-left">
              <FitText as="span" className="tabular mt-0 text-[16px] font-semibold tracking-tight @[340px]:mt-1 sm:text-lg">{formatMoney(s.value)}</FitText>
              <Trend change={s.change} inverse={s.inverse} hint={s.hint} />
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}

function Trend({ change, inverse, hint }: { change?: number | null; inverse?: boolean; hint?: string }) {
  if (hint) return <span className="mt-0.5 block text-[11.5px] leading-tight font-medium text-warning">{hint}</span>
  if (change === undefined || change === null || !Number.isFinite(change)) {
    return <span className="mt-0.5 block text-[11.5px] text-subtle" aria-hidden>—</span>
  }
  const rounded = Math.round(change)
  const up = rounded > 0
  const good = rounded === 0 ? null : inverse ? !up : up
  const Icon = up ? ArrowUpRight : ArrowDownRight
  return (
    <span
      className={cn('tabular mt-0.5 inline-flex items-center gap-0.5 text-[11.5px] font-semibold', good === null ? 'text-subtle' : good ? 'text-income' : 'text-expense')}
      aria-label={`${up ? 'більше' : 'менше'} на ${formatPercent(Math.abs(rounded))}, ніж минулого місяця`}
    >
      {rounded !== 0 && <Icon className="size-3" strokeWidth={2.6} aria-hidden />}
      {formatPercent(Math.abs(rounded))}
    </span>
  )
}
