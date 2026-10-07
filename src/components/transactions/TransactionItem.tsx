import type { Transaction } from '../../types'
import { CategoryIcon } from '../common/CategoryIcon'
import { formatMoney, formatSignedMoney } from '../../utils/format'
import { formatRelativeDay, formatTime } from '../../utils/date'
import { cn } from '../../utils/cn'
import type { TransactionView } from './transactionMeta'

interface TransactionItemProps {
  tx: Transaction
  view: TransactionView
  onClick?: () => void
  /** "date" shows relative day under the amount, "time" shows HH:mm (inside date groups). */
  meta?: 'date' | 'time'
}

export function TransactionItem({ tx, view, onClick, meta = 'date' }: TransactionItemProps) {
  const amountText = view.tone === 'neutral' ? formatMoney(view.signed) : formatSignedMoney(view.signed)
  return (
    <button
      type="button"
      onClick={onClick}
      className="press flex w-full items-center gap-3 rounded-2xl px-2 py-2.5 text-left hover:bg-surface-2"
      aria-label={`${view.title}, ${view.subtitle}, ${amountText}, ${formatRelativeDay(tx.date)}`}
    >
      <CategoryIcon icon={view.icon} color={view.color} muted={view.isArchivedCategory} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-semibold">{view.title}</span>
        <span className="block truncate text-sm text-muted">{view.subtitle}</span>
      </span>
      <span className="shrink-0 text-right">
        <span
          className={cn(
            'tabular block text-[15px] font-semibold whitespace-nowrap',
            view.tone === 'income' && 'text-income',
            view.tone === 'expense' && 'text-text',
            view.tone === 'neutral' && 'text-info',
          )}
        >
          {amountText}
        </span>
        <span className="block text-xs text-subtle">{meta === 'time' ? formatTime(tx.date) : formatRelativeDay(tx.date)}</span>
      </span>
    </button>
  )
}
