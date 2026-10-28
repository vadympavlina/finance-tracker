import type { CSSProperties } from 'react'
import { TabBar } from 'glisse'
import { cn } from '../../utils/cn'
import { useWidth } from '../../hooks/useWidth'

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

/** Tab bar padding inside Glisse (4px each side). */
const BAR_PADDING = 8

/**
 * iOS 26 segmented control on Glisse's Liquid Glass tab bar: the selection is a glass lens
 * you can drag between options. Keyboard: ←/→, Home, End.
 */
export function Segmented<T extends string>({ options, value, onChange, label, className, size = 'md' }: SegmentedProps<T>) {
  const [ref, width] = useWidth<HTMLDivElement>()
  const tabWidth = width ? Math.max(0, (width - BAR_PADDING) / options.length) : 0
  return (
    <div ref={ref} className={cn('ft-seg', size === 'sm' && 'ft-seg-sm', className)} style={{ visibility: tabWidth ? undefined : 'hidden' }}>
      <TabBar
        aria-label={label}
        value={value}
        onValueChange={(v) => onChange(v as T)}
        style={{ '--lg-tab-width': `${tabWidth}px` } as CSSProperties}
        items={options.map((o) => ({
          value: o.value,
          label: (
            <span className="ft-tab-label">
              {o.label}
              {o.count !== undefined && <span className="ft-tab-count">{o.count}</span>}
            </span>
          ),
        }))}
      />
    </div>
  )
}
