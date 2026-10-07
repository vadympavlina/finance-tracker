import type { BudgetProgress } from '../../services/calculations'
import type { Category } from '../../types'
import { CategoryIcon } from '../common/CategoryIcon'
import { ProgressBar } from '../ui/ProgressBar'
import { formatMoney, formatNumber, formatPercent } from '../../utils/format'
import { formatDayMonth } from '../../utils/date'
import { cn } from '../../utils/cn'

interface Props {
  progress: BudgetProgress
  category: Category | null
  onClick?: () => void
}

export function BudgetCard({ progress, category, onClick }: Props) {
  const { budget, spent, percent, status, remaining, range } = progress
  const name = category ? category.name : 'Загальний бюджет'
  const statusText =
    status === 'exceeded' ? 'Перевищено бюджет' : status === 'warning' ? `Залишилось ${formatMoney(remaining)}` : `Залишилось ${formatMoney(remaining)}`
  return (
    <button
      type="button"
      onClick={onClick}
      className="press w-full rounded-[20px] border border-border bg-surface p-4 text-left shadow-card hover:border-border-strong"
      aria-label={`${name}: витрачено ${formatMoney(spent)} з ${formatMoney(budget.amount)}, ${formatPercent(percent)}`}
    >
      <div className="flex items-center gap-3">
        <CategoryIcon icon={category?.icon ?? 'wallet'} color={category?.color ?? '#7C5CFC'} size="sm" muted={category?.isArchived} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold">{name}</p>
          <p className="tabular text-sm text-muted">
            {formatNumber(spent)} / {formatMoney(budget.amount)}
          </p>
        </div>
        <span
          className={cn(
            'tabular text-[15px] font-bold',
            status === 'exceeded' ? 'text-expense' : status === 'warning' ? 'text-warning' : 'text-text',
          )}
        >
          {formatPercent(percent)}
        </span>
      </div>
      <ProgressBar value={percent} status={status} color={category?.color} className="mt-3" label={`${name}: ${formatPercent(percent)}`} />
      <div className="mt-2 flex items-center justify-between gap-2 text-xs">
        <span className={cn('font-medium', status === 'exceeded' ? 'text-expense' : status === 'warning' ? 'text-warning' : 'text-muted')}>
          {statusText}
        </span>
        <span className="text-subtle">
          {budget.period === 'custom' ? `${formatDayMonth(range.start)} – ${formatDayMonth(range.end)}` : 'Щомісяця'}
        </span>
      </div>
    </button>
  )
}
