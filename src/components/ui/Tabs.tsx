import { useId, useRef, type CSSProperties, type KeyboardEvent } from 'react'
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

/**
 * iOS 26 segmented control: a glass capsule with a sliding thumb.
 * Roving keyboard focus with ←/→.
 */
export function Segmented<T extends string>({ options, value, onChange, label, className, size = 'md' }: SegmentedProps<T>) {
  const id = useId()
  const refs = useRef<Array<HTMLButtonElement | null>>([])
  const index = Math.max(0, options.findIndex((o) => o.value === value))
  const onKeyDown = (e: KeyboardEvent, idx: number) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    e.preventDefault()
    const next = (idx + (e.key === 'ArrowRight' ? 1 : -1) + options.length) % options.length
    onChange(options[next].value)
    refs.current[next]?.focus()
  }
  const style = { '--count': options.length, '--index': index } as CSSProperties
  return (
    <div role="tablist" aria-label={label} style={style} className={cn('glass relative grid auto-cols-fr grid-flow-col rounded-full p-1', className)}>
      <span
        aria-hidden
        className="absolute top-1 bottom-1 left-1 rounded-full bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.08),0_4px_14px_-4px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.9)] transition-transform duration-500 ease-[cubic-bezier(0.32,1.3,0.5,1)] dark:bg-white/[0.18] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]"
        style={{ width: 'calc((100% - 0.5rem) / var(--count))', transform: 'translateX(calc(100% * var(--index)))' }}
      />
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
              'relative z-10 flex min-w-0 items-center justify-center gap-1.5 rounded-full font-semibold whitespace-nowrap transition-colors',
              size === 'md' ? 'min-h-10 px-2 text-[14.5px]' : 'min-h-9 px-2 text-[13px]',
              active ? 'text-text' : 'text-muted hover:text-text',
            )}
          >
            <span className="truncate">{o.label}</span>
            {o.count !== undefined && <span className="tabular text-[11px] text-subtle">{o.count}</span>}
          </button>
        )
      })}
    </div>
  )
}
