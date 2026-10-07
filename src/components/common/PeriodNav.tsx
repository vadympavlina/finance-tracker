import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../../utils/cn'

interface PeriodNavProps {
  label: string
  onPrev: () => void
  onNext: () => void
  canNext: boolean
  className?: string
}

export function PeriodNav({ label, onPrev, onNext, canNext, className }: PeriodNavProps) {
  return (
    <div className={cn('flex items-center justify-between gap-2 rounded-2xl border border-border bg-surface p-1 shadow-card', className)}>
      <button type="button" onClick={onPrev} aria-label="Попередній період" className="press grid size-10 place-items-center rounded-xl text-muted hover:bg-surface-2 hover:text-text">
        <ChevronLeft className="size-5" aria-hidden />
      </button>
      <span className="text-sm font-semibold" aria-live="polite">
        {label}
      </span>
      <button
        type="button"
        onClick={onNext}
        disabled={!canNext}
        aria-label="Наступний період"
        className="press grid size-10 place-items-center rounded-xl text-muted hover:bg-surface-2 hover:text-text disabled:opacity-30"
      >
        <ChevronRight className="size-5" aria-hidden />
      </button>
    </div>
  )
}
