import { useEffect, useState } from 'react'
import type { Budget, BudgetPeriod } from '../../types'
import { Sheet } from '../ui/Sheet'
import { Button } from '../ui/Button'
import { Segmented } from '../ui/Tabs'
import { SelectField, TextField } from '../ui/Field'
import { AmountInput } from '../common/AmountInput'
import { useFinance } from '../../hooks/useFinance'
import { useConfirm, useToast } from '../../hooks/useUI'
import { amountToInput, parseAmount } from '../../utils/format'
import { endOfMonth, fromDateTimeInputs, parseDate, startOfMonth, toDateInput, toLocalISO } from '../../utils/date'

interface Props {
  open: boolean
  onClose: () => void
  budget?: Budget | null
}

type Scope = 'total' | 'category'

export function BudgetFormSheet({ open, onClose, budget }: Props) {
  const { data, addBudget, updateBudget, deleteBudget } = useFinance()
  const toast = useToast()
  const confirm = useConfirm()
  const [scope, setScope] = useState<Scope>('category')
  const [categoryId, setCategoryId] = useState('')
  const [amount, setAmount] = useState('')
  const [period, setPeriod] = useState<BudgetPeriod>('month')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})

  const expenseCategories = data.categories.filter((c) => c.type === 'expense' && !c.isArchived)
  const hasTotal = data.budgets.some((b) => b.categoryId === null && b.period === 'month' && b.id !== budget?.id)

  useEffect(() => {
    if (!open) return
    const now = new Date()
    setScope(budget ? (budget.categoryId ? 'category' : 'total') : hasTotal ? 'category' : 'total')
    setCategoryId(budget?.categoryId ?? '')
    setAmount(budget ? amountToInput(budget.amount) : '')
    setPeriod(budget?.period ?? 'month')
    setStart(toDateInput(budget?.period === 'custom' ? parseDate(budget.startDate) : startOfMonth(now)))
    setEnd(toDateInput(budget?.endDate ? parseDate(budget.endDate) : endOfMonth(now)))
    setErrors({})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, budget])

  const submit = () => {
    const value = parseAmount(amount)
    const e: Record<string, string> = {}
    if (!amount || Number.isNaN(value)) e.amount = 'Введи суму'
    else if (value <= 0) e.amount = 'Сума повинна бути більшою за 0'
    if (scope === 'category' && !categoryId) e.category = 'Обери категорію'
    if (period === 'custom' && (!start || !end)) e.range = 'Вкажи дати періоду'
    else if (period === 'custom' && start > end) e.range = 'Дата початку пізніше за дату завершення'
    if (period === 'month') {
      const duplicate = data.budgets.find(
        (b) => b.id !== budget?.id && b.period === 'month' && b.categoryId === (scope === 'total' ? null : categoryId),
      )
      if (duplicate) e.category = scope === 'total' ? 'Загальний місячний бюджет уже існує' : 'Для цієї категорії вже є місячний бюджет'
    }
    setErrors(e)
    if (Object.keys(e).length) return

    const payload = {
      categoryId: scope === 'total' ? null : categoryId,
      amount: value,
      period,
      startDate: period === 'custom' ? fromDateTimeInputs(start, '00:00') : toLocalISO(startOfMonth(new Date())),
      endDate: period === 'custom' ? fromDateTimeInputs(end, '23:59') : null,
    }
    if (budget) {
      updateBudget(budget.id, payload)
      toast('Бюджет оновлено')
    } else {
      addBudget(payload)
      toast('Бюджет створено')
    }
    onClose()
  }

  const remove = async () => {
    if (!budget) return
    const ok = await confirm({ title: 'Видалити бюджет?', message: 'Операції залишаться без змін.', confirmLabel: 'Видалити', danger: true })
    if (!ok) return
    deleteBudget(budget.id)
    toast('Бюджет видалено')
    onClose()
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={budget ? 'Редагувати бюджет' : 'Новий бюджет'}
      footer={
        <div className="flex gap-3">
          {budget && (
            <Button variant="danger-soft"  onClick={remove}>
              Видалити
            </Button>
          )}
          <Button block size="lg" onClick={submit}>
            {budget ? 'Зберегти' : 'Створити бюджет'}
          </Button>
        </div>
      }
    >
      <form
        noValidate
        className="space-y-5 pt-1"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <Segmented<Scope>
          label="Тип бюджету"
          value={scope}
          onChange={(v) => {
            setScope(v)
            setErrors({})
          }}
          options={[
            { value: 'total', label: 'Загальний' },
            { value: 'category', label: 'Категорія' },
          ]}
        />
        <AmountInput value={amount} onChange={setAmount} label="Ліміт" error={errors.amount} size="md" />
        {scope === 'category' ? (
          <SelectField
            label="Категорія"
            value={categoryId}
            error={errors.category}
            onChange={(e) => setCategoryId(e.target.value)}
            options={[{ value: '', label: 'Обери категорію' }, ...expenseCategories.map((c) => ({ value: c.id, label: c.name }))]}
          />
        ) : (
          errors.category && (
            <p role="alert" className="text-sm font-medium text-expense">
              {errors.category}
            </p>
          )
        )}
        <div className="space-y-3">
          <Segmented<BudgetPeriod>
            label="Період"
            size="sm"
            value={period}
            onChange={setPeriod}
            options={[
              { value: 'month', label: 'Щомісяця' },
              { value: 'custom', label: 'Свій період' },
            ]}
          />
          {period === 'custom' ? (
            <div className="grid grid-cols-2 gap-2">
              <TextField label="Початок" type="date" value={start} onChange={(e) => setStart(e.target.value)} error={errors.range} />
              <TextField label="Кінець" type="date" value={end} min={start} onChange={(e) => setEnd(e.target.value)} />
            </div>
          ) : (
            <p className="text-sm text-muted">Бюджет автоматично оновлюється на початку кожного місяця.</p>
          )}
        </div>
        <button type="submit" hidden />
      </form>
    </Sheet>
  )
}
