import { useRef, type KeyboardEvent } from 'react'
import { Check } from 'lucide-react'
import type { AccentColor } from '../../types'
import { ACCENT_OPTIONS } from '../../hooks/useTheme'
import { cn } from '../../utils/cn'

interface Props {
  value: AccentColor
  onChange: (value: AccentColor) => void
}

/** Radio group of colour swatches; arrow keys move between them like a native radio set. */
export function AccentPicker({ value, onChange }: Props) {
  const refs = useRef<Array<HTMLButtonElement | null>>([])
  const current = ACCENT_OPTIONS.find((o) => o.value === value) ?? ACCENT_OPTIONS[0]

  const onKeyDown = (e: KeyboardEvent, index: number) => {
    const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
    if (!step) return
    e.preventDefault()
    const next = (index + step + ACCENT_OPTIONS.length) % ACCENT_OPTIONS.length
    onChange(ACCENT_OPTIONS[next].value)
    refs.current[next]?.focus()
  }

  return (
    <div>
      <p id="accent-label" className="mb-2 text-sm font-medium text-muted">
        Акцентний колір
      </p>
      <div role="radiogroup" aria-labelledby="accent-label" className="grid grid-cols-[repeat(auto-fill,minmax(4.25rem,1fr))] gap-x-1 gap-y-2">
        {ACCENT_OPTIONS.map((o, i) => {
          const selected = o.value === current.value
          return (
            <button
              key={o.value}
              ref={(el) => {
                refs.current[i] = el
              }}
              type="button"
              role="radio"
              aria-checked={selected}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(o.value)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className="press group flex min-w-0 flex-col items-center gap-1.5 rounded-2xl px-1 py-2 outline-offset-2 hover:bg-surface-2"
            >
              <span
                className={cn(
                  'grid size-10 shrink-0 place-items-center rounded-full shadow-[inset_0_1px_0_rgba(255,255,255,0.35),inset_0_-1px_1px_rgba(0,0,0,0.15)] ring-offset-2 ring-offset-surface transition-[box-shadow,transform] duration-200',
                  selected ? 'scale-105 ring-2 ring-primary' : 'group-hover:scale-105',
                )}
                style={{ background: `linear-gradient(180deg, color-mix(in srgb, ${o.swatch} 80%, white), ${o.swatch})` }}
                aria-hidden
              >
                {selected && <Check className="size-5 text-white drop-shadow-sm" strokeWidth={3} />}
              </span>
              <span className={cn('max-w-full text-center text-[0.75rem] leading-tight break-words', selected ? 'font-semibold text-text' : 'text-muted')}>{o.label}</span>
            </button>
          )
        })}
      </div>
      <p className="mt-2 text-[0.8125rem] text-muted" aria-live="polite">
        Кнопки, посилання й виділення будуть у кольорі «{current.label}». Доходи й витрати лишаються зеленими й червоними.
      </p>
    </div>
  )
}
