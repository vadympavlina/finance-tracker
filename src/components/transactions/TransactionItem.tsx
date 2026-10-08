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

/**
 * Row layout that survives long names and big amounts on 320px screens:
 * [icon] title ……… amount
 *        subtitle …… date
 * Title and subtitle wrap (never cut), the amount keeps one line.
 */
export function TransactionItem({ tx, view, onClick, meta = 'date' }: TransactionItemProps) {
  const amountText = view.tone === 'neutral' ? formatMoney(view.signed) : formatSignedMoney(view.signed)
  const when = meta === 'time' ? formatTime(tx.date) : formatRelativeDay(tx.date)
  return (
    <button
      type="button"
      onClick={onClick}
      className="press flex w-full items-start gap-3 rounded-2xl px-2 py-2.5 text-left hover:bg-surface-2"
      aria-label={`${view.title}, ${view.subtitle}, ${amountText}, ${when}`}
    >
      <CategoryIcon icon={view.icon} color={view.color} muted={view.isArchivedCategory} />
      <span className="min-w-0 flex-1 pt-0.5">
        <span className="flex items-start justify-between gap-x-3">
          <span className="min-w-0 text-[0.9375rem] leading-snug font-semibold break-words">{view.title}</span>
          <span
            className={cn(
              'tabular shrink-0 text-[0.9375rem] leading-snug font-semibold whitespace-nowrap',
              view.tone === 'income' && 'text-income',
              view.tone === 'expense' && 'text-text',
              view.tone === 'neutral' && 'text-info',
            )}
          >
            {amountText}
          </span>
        </span>
        <span className="mt-0.5 flex items-start justify-between gap-x-3">
          <span className="min-w-0 text-[0.8438rem] leading-snug text-muted break-words">{view.subtitle}</span>
          <span className="shrink-0 text-xs leading-snug whitespace-nowrap text-subtle">{when}</span>
        </span>
      </span>
    </button>
  )
}
