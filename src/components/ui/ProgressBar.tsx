import { cn } from '../../utils/cn'

interface ProgressBarProps {
  value: number
  color?: string
  status?: 'ok' | 'warning' | 'exceeded'
  size?: 'sm' | 'md' | 'lg'
  label?: string
  className?: string
  trackClassName?: string
}

export function ProgressBar({ value, color, status = 'ok', size = 'md', label, className, trackClassName }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value))
  const fill = status === 'exceeded' ? 'var(--expense)' : status === 'warning' ? 'var(--warning)' : (color ?? 'var(--primary)')
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped)}
      aria-label={label}
      className={cn(
        'w-full overflow-hidden rounded-full bg-surface-3',
        size === 'sm' ? 'h-1.5' : size === 'md' ? 'h-2' : 'h-3',
        trackClassName,
        className,
      )}
    >
      <div
        className="h-full rounded-full transition-[width] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{ width: `${clamped}%`, background: fill }}
      />
    </div>
  )
}
