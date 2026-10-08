import type { LucideIcon } from 'lucide-react'
import { cn } from '../../utils/cn'

/** Large, full-width action in a menu sheet. The label wraps instead of being cut. */
export function ActionRow({ icon: Icon, label, onClick, danger }: { icon: LucideIcon; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'press flex min-h-12 w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-[0.9375rem] leading-snug font-medium hover:bg-surface-2',
        danger && 'text-expense',
      )}
    >
      <Icon className="size-5 shrink-0" aria-hidden />
      <span className="min-w-0 break-words">{label}</span>
    </button>
  )
}
