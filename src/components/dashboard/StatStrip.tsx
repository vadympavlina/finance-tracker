import { Link } from 'react-router-dom'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { formatMoney, formatPercent } from '../../utils/format'
import { cn } from '../../utils/cn'

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
    <section aria-label={caption} className="rounded-3xl border border-border bg-surface">
      <div className="grid grid-cols-3 divide-x divide-border">
        {items.map((s) => (
          <Link key={s.label} to={s.to} className="press min-w-0 px-3 py-3.5 first:rounded-l-3xl last:rounded-r-3xl hover:bg-surface-2 sm:px-4">
            <span className="flex items-center gap-1.5 text-[12.5px] font-medium text-muted">
              <span className={cn('size-1.5 shrink-0 rounded-full', DOT[s.tone])} aria-hidden />
              {s.label}
            </span>
            <span className="tabular mt-1 block truncate text-[16px] font-semibold tracking-tight sm:text-lg">{formatMoney(s.value)}</span>
            <Trend change={s.change} inverse={s.inverse} hint={s.hint} />
          </Link>
        ))}
      </div>
    </section>
  )
}

function Trend({ change, inverse, hint }: { change?: number | null; inverse?: boolean; hint?: string }) {
  if (hint) return <span className="mt-0.5 block truncate text-[11.5px] font-medium text-warning">{hint}</span>
  if (change === undefined || change === null || !Number.isFinite(change)) {
    return <span className="mt-0.5 block text-[11.5px] text-subtle">—</span>
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
