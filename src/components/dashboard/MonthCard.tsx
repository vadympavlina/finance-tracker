import { Link } from 'react-router-dom'
import { ChevronRight, HandCoins } from 'lucide-react'
import type { MonthSummary } from '../../services/calculations'
import { FitText } from '../ui/FitText'
import { ProgressBar } from '../ui/ProgressBar'
import { formatMoney, formatPercent, formatSignedMoney } from '../../utils/format'
import { formatMonthName } from '../../utils/date'
import { cn } from '../../utils/cn'

interface Props {
  summary: MonthSummary
  debtTotal: number
  overdueCount: number
}

/** "Жовтень": було → отримано → витрачено → залишилось, with a link to the full month screen. */
export function MonthCard({ summary, debtTotal, overdueCount }: Props) {
  const cells = [
    { label: 'Було на початку', value: formatMoney(summary.opening), cls: '' },
    { label: 'Отримано', value: formatSignedMoney(summary.received), cls: 'text-income' },
    { label: 'Витрачено', value: formatSignedMoney(-summary.expenses), cls: 'text-expense' },
    { label: 'Залишилось', value: formatMoney(summary.closing), cls: 'font-bold' },
  ]
  const overspent = summary.received > 0 && summary.expenses > summary.received
  return (
    <section aria-label={`Місяць: ${formatMonthName(summary.range.start)}`} className="@container overflow-hidden rounded-[26px] bg-surface shadow-card">
      <Link to="/month" className="press flex items-center justify-between gap-3 px-4 pt-3.5 pb-2 hover:bg-surface-2">
        <h2 className="text-[1.0625rem] font-bold">{formatMonthName(summary.range.start)}</h2>
        <span className="inline-flex items-center gap-0.5 text-sm font-medium text-primary">
          Детальніше <ChevronRight className="size-4" aria-hidden />
        </span>
      </Link>
      <dl className="grid grid-cols-1 gap-x-4 px-4 @[300px]:grid-cols-2">
        {cells.map((c) => (
          <div key={c.label} className="flex min-w-0 items-baseline justify-between gap-3 border-t border-border py-2.5 @[300px]:block">
            <dt className="text-[0.8125rem] text-muted">{c.label}</dt>
            <dd className="min-w-0">
              <FitText className={cn('tabular text-right text-[1.0625rem] font-semibold @[300px]:text-left', c.cls)}>{c.value}</FitText>
            </dd>
          </div>
        ))}
      </dl>
      {summary.received > 0 && (
        <div className="px-4 pb-3.5">
          <ProgressBar value={summary.spentShare ?? 0} status={overspent ? 'exceeded' : 'ok'} label="Витрачено від отриманого" />
          <p className={cn('mt-1.5 text-[0.8125rem] leading-snug', overspent ? 'text-expense' : 'text-muted')}>
            {overspent ? `Витрачено більше, ніж отримано, на ${formatMoney(summary.expenses - summary.received)}` : `Витрачено ${formatPercent(summary.spentShare ?? 0)} від отриманого`}
          </p>
        </div>
      )}
      {debtTotal > 0 && (
        <Link to="/debts" className="press flex items-center gap-3 border-t border-border px-4 py-3 hover:bg-surface-2">
          <HandCoins className="size-[18px] shrink-0 text-warning" aria-hidden />
          <span className="min-w-0 flex-1 text-[0.875rem] leading-snug">
            Борги <b className="tabular font-semibold">{formatMoney(debtTotal)}</b>
            {overdueCount > 0 && <span className="text-warning"> · {overdueCount} прострочено</span>}
          </span>
          <ChevronRight className="size-4 shrink-0 text-subtle" aria-hidden />
        </Link>
      )}
    </section>
  )
}
