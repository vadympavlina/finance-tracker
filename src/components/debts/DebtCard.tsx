import type { Debt, DebtStatus } from '../../types'
import { calculateDebtProgress, calculateDebtRemaining, calculateDebtStatus } from '../../services/calculations'
import { ProgressBar } from '../ui/ProgressBar'
import { formatMoney } from '../../utils/format'
import { formatFullDate } from '../../utils/date'
import { cn } from '../../utils/cn'

export const DEBT_STATUS: Record<DebtStatus, { label: string; className: string; dot: string }> = {
  paid: { label: 'Погашено', className: 'bg-income-soft text-income', dot: 'bg-income' },
  pending: { label: 'Очікує', className: 'bg-warning-soft text-warning', dot: 'bg-warning' },
  overdue: { label: 'Прострочено', className: 'bg-expense-soft text-expense', dot: 'bg-expense' },
  active: { label: 'Активний', className: 'bg-primary-soft text-primary', dot: 'bg-primary' },
}

export function DebtStatusBadge({ status }: { status: DebtStatus }) {
  const s = DEBT_STATUS[status]
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold', s.className)}>
      <span className={cn('size-1.5 rounded-full', s.dot)} aria-hidden />
      {s.label}
    </span>
  )
}

export function DebtCard({ debt, onClick }: { debt: Debt; onClick: () => void }) {
  const status = calculateDebtStatus(debt)
  const remaining = calculateDebtRemaining(debt)
  const progress = calculateDebtProgress(debt)
  const theyOwe = debt.direction === 'they_owe_me'
  return (
    <button
      type="button"
      onClick={onClick}
      className="press w-full rounded-[26px] bg-surface shadow-card p-4 text-left shadow-card hover:border-border-strong"
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            'grid size-11 shrink-0 place-items-center rounded-full text-[0.9375rem] font-bold',
            theyOwe ? 'bg-income-soft text-income' : 'bg-expense-soft text-expense',
          )}
          aria-hidden
        >
          {debt.person.trim().charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="min-w-0 break-words text-[0.9375rem] font-semibold">{debt.person}</p>
            <p className={cn('tabular shrink-0 text-[1.0625rem] font-bold', status === 'paid' ? 'text-subtle line-through decoration-1' : theyOwe ? 'text-income' : 'text-expense')}>
              {formatMoney(status === 'paid' ? debt.amount : remaining)}
            </p>
          </div>
          <p className="mt-0.5 text-sm text-muted">
            {theyOwe ? 'Мені винні' : 'Я винен'} · {debt.dueDate ? `До ${formatFullDate(debt.dueDate)}` : 'Без дати'}
          </p>
          <div className="mt-3 flex items-center gap-3">
            <ProgressBar value={progress} color={theyOwe ? 'var(--income)' : 'var(--primary)'} size="sm" label={`Повернуто ${Math.round(progress)}%`} />
            <DebtStatusBadge status={status} />
          </div>
          {debt.repaidAmount > 0 && status !== 'paid' && (
            <p className="tabular mt-2 text-xs text-subtle">
              Повернуто {formatMoney(debt.repaidAmount)} з {formatMoney(debt.amount)}
            </p>
          )}
        </div>
      </div>
    </button>
  )
}
