import type { Account } from '../../types'
import { ACCOUNT_TYPE_COLORS, ACCOUNT_TYPE_ICONS } from '../../data/defaults'
import { getIcon } from './icons'
import { cn } from '../../utils/cn'

interface AccountSelectorProps {
  accounts: Account[]
  value: string
  onChange: (id: string) => void
  label?: string
  disabledId?: string
  error?: string | null
}

/** Horizontal chips for choosing an account. */
export function AccountSelector({ accounts, value, onChange, label = 'Рахунок', disabledId, error }: AccountSelectorProps) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-muted">{label}</legend>
      <div role="radiogroup" aria-label={label} className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 py-0.5">
        {accounts.map((a) => {
          const Icon = getIcon(ACCOUNT_TYPE_ICONS[a.type])
          const selected = a.id === value
          const disabled = a.id === disabledId
          return (
            <button
              key={a.id}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={disabled}
              onClick={() => onChange(a.id)}
              className={cn(
                'press flex h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-medium whitespace-nowrap disabled:opacity-40',
                selected ? 'border-primary bg-primary-soft text-primary' : 'border-border bg-surface text-text hover:border-border-strong',
              )}
            >
              <Icon className="size-4" style={{ color: selected ? undefined : ACCOUNT_TYPE_COLORS[a.type] }} aria-hidden />
              {a.name}
            </button>
          )
        })}
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm font-medium text-expense">
          {error}
        </p>
      )}
    </fieldset>
  )
}
