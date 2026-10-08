import { Plus } from 'lucide-react'
import type { Category } from '../../types'
import { CategoryIcon } from './CategoryIcon'
import { cn } from '../../utils/cn'

interface CategorySelectorProps {
  categories: Category[]
  value: string | null
  onChange: (id: string) => void
  onCreate?: () => void
  error?: string | null
  label?: string
}

/** Grid of categories — radio group semantics, large touch targets. */
export function CategorySelector({ categories, value, onChange, onCreate, error, label = 'Категорія' }: CategorySelectorProps) {
  return (
    <fieldset className="min-w-0">
      <legend className="mb-2.5 text-sm font-medium text-muted">{label}</legend>
      <div role="radiogroup" aria-label={label} aria-invalid={!!error} className="grid grid-cols-4 gap-2 sm:grid-cols-5">
        {categories.map((c) => {
          const selected = c.id === value
          return (
            <button
              key={c.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(c.id)}
              className={cn(
                'press flex min-h-[88px] flex-col items-center justify-center gap-1.5 rounded-2xl border px-1 py-2.5 text-center',
                selected ? 'border-primary bg-primary-soft ring-1 ring-primary' : 'border-transparent bg-surface-2 hover:border-border-strong',
              )}
            >
              <CategoryIcon icon={c.icon} color={c.color} size="sm" />
              <span className={cn('max-w-full text-xs leading-tight font-medium break-words hyphens-auto', selected ? 'text-primary' : 'text-text')}>{c.name}</span>
            </button>
          )
        })}
        {onCreate && (
          <button
            type="button"
            onClick={onCreate}
            className="press flex min-h-[88px] flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed border-border-strong px-1 py-2.5 text-muted hover:text-primary"
          >
            <span className="grid size-9 place-items-center rounded-full bg-surface-2">
              <Plus className="size-[18px]" aria-hidden />
            </span>
            <span className="text-xs font-medium">Нова</span>
          </button>
        )}
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm font-medium text-expense">
          {error}
        </p>
      )}
    </fieldset>
  )
}
