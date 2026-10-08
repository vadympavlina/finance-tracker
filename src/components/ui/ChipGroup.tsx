import { cn } from '../../utils/cn'

interface ChipGroupProps<T extends string> {
  label: string
  value: T
  onChange: (value: T) => void
  options: Array<{ value: T; label: string; color?: string }>
}

/** Single-choice chips that wrap onto new lines — long names are never cut. */
export function ChipGroup<T extends string>({ label, value, onChange, options }: ChipGroupProps<T>) {
  return (
    <fieldset className="min-w-0">
      <legend className="mb-2 text-sm font-medium text-muted">{label}</legend>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
        {options.map((o) => {
          const selected = o.value === value
          return (
            <button
              key={o.value || 'all'}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(o.value)}
              className={cn(
                'press inline-flex min-h-10 max-w-full items-center gap-2 rounded-full px-3.5 py-2 text-left text-sm leading-tight font-medium break-words',
                selected ? 'bg-ink text-on-ink' : 'bg-surface-2 text-text hover:bg-surface-3',
              )}
            >
              {o.color && <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: o.color }} aria-hidden />}
              <span className="min-w-0">{o.label}</span>
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}
