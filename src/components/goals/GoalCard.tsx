import { CalendarDays, CheckCircle2 } from 'lucide-react'
import type { GoalProgress } from '../../services/calculations'
import { CategoryIcon } from '../common/CategoryIcon'
import { ProgressBar } from '../ui/ProgressBar'
import { formatMoney, formatNumber, formatPercent, pluralUk } from '../../utils/format'
import { formatFullDate } from '../../utils/date'

interface Props {
  progress: GoalProgress
  onClick?: () => void
  compact?: boolean
}

export function GoalCard({ progress, onClick, compact }: Props) {
  const { goal, current, percent, remaining, isCompleted, daysLeft } = progress
  return (
    <button
      type="button"
      onClick={onClick}
      className="press w-full rounded-[26px] bg-surface shadow-card p-4 text-left shadow-card hover:border-border-strong"
      aria-label={`${goal.name}: ${formatMoney(current)} з ${formatMoney(goal.targetAmount)}, ${formatPercent(percent)}`}
    >
      <div className="flex items-center gap-3">
        <CategoryIcon icon={goal.icon} color={goal.color} size={compact ? 'sm' : 'md'} />
        <div className="min-w-0 flex-1">
          <p className="min-w-0 break-words text-[15px] font-semibold">{goal.name}</p>
          <p className="tabular text-sm text-muted">
            {formatNumber(current)} / {formatMoney(goal.targetAmount)}
          </p>
        </div>
        {isCompleted ? (
          <CheckCircle2 className="size-6 text-income" aria-label="Ціль досягнуто" />
        ) : (
          <span className="tabular text-[15px] font-bold" style={{ color: goal.color }}>
            {formatPercent(percent)}
          </span>
        )}
      </div>
      <ProgressBar value={percent} color={goal.color} className="mt-3" label={`${goal.name}: ${formatPercent(percent)}`} />
      {!compact && (
        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-muted">
          <span>{isCompleted ? 'Ціль досягнуто 🎉' : `Залишилось ${formatMoney(remaining)}`}</span>
          {goal.deadline && (
            <span className={`inline-flex items-center gap-1 ${daysLeft !== null && daysLeft < 0 && !isCompleted ? 'text-expense' : ''}`}>
              <CalendarDays className="size-3.5" aria-hidden />
              {formatFullDate(goal.deadline)}
              {daysLeft !== null && daysLeft >= 0 && !isCompleted && ` · ${daysLeft} ${pluralUk(daysLeft, ['день', 'дні', 'днів'])}`}
            </span>
          )}
        </div>
      )}
    </button>
  )
}
