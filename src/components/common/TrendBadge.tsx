import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { formatPercent } from '../../utils/format'
import { cn } from '../../utils/cn'

interface TrendBadgeProps {
  value: number | null
  /** When true, growth is bad (e.g. expenses). */
  inverse?: boolean
  className?: string
  onDark?: boolean
}

export function TrendBadge({ value, inverse, className, onDark }: TrendBadgeProps) {
  if (value === null || !Number.isFinite(value)) return null
  const rounded = Math.round(value)
  const up = rounded > 0
  const good = rounded === 0 ? null : inverse ? !up : up
  const Icon = up ? ArrowUpRight : ArrowDownRight
  return (
    <span
      className={cn(
        'tabular inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold',
        onDark
          ? 'bg-white/15 text-white'
          : good === null
            ? 'bg-surface-2 text-muted'
            : good
              ? 'bg-income-soft text-income'
              : 'bg-expense-soft text-expense',
        className,
      )}
      aria-label={`${up ? 'Зростання' : rounded < 0 ? 'Зниження' : 'Без змін'} ${formatPercent(Math.abs(rounded))}`}
    >
      {rounded !== 0 && <Icon className="size-3.5" aria-hidden strokeWidth={2.5} />}
      {formatPercent(rounded, true)}
    </span>
  )
}
