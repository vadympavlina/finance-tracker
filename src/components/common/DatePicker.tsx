import { useId } from 'react'
import { addDays, isSameDay, toDateInput } from '../../utils/date'
import { controlClassName } from '../ui/Field'
import { cn } from '../../utils/cn'

interface DatePickerProps {
  date: string // YYYY-MM-DD
  onDateChange: (value: string) => void
  time?: string // HH:mm
  onTimeChange?: (value: string) => void
  label?: string
  quickPicks?: boolean
  max?: string
  min?: string
  error?: string | null
}

/** Native date (+ optional time) inputs with "Сьогодні / Вчора" shortcuts. */
export function DatePicker({ date, onDateChange, time, onTimeChange, label = 'Дата', quickPicks = true, max, min, error }: DatePickerProps) {
  const id = useId()
  const today = new Date()
  const picks = [
    { label: 'Сьогодні', value: toDateInput(today) },
    { label: 'Вчора', value: toDateInput(addDays(today, -1)) },
  ]
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium text-muted">
          {label}
        </label>
        {quickPicks && (
          <div className="flex gap-1.5">
            {picks.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => onDateChange(p.value)}
                aria-pressed={date === p.value}
                className={cn(
                  'press h-8 rounded-full px-3 text-xs font-medium',
                  date === p.value ? 'bg-primary-soft text-primary' : 'bg-surface-2 text-muted hover:text-text',
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className={cn('grid gap-2', onTimeChange ? 'grid-cols-[minmax(0,1fr)_auto]' : 'grid-cols-1')}>
        <input
          id={id}
          type="date"
          value={date}
          max={max}
          min={min}
          required
          aria-invalid={!!error}
          onChange={(e) => e.target.value && onDateChange(e.target.value)}
          className={cn(controlClassName, 'h-12 min-w-0')}
        />
        {onTimeChange && (
          <input
            type="time"
            aria-label="Час"
            value={time}
            onChange={(e) => e.target.value && onTimeChange(e.target.value)}
            className={cn(controlClassName, 'h-12 w-[6.75rem] min-w-0 px-3')}
          />
        )}
      </div>
      {error && (
        <p role="alert" className="text-sm font-medium text-expense">
          {error}
        </p>
      )}
    </div>
  )
}

export const isToday = (value: string) => isSameDay(new Date(`${value}T00:00:00`), new Date())
