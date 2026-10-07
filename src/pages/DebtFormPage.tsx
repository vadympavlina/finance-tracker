import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Info } from 'lucide-react'
import type { Debt, DebtDirection } from '../types'
import { PageHeader } from '../components/common/PageHeader'
import { AmountInput } from '../components/common/AmountInput'
import { DatePicker } from '../components/common/DatePicker'
import { Segmented } from '../components/ui/Tabs'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Switch, TextArea, TextField } from '../components/ui/Field'
import { useFinance } from '../hooks/useFinance'
import { useToast } from '../hooks/useUI'
import { amountToInput, formatMoney, parseAmount } from '../utils/format'
import { addDays, fromDateTimeInputs, parseDate, toDateInput, toTimeInput } from '../utils/date'

export default function DebtFormPage() {
  const { id } = useParams()
  const { data } = useFinance()
  const existing = id ? data.debts.find((d) => d.id === id) : undefined
  if (id && !existing) return <Navigate to="/debts" replace />
  return <DebtForm key={id ?? 'new'} existing={existing} />
}

function DebtForm({ existing }: { existing?: Debt }) {
  const navigate = useNavigate()
  const toast = useToast()
  const { data, addDebt, updateDebt } = useFinance()
  const [direction, setDirection] = useState<DebtDirection>(existing?.direction ?? 'i_owe')
  const [person, setPerson] = useState(existing?.person ?? '')
  const [amount, setAmount] = useState(existing ? amountToInput(existing.amount) : '')
  const [date, setDate] = useState(toDateInput(existing ? parseDate(existing.date) : new Date()))
  const [hasDue, setHasDue] = useState(existing ? Boolean(existing.dueDate) : true)
  const [dueDate, setDueDate] = useState(toDateInput(existing?.dueDate ? parseDate(existing.dueDate) : addDays(new Date(), 14)))
  const [comment, setComment] = useState(existing?.comment ?? '')
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})

  const contacts = [...new Set(data.debts.map((d) => d.person))].slice(0, 8)

  const save = () => {
    const value = parseAmount(amount)
    const e: Record<string, string> = {}
    if (!person.trim()) e.person = 'Вкажи контакт'
    if (!amount || Number.isNaN(value)) e.amount = 'Введи суму'
    else if (value <= 0) e.amount = 'Сума повинна бути більшою за 0'
    else if (existing && value < existing.repaidAmount) e.amount = `Сума не може бути меншою за вже повернуте (${formatMoney(existing.repaidAmount)})`
    if (hasDue && dueDate < date) e.due = 'Дата повернення не може бути раніше дати боргу'
    setErrors(e)
    if (Object.keys(e).length) return

    const payload = {
      direction,
      person: person.trim(),
      amount: value,
      date: fromDateTimeInputs(date, existing ? toTimeInput(parseDate(existing.date)) : toTimeInput(new Date())),
      dueDate: hasDue ? fromDateTimeInputs(dueDate, '23:59') : null,
      comment: comment.trim() || undefined,
    }
    if (existing) {
      updateDebt(existing.id, payload)
      toast('Борг оновлено')
    } else {
      addDebt(payload)
      toast('Борг додано')
    }
    if (window.history.state?.idx > 0) navigate(-1)
    else navigate('/debts')
  }

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title={existing ? 'Редагувати борг' : 'Додати борг'} back />
      <form
        noValidate
        className="space-y-5"
        onSubmit={(ev) => {
          ev.preventDefault()
          save()
        }}
      >
        <Segmented<DebtDirection>
          label="Напрям боргу"
          value={direction}
          onChange={setDirection}
          options={[
            { value: 'i_owe', label: 'Я винен' },
            { value: 'they_owe_me', label: 'Мені винні' },
          ]}
        />

        <Card className="px-4 py-5">
          <AmountInput
            value={amount}
            onChange={(v) => {
              setAmount(v)
              setErrors((x) => ({ ...x, amount: undefined }))
            }}
            error={errors.amount}
            tone={direction === 'they_owe_me' ? 'income' : 'expense'}
            autoFocus={!existing}
          />
        </Card>

        <Card className="space-y-4 p-4">
          <div className="space-y-2">
            <TextField
              label="Контакт"
              value={person}
              maxLength={40}
              placeholder="Імʼя"
              autoComplete="off"
              error={errors.person}
              onChange={(ev) => {
                setPerson(ev.target.value)
                setErrors((x) => ({ ...x, person: undefined }))
              }}
            />
            {!existing && contacts.length > 0 && (
              <div className="flex flex-wrap gap-1.5" aria-label="Нещодавні контакти">
                {contacts.map((c) => (
                  <button key={c} type="button" onClick={() => setPerson(c)} className="press h-8 rounded-full bg-surface-2 px-3 text-xs font-medium text-muted hover:text-text">
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>
          <DatePicker date={date} onDateChange={setDate} label="Дата" max={toDateInput(new Date())} />
          <Switch checked={hasDue} onChange={setHasDue} label="Дата повернення" description={hasDue ? undefined : 'Без конкретної дати'} />
          {hasDue && <DatePicker date={dueDate} onDateChange={setDueDate} label="Повернути до" quickPicks={false} min={date} error={errors.due} />}
          <TextArea label="Коментар" optional value={comment} maxLength={200} placeholder="За що або на що" onChange={(ev) => setComment(ev.target.value)} />
        </Card>

        {!existing && (
          <p className="flex gap-2 px-1 text-sm text-muted">
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
            Створення боргу не змінює баланс. Коли гроші реально повернуть, натисни «Додати повернення» — тоді створиться операція.
          </p>
        )}

        <div className="sticky bottom-0 -mx-4 bg-gradient-to-t from-bg via-bg to-bg/0 px-4 pt-4 pb-[max(16px,env(safe-area-inset-bottom))] sm:-mx-6 sm:px-6 lg:static lg:mx-0 lg:bg-none lg:px-0">
          <Button type="submit" size="lg" block>
            {existing ? 'Зберегти зміни' : 'Зберегти борг'}
          </Button>
        </div>
      </form>
    </div>
  )
}
