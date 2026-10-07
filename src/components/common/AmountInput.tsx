import { forwardRef, useId } from 'react'
import { currencySymbol, sanitizeAmountInput } from '../../utils/format'
import { cn } from '../../utils/cn'

interface AmountInputProps {
  value: string
  onChange: (value: string) => void
  label?: string
  error?: string | null
  tone?: 'expense' | 'income' | 'neutral'
  autoFocus?: boolean
  size?: 'lg' | 'md'
}

/**
 * Large amount field. inputMode="decimal" opens the numeric keyboard on phones;
 * accepts both "," and "." as decimal separator and keeps max 2 decimals.
 */
export const AmountInput = forwardRef<HTMLInputElement, AmountInputProps>(function AmountInput(
  { value, onChange, label = 'Сума', error, tone = 'neutral', autoFocus, size = 'lg' },
  ref,
) {
  const id = useId()
  const display = value.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return (
    <div className="text-center">
      <label htmlFor={id} className="text-sm font-medium text-muted">
        {label}
      </label>
      <div
        className={cn(
          'mt-1 flex items-baseline justify-center gap-2 rounded-3xl px-3 transition-colors',
          size === 'lg' ? 'py-2' : 'py-1',
          error && 'bg-expense-soft/60',
        )}
      >
        <input
          ref={ref}
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          enterKeyHint="done"
          placeholder="0"
          autoFocus={autoFocus}
          data-autofocus={autoFocus ? true : undefined}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-err` : undefined}
          value={display}
          onChange={(e) => onChange(sanitizeAmountInput(e.target.value))}
          className={cn(
            'tabular min-w-0 bg-transparent text-right font-bold tracking-tight outline-none placeholder:text-subtle',
            size === 'lg' ? 'text-[44px] leading-tight' : 'text-[32px] leading-tight',
            tone === 'expense' && 'text-text',
            tone === 'income' && 'text-income',
          )}
          style={{ width: `${Math.max(1, display.length) + 0.6}ch` }}
        />
        <span className={cn('font-semibold text-subtle', size === 'lg' ? 'text-[32px]' : 'text-2xl')} aria-hidden>
          {currencySymbol()}
        </span>
      </div>
      {error && (
        <p id={`${id}-err`} role="alert" className="mt-1 text-sm font-medium text-expense">
          {error}
        </p>
      )}
    </div>
  )
})
