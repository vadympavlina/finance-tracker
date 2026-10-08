import type { LucideIcon } from 'lucide-react'
import { cn } from '../../utils/cn'

interface Props {
  icon: LucideIcon
  label: string
  /** Optional second line. */
  hint?: string
  onClick: () => void
  danger?: boolean
}

/** Large, full-width action in a menu sheet. The label wraps instead of being cut. */
export function ActionRow({ icon: Icon, label, hint, onClick, danger }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'press flex min-h-12 w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-[0.9375rem] leading-snug font-medium hover:bg-surface-2',
        danger && 'text-expense',
      )}
    >
      <Icon className={cn('size-5 shrink-0', hint && 'self-start mt-0.5')} aria-hidden />
      <span className="min-w-0 break-words">
        {label}
        {hint && <span className="mt-0.5 block text-[0.8125rem] font-normal text-muted">{hint}</span>}
      </span>
    </button>
  )
}
