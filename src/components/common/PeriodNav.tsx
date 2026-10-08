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
    <div className={cn('glass flex items-center justify-between gap-2 rounded-full p-1', className)}>
      <button type="button" onClick={onPrev} aria-label="Попередній період" className="press grid size-10 place-items-center rounded-full text-text hover:bg-black/5 dark:hover:bg-white/10">
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
        className="press grid size-10 place-items-center rounded-full text-text hover:bg-black/5 disabled:opacity-25 dark:hover:bg-white/10"
      >
        <ChevronRight className="size-5" aria-hidden />
      </button>
    </div>
  )
}
