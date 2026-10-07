import { useEffect, useState } from 'react'
import type { Debt } from '../../types'
import { Sheet } from '../ui/Sheet'
import { Button } from '../ui/Button'
import { TextField } from '../ui/Field'
import { AmountInput } from '../common/AmountInput'
import { AccountSelector } from '../common/AccountSelector'
import { DatePicker } from '../common/DatePicker'
import { useActiveAccounts, useDefaultAccountId, useFinance } from '../../hooks/useFinance'
import { useToast } from '../../hooks/useUI'
import { calculateDebtRemaining } from '../../services/calculations'
import { amountToInput, formatMoney, parseAmount } from '../../utils/format'
import { fromDateTimeInputs, toDateInput, toTimeInput } from '../../utils/date'

interface Props {
  debt: Debt | null
  open: boolean
  onClose: () => void
  /** Prefill with the whole remaining amount ("Погасити повністю"). */
  full?: boolean
}

/** Registers a REAL money movement for a debt — creates a transaction and changes the balance. */
export function RepaymentSheet({ debt, open, onClose, full }: Props) {
  const { addDebtRepayment } = useFinance()
  const accounts = useActiveAccounts()
  const defaultAccountId = useDefaultAccountId()
  const toast = useToast()
  const [amount, setAmount] = useState('')
  const [accountId, setAccountId] = useState(defaultAccountId)
  const [date, setDate] = useState(toDateInput(new Date()))
  const [comment, setComment] = useState('')
  const [error, setError] = useState<string | null>(null)

  const remaining = debt ? calculateDebtRemaining(debt) : 0

  useEffect(() => {
    if (!open) return
    setAmount(full ? amountToInput(remaining) : '')
    setAccountId(defaultAccountId)
    setDate(toDateInput(new Date()))
    setComment('')
    setError(null)
  }, [open, full, remaining, defaultAccountId])

  if (!debt) return null
  const theyOwe = debt.direction === 'they_owe_me'

  const submit = () => {
    const value = parseAmount(amount)
    if (!amount || Number.isNaN(value)) return setError('Введи суму')
    if (value <= 0) return setError('Сума повинна бути більшою за 0')
    if (value > remaining + 0.001) return setError(`Сума не може перевищувати залишок ${formatMoney(remaining)}`)
    const isToday = date === toDateInput(new Date())
    addDebtRepayment(debt.id, {
      amount: value,
      accountId,
      date: fromDateTimeInputs(date, isToday ? toTimeInput(new Date()) : '12:00'),
      comment: comment.trim() || undefined,
    })
    toast(value >= remaining ? 'Борг повністю закрито' : 'Борг оновлено')
    onClose()
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Додати повернення"
      description={theyOwe ? `${debt.person} повертає тобі гроші — баланс збільшиться.` : `Ти повертаєш гроші ${debt.person} — баланс зменшиться.`}
      footer={
        <Button block size="lg" onClick={submit}>
          Зберегти повернення
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
        <AmountInput
          value={amount}
          onChange={(v) => {
            setAmount(v)
            setError(null)
          }}
          error={error}
          tone={theyOwe ? 'income' : 'expense'}
          size="md"
          autoFocus={!full}
        />
        <div className="flex flex-wrap justify-center gap-2">
          {[0.25, 0.5, 1].map((part) => (
            <button
              key={part}
              type="button"
              onClick={() => {
                setAmount(amountToInput(Math.round(remaining * part * 100) / 100))
                setError(null)
              }}
              className="press h-9 rounded-full bg-surface-2 px-3.5 text-sm font-medium text-muted hover:text-text"
            >
              {part === 1 ? `Весь залишок · ${formatMoney(remaining)}` : `${part * 100}%`}
            </button>
          ))}
        </div>
        <AccountSelector accounts={accounts} value={accountId} onChange={setAccountId} label={theyOwe ? 'На рахунок' : 'З рахунку'} />
        <DatePicker date={date} onDateChange={setDate} max={toDateInput(new Date())} />
        <TextField label="Коментар" optional value={comment} maxLength={140} onChange={(e) => setComment(e.target.value)} />
        <button type="submit" hidden />
      </form>
    </Sheet>
  )
}
