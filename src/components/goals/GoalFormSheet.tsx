import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import type { Goal } from '../../types'
import { Sheet } from '../ui/Sheet'
import { Button } from '../ui/Button'
import { Switch, TextArea, TextField } from '../ui/Field'
import { CategoryIcon } from '../common/CategoryIcon'
import { PALETTE, getIcon } from '../common/icons'
import { useFinance } from '../../hooks/useFinance'
import { useToast } from '../../hooks/useUI'
import { amountToInput, parseAmount, sanitizeAmountInput } from '../../utils/format'
import { addMonths, fromDateTimeInputs, parseDate, toDateInput } from '../../utils/date'
import { cn } from '../../utils/cn'

const GOAL_ICONS = ['target', 'plane', 'laptop', 'shield', 'home', 'car', 'smartphone', 'graduation-cap', 'gift', 'tree-palm', 'gem', 'piggy-bank']

interface Props {
  open: boolean
  onClose: () => void
  goal?: Goal | null
}

export function GoalFormSheet({ open, onClose, goal }: Props) {
  const { addGoal, updateGoal } = useFinance()
  const toast = useToast()
  const [name, setName] = useState('')
  const [target, setTarget] = useState('')
  const [current, setCurrent] = useState('')
  const [hasDeadline, setHasDeadline] = useState(true)
  const [deadline, setDeadline] = useState('')
  const [comment, setComment] = useState('')
  const [icon, setIcon] = useState('target')
  const [color, setColor] = useState(PALETTE[0])
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})

  useEffect(() => {
    if (!open) return
    setName(goal?.name ?? '')
    setTarget(goal ? amountToInput(goal.targetAmount) : '')
    setCurrent(goal ? amountToInput(goal.initialAmount) : '')
    setHasDeadline(goal ? Boolean(goal.deadline) : true)
    setDeadline(toDateInput(goal?.deadline ? parseDate(goal.deadline) : addMonths(new Date(), 6)))
    setComment(goal?.comment ?? '')
    setIcon(goal?.icon ?? 'target')
    setColor(goal?.color ?? PALETTE[0])
    setErrors({})
  }, [open, goal])

  const submit = () => {
    const t = parseAmount(target)
    const c = current ? parseAmount(current) : 0
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'Введи назву цілі'
    if (!target || Number.isNaN(t)) e.target = 'Введи суму'
    else if (t <= 0) e.target = 'Сума повинна бути більшою за 0'
    if (Number.isNaN(c) || c < 0) e.current = 'Некоректна сума'
    setErrors(e)
    if (Object.keys(e).length) return
    const payload = {
      name: name.trim(),
      targetAmount: t,
      initialAmount: c,
      deadline: hasDeadline && deadline ? fromDateTimeInputs(deadline, '12:00') : null,
      comment: comment.trim() || undefined,
      icon,
      color,
    }
    if (goal) {
      updateGoal(goal.id, payload)
      toast('Ціль оновлено')
    } else {
      addGoal(payload)
      toast('Ціль створено')
    }
    onClose()
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={goal ? 'Редагувати ціль' : 'Нова ціль'}
      footer={
        <Button block size="lg" onClick={submit}>
          {goal ? 'Зберегти' : 'Створити ціль'}
        </Button>
      }
    >
      <form
        noValidate
        className="space-y-4 pt-1"
        onSubmit={(ev) => {
          ev.preventDefault()
          submit()
        }}
      >
        <div className="flex items-center gap-3 rounded-2xl bg-surface-2 p-3">
          <CategoryIcon icon={icon} color={color} size="lg" />
          <p className="min-w-0 break-words font-semibold">{name.trim() || 'Назва цілі'}</p>
        </div>
        <TextField label="Назва" value={name} maxLength={40} placeholder="Наприклад, Відпустка" error={errors.name} data-autofocus onChange={(ev) => setName(ev.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <TextField
            label="Необхідна сума, ₴"
            inputMode="decimal"
            value={target}
            placeholder="50 000"
            error={errors.target}
            onChange={(ev) => setTarget(sanitizeAmountInput(ev.target.value))}
          />
          <TextField
            label={goal ? 'Початкова сума, ₴' : 'Вже є, ₴'}
            inputMode="decimal"
            value={current}
            placeholder="0"
            error={errors.current}
            onChange={(ev) => setCurrent(sanitizeAmountInput(ev.target.value))}
          />
        </div>
        <Switch checked={hasDeadline} onChange={setHasDeadline} label="Дедлайн" description={hasDeadline ? undefined : 'Без конкретної дати'} />
        {hasDeadline && <TextField label="Досягти до" type="date" value={deadline} min={toDateInput(new Date())} onChange={(ev) => setDeadline(ev.target.value)} />}
        <fieldset className="min-w-0">
          <legend className="mb-2 text-sm font-medium text-muted">Іконка</legend>
          <div role="radiogroup" aria-label="Іконка" className="grid grid-cols-6 gap-2">
            {GOAL_ICONS.map((key) => {
              const Icon = getIcon(key)
              return (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={key === icon}
                  aria-label={key}
                  onClick={() => setIcon(key)}
                  className={cn('press grid aspect-square min-h-11 place-items-center rounded-2xl border', key === icon ? 'border-primary bg-primary-soft' : 'border-transparent bg-surface-2 text-muted')}
                  style={key === icon ? { color } : undefined}
                >
                  <Icon className="size-5" aria-hidden />
                </button>
              )
            })}
          </div>
        </fieldset>
        <fieldset className="min-w-0">
          <legend className="mb-2 text-sm font-medium text-muted">Колір</legend>
          <div role="radiogroup" aria-label="Колір" className="flex flex-wrap gap-2.5">
            {PALETTE.slice(0, 12).map((c) => (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={c === color}
                aria-label={`Колір ${c}`}
                onClick={() => setColor(c)}
                className="press grid size-10 place-items-center rounded-full"
                style={{ backgroundColor: c, boxShadow: c === color ? `0 0 0 2px var(--surface), 0 0 0 4px ${c}` : undefined }}
              >
                {c === color && <Check className="size-4 text-white" strokeWidth={3} aria-hidden />}
              </button>
            ))}
          </div>
        </fieldset>
        <TextArea label="Коментар" optional value={comment} maxLength={200} onChange={(ev) => setComment(ev.target.value)} />
        <button type="submit" hidden />
      </form>
    </Sheet>
  )
}
