import { useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { CalendarDays, ChevronDown, CreditCard, MessageSquare } from 'lucide-react'
import type { Transaction, TransactionType } from '../types'
import { PageHeader } from '../components/common/PageHeader'
import { AmountInput } from '../components/common/AmountInput'
import { CategorySelector } from '../components/common/CategorySelector'
import { AccountSelector } from '../components/common/AccountSelector'
import { DatePicker } from '../components/common/DatePicker'
import { CategoryFormSheet } from '../components/categories/CategoryFormSheet'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Segmented } from '../components/ui/Tabs'
import { TextField } from '../components/ui/Field'
import { useActiveAccounts, useDefaultAccountId, useFinance, useSelectableCategories } from '../hooks/useFinance'
import { useToast } from '../hooks/useUI'
import { amountToInput, formatMoney, parseAmount } from '../utils/format'
import { formatRelativeDay, fromDateTimeInputs, parseDate, toDateInput, toTimeInput } from '../utils/date'
import { calculateBudgetProgress } from '../services/calculations'
import { cn } from '../utils/cn'

type FormType = Exclude<TransactionType, 'debt_repayment' | 'adjustment'>

const TITLES: Record<TransactionType, { add: string; edit: string; saved: string; updated: string }> = {
  expense: { add: 'Додати витрату', edit: 'Редагувати витрату', saved: 'Витрату додано', updated: 'Витрату оновлено' },
  income: { add: 'Додати дохід', edit: 'Редагувати дохід', saved: 'Дохід додано', updated: 'Дохід оновлено' },
  transfer: { add: 'Переказ', edit: 'Редагувати переказ', saved: 'Переказ збережено', updated: 'Переказ оновлено' },
  debt_repayment: { add: 'Повернення боргу', edit: 'Редагувати повернення', saved: 'Борг оновлено', updated: 'Борг оновлено' },
  adjustment: { add: 'Коригування', edit: 'Редагувати коригування', saved: 'Суму оновлено', updated: 'Суму оновлено' },
}

export default function TransactionFormPage() {
  const { type: typeParam, id } = useParams()
  const { data } = useFinance()
  const existing = id ? data.transactions.find((t) => t.id === id) : undefined

  if (id && !existing) return <Navigate to="/history" replace />
  if (!id && !['expense', 'income', 'transfer'].includes(typeParam ?? '')) return <Navigate to="/add/expense" replace />

  return <TransactionForm key={id ?? typeParam} existing={existing} initialType={(existing?.type ?? typeParam) as TransactionType} />
}

function TransactionForm({ existing, initialType }: { existing?: Transaction; initialType: TransactionType }) {
  const navigate = useNavigate()
  const toast = useToast()
  const { data, addTransaction, updateTransaction } = useFinance()
  const accounts = useActiveAccounts()
  const defaultAccountId = useDefaultAccountId()

  const [type, setType] = useState<TransactionType>(initialType)
  const [amount, setAmount] = useState(existing ? amountToInput(existing.amount) : '')
  const [categoryId, setCategoryId] = useState<string | null>(existing?.categoryId ?? null)
  const [accountId, setAccountId] = useState(existing?.accountId ?? defaultAccountId)
  const [toAccountId, setToAccountId] = useState(
    existing?.toAccountId ?? accounts.find((a) => a.id !== (existing?.accountId ?? defaultAccountId))?.id ?? '',
  )
  const initialDate = existing ? parseDate(existing.date) : new Date()
  const [date, setDate] = useState(toDateInput(initialDate))
  const [time, setTime] = useState(toTimeInput(initialDate))
  const [merchant, setMerchant] = useState(existing?.merchant ?? '')
  const [comment, setComment] = useState(existing?.comment ?? '')
  const [showDetails, setShowDetails] = useState(Boolean(existing))
  const [errors, setErrors] = useState<{ amount?: string; category?: string; account?: string }>({})
  const [categorySheet, setCategorySheet] = useState(false)

  const categoryType = type === 'income' ? 'income' : 'expense'
  const selectable = useSelectableCategories(categoryType)
  // When editing an operation with an archived/hidden category keep it visible.
  const categories = useMemo(() => {
    const current = categoryId ? data.categories.find((c) => c.id === categoryId) : undefined
    return current && !selectable.includes(current) && current.type === categoryType ? [...selectable, current] : selectable
  }, [selectable, categoryId, data.categories, categoryType])

  // Accounts list for editing may include an archived account used by the operation.
  const accountOptions = useMemo(() => {
    const ids = new Set(accounts.map((a) => a.id))
    const extra = data.accounts.filter((a) => (a.id === accountId || a.id === toAccountId) && !ids.has(a.id))
    return [...accounts, ...extra]
  }, [accounts, data.accounts, accountId, toAccountId])

  const titles = TITLES[type]
  // Debt repayments and month adjustments keep their type when edited (no type switcher).
  const isDebt = type === 'debt_repayment' || type === 'adjustment'

  const changeType = (next: FormType) => {
    setType(next)
    setErrors({})
    const stillValid = data.categories.find((c) => c.id === categoryId)?.type === (next === 'income' ? 'income' : 'expense')
    if (!stillValid) setCategoryId(null)
  }

  const save = () => {
    const value = parseAmount(amount)
    const nextErrors: typeof errors = {}
    if (!amount.trim() || Number.isNaN(value)) nextErrors.amount = 'Введи суму'
    else if (value <= 0) nextErrors.amount = 'Сума повинна бути більшою за 0'
    if ((type === 'expense' || type === 'income') && !categoryId) nextErrors.category = 'Обери категорію'
    if (!accountId) nextErrors.account = 'Обери рахунок'
    if (type === 'transfer' && (!toAccountId || toAccountId === accountId)) nextErrors.account = 'Обери два різні рахунки'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) {
      if (nextErrors.account) setShowDetails(true)
      return
    }

    const payload = {
      type,
      amount: value,
      categoryId: type === 'expense' || type === 'income' ? categoryId : null,
      accountId,
      toAccountId: type === 'transfer' ? toAccountId : null,
      date: fromDateTimeInputs(date, time),
      merchant: type === 'transfer' || isDebt ? undefined : merchant.trim() || undefined,
      comment: comment.trim() || undefined,
      debtId: existing?.debtId ?? null,
      debtDirection: existing?.debtDirection ?? null,
      debtPerson: existing?.debtPerson ?? null,
      adjustmentDirection: existing?.adjustmentDirection ?? null,
    }

    let saved: Transaction
    if (existing) {
      updateTransaction(existing.id, payload)
      saved = { ...existing, ...payload }
      toast(titles.updated)
    } else {
      saved = addTransaction(payload)
      toast(titles.saved)
    }

    // Friendly heads-up when this expense breaks a budget.
    if (saved.type === 'expense') {
      const nextTransactions = existing ? data.transactions.map((t) => (t.id === saved.id ? saved : t)) : [...data.transactions, saved]
      const exceeded = data.budgets
        .filter((b) => b.categoryId === null || b.categoryId === saved.categoryId)
        .map((b) => calculateBudgetProgress(b, nextTransactions, parseDate(saved.date)))
        .find((p) => p.status === 'exceeded' && p.isActive)
      if (exceeded) {
        const name = exceeded.budget.categoryId ? data.categories.find((c) => c.id === exceeded.budget.categoryId)?.name : 'Місячний бюджет'
        window.setTimeout(() => toast(`Перевищено бюджет «${name}» на ${formatMoney(-exceeded.remaining)}`, 'error'), 400)
      }
    }

    if (window.history.state?.idx > 0) navigate(-1)
    else navigate('/')
  }

  const account = data.accounts.find((a) => a.id === accountId)

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title={existing ? titles.edit : titles.add} back />

      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          save()
        }}
        className="space-y-5"
      >
        {!isDebt && (
          <Segmented<FormType>
            label="Тип операції"
            value={type as FormType}
            onChange={changeType}
            options={[
              { value: 'expense', label: 'Витрата' },
              { value: 'income', label: 'Дохід' },
              { value: 'transfer', label: 'Переказ' },
            ]}
          />
        )}

        <Card className="px-4 py-5">
          <AmountInput
            value={amount}
            onChange={(v) => {
              setAmount(v)
              if (errors.amount) setErrors((e) => ({ ...e, amount: undefined }))
            }}
            error={errors.amount}
            tone={type === 'income' ? 'income' : 'expense'}
            autoFocus={!existing}
          />
        </Card>

        {(type === 'expense' || type === 'income') && (
          <CategorySelector
            categories={categories}
            value={categoryId}
            onChange={(cid) => {
              setCategoryId(cid)
              setErrors((e) => ({ ...e, category: undefined }))
            }}
            onCreate={() => setCategorySheet(true)}
            error={errors.category}
          />
        )}

        {type === 'transfer' && (
          <Card className="space-y-4 p-4">
            <AccountSelector accounts={accountOptions} value={accountId} onChange={setAccountId} label="З рахунку" />
            <AccountSelector accounts={accountOptions} value={toAccountId} onChange={setToAccountId} label="На рахунок" disabledId={accountId} error={errors.account} />
            <p className="text-xs text-subtle">Переказ не рахується як дохід чи витрата — змінюється лише місце зберігання грошей.</p>
          </Card>
        )}

        {!showDetails && type !== 'transfer' ? (
          <button
            type="button"
            onClick={() => setShowDetails(true)}
            aria-expanded={false}
            className="press flex w-full flex-wrap items-center gap-2 rounded-[22px] bg-surface p-3 text-left text-sm shadow-card hover:bg-surface-2"
          >
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1.5 font-medium">
              <CalendarDays className="size-4 text-muted" aria-hidden /> {formatRelativeDay(date)}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1.5 font-medium">
              <CreditCard className="size-4 text-muted" aria-hidden /> {account?.name ?? 'Рахунок'}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-1.5 text-muted">
              <MessageSquare className="size-4" aria-hidden /> Коментар
            </span>
            <ChevronDown className="ml-auto size-4 text-subtle" aria-hidden />
          </button>
        ) : (
          <Card className="space-y-4 p-4">
            {type !== 'transfer' && (
              <AccountSelector
                accounts={accountOptions}
                value={accountId}
                onChange={setAccountId}
                label={type === 'income' ? 'На рахунок' : isDebt ? 'Рахунок' : 'Метод оплати'}
                error={errors.account}
              />
            )}
            <DatePicker date={date} onDateChange={setDate} time={time} onTimeChange={setTime} />
            {(type === 'expense' || type === 'income') && (
              <TextField
                label={type === 'income' ? 'Джерело' : 'Магазин / місце'}
                optional
                value={merchant}
                maxLength={60}
                placeholder={type === 'income' ? 'Наприклад, ITSTEP' : 'Наприклад, Сільпо'}
                onChange={(e) => setMerchant(e.target.value)}
              />
            )}
            <TextField label="Коментар" optional value={comment} maxLength={140} placeholder="Короткий опис" onChange={(e) => setComment(e.target.value)} />
          </Card>
        )}

        <div className="sticky bottom-0 -mx-4 bg-gradient-to-t from-bg via-bg to-bg/0 px-4 pt-4 pb-[max(16px,env(safe-area-inset-bottom))] sm:-mx-6 sm:px-6 lg:static lg:mx-0 lg:bg-none lg:px-0">
          <Button type="submit" size="lg" block className={cn(type === 'income' && 'bg-income shadow-none hover:bg-income hover:brightness-95')}>
            {existing ? 'Зберегти зміни' : 'Зберегти'}
          </Button>
        </div>
      </form>

      <CategoryFormSheet
        open={categorySheet}
        onClose={() => setCategorySheet(false)}
        defaultType={categoryType}
        onSaved={(c) => {
          setCategoryId(c.id)
          setErrors((e) => ({ ...e, category: undefined }))
        }}
      />
    </div>
  )
}
