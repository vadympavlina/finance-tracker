import { Check, Info, X } from 'lucide-react'
import { cn } from '../../utils/cn'

export type ToastKind = 'success' | 'error' | 'info'
export interface ToastItem {
  id: number
  message: string
  kind: ToastKind
}

export function ToastViewport({ toasts, onDismiss }: { toasts: ToastItem[]; onDismiss: (id: number) => void }) {
  return (
    <div
      aria-live="polite"
      role="status"
      className="pointer-events-none fixed inset-x-0 top-[max(12px,env(safe-area-inset-top))] z-[60] flex flex-col items-center gap-2 px-4 lg:top-6"
    >
      {toasts.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onDismiss(t.id)}
          className="animate-pop pointer-events-auto flex max-w-sm items-center gap-2.5 rounded-2xl bg-[#121a17] py-3 pr-4 pl-3 text-left text-sm font-medium text-white shadow-float dark:bg-surface-3"
        >
          <span
            className={cn(
              'grid size-6 shrink-0 place-items-center rounded-full',
              t.kind === 'success' && 'bg-income text-white',
              t.kind === 'error' && 'bg-expense text-white',
              t.kind === 'info' && 'bg-primary text-white',
            )}
            aria-hidden
          >
            {t.kind === 'success' ? <Check className="size-3.5" strokeWidth={3} /> : t.kind === 'error' ? <X className="size-3.5" strokeWidth={3} /> : <Info className="size-3.5" />}
          </span>
          {t.message}
        </button>
      ))}
    </div>
  )
}
