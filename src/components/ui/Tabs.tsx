import { useId, useRef, type KeyboardEvent } from 'react'
import { cn } from '../../utils/cn'

export interface TabOption<T extends string> {
  value: T
  label: string
  count?: number
}

interface SegmentedProps<T extends string> {
  options: TabOption<T>[]
  value: T
  onChange: (value: T) => void
  label: string
  className?: string
  size?: 'sm' | 'md'
}

/** iOS-like segmented control with roving keyboard focus (←/→). */
export function Segmented<T extends string>({ options, value, onChange, label, className, size = 'md' }: SegmentedProps<T>) {
  const id = useId()
  const refs = useRef<Array<HTMLButtonElement | null>>([])
  const onKeyDown = (e: KeyboardEvent, idx: number) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    e.preventDefault()
    const next = (idx + (e.key === 'ArrowRight' ? 1 : -1) + options.length) % options.length
    onChange(options[next].value)
    refs.current[next]?.focus()
  }
  return (
    <div role="tablist" aria-label={label} className={cn('flex rounded-2xl bg-surface-3/70 p-1', className)}>
      {options.map((o, idx) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            ref={(el) => {
              refs.current[idx] = el
            }}
            id={`${id}-${o.value}`}
            role="tab"
            type="button"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onKeyDown={(e) => onKeyDown(e, idx)}
            onClick={() => onChange(o.value)}
            className={cn(
              'press flex flex-1 items-center justify-center gap-1.5 rounded-xl font-medium whitespace-nowrap',
              size === 'md' ? 'min-h-10 px-3 text-sm' : 'min-h-8 px-2.5 text-[13px]',
              active ? 'bg-surface text-text shadow-card' : 'text-muted hover:text-text',
            )}
          >
            {o.label}
            {o.count !== undefined && (
              <span className={cn('rounded-full px-1.5 text-[11px] tabular', active ? 'bg-primary-soft text-primary' : 'bg-surface-3 text-muted')}>
                {o.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
