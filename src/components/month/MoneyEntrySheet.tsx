import { useEffect, useState } from 'react'
import type { AdjustmentDirection } from '../../types'
import { Sheet } from '../ui/Sheet'
import { Button } from '../ui/Button'
import { Segmented } from '../ui/Tabs'
import { ChipGroup } from '../ui/ChipGroup'
import { AutoTextarea } from '../ui/AutoTextarea'
import { AmountInput } from '../common/AmountInput'
import { AccountSelector } from '../common/AccountSelector'
import { DatePicker } from '../common/DatePicker'
import { useActiveAccounts, useDefaultAccountId, useFinance, useSelectableCategories } from '../../hooks/useFinance'
import { useToast } from '../../hooks/useUI'
import { formatMoney, parseAmount } from '../../utils/format'
import { fromDateTimeInputs, toDateInput, toTimeInput } from '../../utils/date'

const ADJUSTMENT = '__adjustment__'

interface Props {
  open: boolean
  onClose: () => void
  /** add = отримала гроші, subtract = відняти з місяця. */
  mode: 'add' | 'subtract'
  /** Pre-select a day inside the viewed month (defaults to now). */
  defaultDate?: Date
}

/**
 * "+ Додати" records money received (an income in a chosen category, or a plain correction);
 * "− Відняти" lowers the month's received sum with a correction that is not counted as spending.
 */
export function MoneyEntrySheet({ open, onClose, mode: initialMode, defaultDate }: Props) {
  const { addTransaction } = useFinance()
  const toast = useToast()
  const accounts = useActiveAccounts()
  const defaultAccountId = useDefaultAccountId()
  const incomeCategories = useSelectableCategories('income')
  const [mode, setMode] = useState<'add' | 'subtract'>(initialMode)
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState<string>('')
  const [accountId, setAccountId] = useState(defaultAccountId)
  const [comment, setComment] = useState('')
  const [date, setDate] = useState(toDateInput(new Date()))
  const [time, setTime] = useState(toTimeInput(new Date()))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    const d = defaultDate ?? new Date()
    setMode(initialMode)
    setAmount('')
    setCategoryId(incomeCategories[0]?.id ?? ADJUSTMENT)
    setAccountId(defaultAccountId)
    setComment('')
    setDate(toDateInput(d))
    setTime(toTimeInput(d))
    setError(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialMode])

  const submit = () => {
    const value = parseAmount(amount)
    if (!amount || Number.isNaN(value)) return setError('Введи суму')
    if (value <= 0) return setError('Сума повинна бути більшою за 0')
    const when = fromDateTimeInputs(date, time)
    const base = { amount: value, accountId, date: when, comment: comment.trim() || undefined }
    if (mode === 'add' && categoryId !== ADJUSTMENT) {
      addTransaction({ ...base, type: 'income', categoryId })
    } else {
      const direction: AdjustmentDirection = mode === 'add' ? 'in' : 'out'
      addTransaction({ ...base, type: 'adjustment', categoryId: null, adjustmentDirection: direction })
    }
    toast(mode === 'add' ? `Додано ${formatMoney(value)}` : `Віднято ${formatMoney(value)}`)
    onClose()
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={mode === 'add' ? 'Додати гроші' : 'Відняти суму'}
      description={
        mode === 'add'
          ? 'Гроші, які ти отримала цього місяця. Баланс збільшиться.'
          : 'Зменшує отриману за місяць суму (наприклад, помилка чи віддала частину). Це не рахується як витрата.'
      }
      footer={
        <Button block size="lg" onClick={submit} variant={mode === 'add' ? 'primary' : 'danger-soft'}>
          {mode === 'add' ? 'Додати' : 'Відняти'}
        </Button>
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
        <Segmented<'add' | 'subtract'>
          label="Дія"
          value={mode}
          onChange={(m) => {
            setMode(m)
            setError(null)
          }}
          options={[
            { value: 'add', label: '+ Додати' },
            { value: 'subtract', label: '− Відняти' },
          ]}
        />
        <AmountInput
          value={amount}
          onChange={(v) => {
            setAmount(v)
            setError(null)
          }}
          error={error}
          tone={mode === 'add' ? 'income' : 'expense'}
          size="md"
          autoFocus
        />
        {mode === 'add' && (
          <ChipGroup
            label="Звідки гроші"
            value={categoryId}
            onChange={setCategoryId}
            options={[...incomeCategories.map((c) => ({ value: c.id, label: c.name, color: c.color })), { value: ADJUSTMENT, label: 'Просто коригування' }]}
          />
        )}
        <AccountSelector accounts={accounts} value={accountId} onChange={setAccountId} label={mode === 'add' ? 'На рахунок' : 'З рахунку'} />
        <DatePicker date={date} onDateChange={setDate} time={time} onTimeChange={setTime} label="День і час" />
        <div className="space-y-1.5">
          <label htmlFor="money-comment" className="flex items-center gap-1.5 text-sm font-medium text-muted">
            Коментар <span className="text-xs font-normal text-subtle">· необовʼязково</span>
          </label>
          <AutoTextarea id="money-comment" value={comment} maxLength={300} placeholder="Наприклад, аванс або премія" onChange={(e) => setComment(e.target.value)} />
        </div>
        <button type="submit" hidden />
      </form>
    </Sheet>
  )
}
