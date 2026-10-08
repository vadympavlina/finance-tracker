import { useState } from 'react'
import { Minus, Pencil, Plus, Trash2 } from 'lucide-react'
import type { Goal } from '../../types'
import { Sheet } from '../ui/Sheet'
import { Button } from '../ui/Button'
import { ProgressBar } from '../ui/ProgressBar'
import { TextField } from '../ui/Field'
import { Segmented } from '../ui/Tabs'
import { CategoryIcon } from '../common/CategoryIcon'
import { AmountInput } from '../common/AmountInput'
import { useFinance } from '../../hooks/useFinance'
import { useConfirm, useToast } from '../../hooks/useUI'
import { calculateGoalProgress } from '../../services/calculations'
import { formatMoney, formatPercent, formatSignedMoney, parseAmount, pluralUk } from '../../utils/format'
import { formatFullDate, nowISO, parseDate } from '../../utils/date'

interface Props {
  goal: Goal | null
  onClose: () => void
  onEdit: (goal: Goal) => void
}

type Mode = 'add' | 'withdraw'

export function GoalDetailsSheet({ goal, onClose, onEdit }: Props) {
  const { addGoalContribution, deleteGoalContribution, deleteGoal } = useFinance()
  const confirm = useConfirm()
  const toast = useToast()
  const [mode, setMode] = useState<Mode>('add')
  const [amount, setAmount] = useState('')
  const [comment, setComment] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [lastGoalId, setLastGoalId] = useState<string | null>(null)

  if ((goal?.id ?? null) !== lastGoalId) {
    setLastGoalId(goal?.id ?? null)
    setAmount('')
    setComment('')
    setError(null)
    setMode('add')
  }

  if (!goal) return null
  const p = calculateGoalProgress(goal)

  const submit = () => {
    const value = parseAmount(amount)
    if (!amount || Number.isNaN(value)) return setError('Введи суму')
    if (value <= 0) return setError('Сума повинна бути більшою за 0')
    if (mode === 'withdraw' && value > goal.currentAmount) return setError(`Можна зняти максимум ${formatMoney(goal.currentAmount)}`)
    addGoalContribution(goal.id, { amount: mode === 'add' ? value : -value, date: nowISO(), comment: comment.trim() || undefined })
    const reached = mode === 'add' && goal.currentAmount < goal.targetAmount && goal.currentAmount + value >= goal.targetAmount
    toast(reached ? `Ціль «${goal.name}» досягнуто!` : mode === 'add' ? 'Накопичення додано' : 'Суму знято з цілі')
    setAmount('')
    setComment('')
    setError(null)
  }

  const remove = async () => {
    const ok = await confirm({ title: `Видалити ціль «${goal.name}»?`, message: 'Історію накопичень буде видалено. Баланс не зміниться.', confirmLabel: 'Видалити', danger: true })
    if (!ok) return
    deleteGoal(goal.id)
    toast('Ціль видалено')
    onClose()
  }

  const history = [...goal.contributions].sort((a, b) => parseDate(b.date).getTime() - parseDate(a.date).getTime())

  return (
    <Sheet open onClose={onClose} title={goal.name} description={goal.comment}>
      <div className="space-y-5">
        <div className="rounded-2xl bg-surface-2 p-4">
          <div className="flex items-center gap-3">
            <CategoryIcon icon={goal.icon} color={goal.color} size="lg" />
            <div className="min-w-0">
              <p className="tabular text-[26px] leading-tight font-bold tracking-tight">{formatMoney(p.current)}</p>
              <p className="tabular text-sm text-muted">з {formatMoney(goal.targetAmount)}</p>
            </div>
            <span className="tabular ml-auto text-xl font-bold" style={{ color: goal.color }}>
              {formatPercent(p.percent)}
            </span>
          </div>
          <ProgressBar value={p.percent} color={goal.color} size="lg" className="mt-4" label={`Прогрес: ${formatPercent(p.percent)}`} />
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-muted">Залишок</dt>
              <dd className="tabular font-semibold">{formatMoney(p.remaining)}</dd>
            </div>
            <div>
              <dt className="text-muted">Дедлайн</dt>
              <dd className="font-semibold">
                {goal.deadline ? formatFullDate(goal.deadline) : 'Без дати'}
                {p.daysLeft !== null && p.daysLeft >= 0 && !p.isCompleted && (
                  <span className="block text-xs font-normal text-muted">
                    ще {p.daysLeft} {pluralUk(p.daysLeft, ['день', 'дні', 'днів'])}
                  </span>
                )}
              </dd>
            </div>
            {p.monthlyNeeded !== null && (
              <div className="col-span-2 rounded-xl bg-surface px-3 py-2">
                <dt className="text-xs text-muted">Щоб встигнути, відкладай</dt>
                <dd className="tabular font-semibold">{formatMoney(p.monthlyNeeded)} / міс</dd>
              </div>
            )}
          </dl>
        </div>

        <form
          noValidate
          className="space-y-3 rounded-2xl border border-border p-4"
          onSubmit={(e) => {
            e.preventDefault()
            submit()
          }}
        >
          <Segmented<Mode>
            label="Дія"
            size="sm"
            value={mode}
            onChange={(m) => {
              setMode(m)
              setError(null)
            }}
            options={[
              { value: 'add', label: 'Додати' },
              { value: 'withdraw', label: 'Зняти' },
            ]}
          />
          <AmountInput value={amount} onChange={(v) => { setAmount(v); setError(null) }} error={error} size="md" label={mode === 'add' ? 'Сума накопичення' : 'Сума зняття'} />
          <TextField label="Коментар" optional value={comment} maxLength={100} onChange={(e) => setComment(e.target.value)} />
          <Button type="submit" block icon={mode === 'add' ? <Plus className="size-5" aria-hidden /> : <Minus className="size-5" aria-hidden />}>
            {mode === 'add' ? 'Додати накопичення' : 'Зняти з цілі'}
          </Button>
        </form>

        <section aria-label="Історія накопичень">
          <h3 className="mb-2 text-sm font-semibold text-muted">Історія накопичень</h3>
          {history.length ? (
            <ul className="divide-y divide-border rounded-2xl border border-border">
              {history.map((c) => (
                <li key={c.id} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className={`tabular text-[15px] font-semibold ${c.amount > 0 ? 'text-income' : 'text-expense'}`}>{formatSignedMoney(c.amount)}</p>
                    <p className="truncate text-xs text-muted">
                      {formatFullDate(c.date)}
                      {c.comment ? ` · ${c.comment}` : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label="Видалити запис"
                    onClick={async () => {
                      const ok = await confirm({ title: 'Видалити запис?', message: 'Прогрес цілі буде перераховано.', confirmLabel: 'Видалити', danger: true })
                      if (ok) {
                        deleteGoalContribution(goal.id, c.id)
                        toast('Запис видалено')
                      }
                    }}
                    className="press grid size-10 place-items-center rounded-full text-muted hover:bg-expense-soft hover:text-expense"
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-2xl bg-surface-2 px-4 py-3 text-sm text-muted">Ще немає накопичень. Додай першу суму вище.</p>
          )}
        </section>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="ghost" icon={<Pencil className="size-4" aria-hidden />} onClick={() => onEdit(goal)}>
            Редагувати
          </Button>
          <Button variant="danger-soft" icon={<Trash2 className="size-4" aria-hidden />} onClick={remove}>
            Видалити
          </Button>
        </div>
      </div>
    </Sheet>
  )
}
