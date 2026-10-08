import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { formatMoney } from '../../utils/format'
import { TrendBadge } from '../common/TrendBadge'
import { cn } from '../../utils/cn'

interface StatCardProps {
  label: string
  value: number
  icon: LucideIcon
  tone: 'income' | 'expense' | 'debt' | 'neutral'
  change?: number | null
  inverse?: boolean
  to?: string
  hint?: string
}

const tones = {
  income: 'bg-income-soft text-income',
  expense: 'bg-expense-soft text-expense',
  debt: 'bg-primary-soft text-primary',
  neutral: 'bg-info-soft text-info',
}

export function StatCard({ label, value, icon: Icon, tone, change, inverse, to, hint }: StatCardProps) {
  const content = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className={cn('grid size-9 place-items-center rounded-full', tones[tone])}>
          <Icon className="size-[18px]" aria-hidden strokeWidth={2.2} />
        </span>
        {change !== undefined && <TrendBadge value={change} inverse={inverse} className="hidden sm:inline-flex" />}
      </div>
      <p className="mt-3 text-[13px] font-medium text-muted">{label}</p>
      <p className="tabular mt-0.5 truncate text-[17px] font-bold tracking-tight sm:text-xl">{formatMoney(value)}</p>
      {hint && <p className="mt-0.5 truncate text-xs text-subtle">{hint}</p>}
    </>
  )
  const className = 'block min-w-0 rounded-3xl border border-border bg-surface p-3.5 shadow-card sm:p-4'
  return to ? (
    <Link to={to} className={cn(className, 'press hover:border-border-strong hover:shadow-float')}>
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  )
}
