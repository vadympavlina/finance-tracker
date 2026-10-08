import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import type { Category, CategoryType } from '../../types'
import { Sheet } from '../ui/Sheet'
import { Button } from '../ui/Button'
import { TextField } from '../ui/Field'
import { Segmented } from '../ui/Tabs'
import { CategoryIcon } from '../common/CategoryIcon'
import { CATEGORY_ICON_KEYS, PALETTE, getIcon } from '../common/icons'
import { useFinance } from '../../hooks/useFinance'
import { useToast } from '../../hooks/useUI'
import { cn } from '../../utils/cn'

interface Props {
  open: boolean
  onClose: () => void
  /** Edit mode when provided. */
  category?: Category | null
  defaultType?: CategoryType
  onSaved?: (category: Category) => void
}

export function CategoryFormSheet({ open, onClose, category, defaultType = 'expense', onSaved }: Props) {
  const { data, addCategory, updateCategory } = useFinance()
  const toast = useToast()
  const [name, setName] = useState('')
  const [type, setType] = useState<CategoryType>(defaultType)
  const [icon, setIcon] = useState('shopping-cart')
  const [color, setColor] = useState(PALETTE[0])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setName(category?.name ?? '')
    setType(category?.type ?? defaultType)
    setIcon(category?.icon ?? (defaultType === 'income' ? 'coins' : 'shopping-cart'))
    setColor(category?.color ?? PALETTE[(data.categories.length * 3) % PALETTE.length])
    setError(null)
  }, [open, category, defaultType, data.categories.length])

  const submit = () => {
    const trimmed = name.trim()
    if (!trimmed) return setError('Введи назву категорії')
    if (trimmed.length > 32) return setError('Назва задовга — максимум 32 символи')
    const duplicate = data.categories.some(
      (c) => c.id !== category?.id && !c.isArchived && c.type === type && c.name.toLowerCase() === trimmed.toLowerCase(),
    )
    if (duplicate) return setError('Категорія з такою назвою вже існує')
    if (category) {
      updateCategory(category.id, { name: trimmed, icon, color })
      toast('Категорію оновлено')
      onSaved?.({ ...category, name: trimmed, icon, color })
    } else {
      const created = addCategory({ name: trimmed, icon, color, type })
      toast('Категорію створено')
      onSaved?.(created)
    }
    onClose()
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={category ? 'Редагувати категорію' : 'Нова категорія'}
      footer={
        <Button block size="lg" onClick={submit}>
          {category ? 'Зберегти зміни' : 'Створити категорію'}
        </Button>
      }
    >
      <form
        className="space-y-5 pt-1"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <div className="flex items-center gap-3 rounded-2xl bg-surface-2 p-3">
          <CategoryIcon icon={icon} color={color} size="lg" />
          <div className="min-w-0">
            <p className="min-w-0 break-words font-semibold">{name.trim() || 'Назва категорії'}</p>
            <p className="text-sm text-muted">{type === 'expense' ? 'Витрати' : 'Доходи'}</p>
          </div>
        </div>

        {!category && (
          <Segmented
            label="Тип категорії"
            value={type}
            onChange={setType}
            options={[
              { value: 'expense', label: 'Витрата' },
              { value: 'income', label: 'Дохід' },
            ]}
          />
        )}

        <TextField
          label="Назва"
          value={name}
          maxLength={32}
          placeholder="Наприклад, Подорожі"
          data-autofocus
          error={error}
          onChange={(e) => {
            setName(e.target.value)
            setError(null)
          }}
        />

        <fieldset className="min-w-0">
          <legend className="mb-2 text-sm font-medium text-muted">Колір</legend>
          <div role="radiogroup" aria-label="Колір" className="flex flex-wrap gap-2.5">
            {PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={c === color}
                aria-label={`Колір ${c}`}
                onClick={() => setColor(c)}
                className="press grid size-11 place-items-center rounded-full ring-offset-2 ring-offset-surface"
                style={{ backgroundColor: c, boxShadow: c === color ? `0 0 0 2px var(--surface), 0 0 0 4px ${c}` : undefined }}
              >
                {c === color && <Check className="size-5 text-white" strokeWidth={3} aria-hidden />}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="min-w-0">
          <legend className="mb-2 text-sm font-medium text-muted">Іконка</legend>
          <div role="radiogroup" aria-label="Іконка" className="grid grid-cols-6 gap-2 sm:grid-cols-8">
            {CATEGORY_ICON_KEYS.map((key) => {
              const Icon = getIcon(key)
              const selected = key === icon
              return (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  aria-label={key}
                  onClick={() => setIcon(key)}
                  className={cn(
                    'press grid aspect-square min-h-11 place-items-center rounded-2xl border',
                    selected ? 'border-primary bg-primary-soft' : 'border-transparent bg-surface-2 text-muted hover:text-text',
                  )}
                  style={selected ? { color } : undefined}
                >
                  <Icon className="size-5" aria-hidden />
                </button>
              )
            })}
          </div>
        </fieldset>
        <button type="submit" hidden />
      </form>
    </Sheet>
  )
}
