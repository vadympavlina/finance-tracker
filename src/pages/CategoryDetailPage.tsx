import { useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { CalendarClock, Ellipsis, Eye, EyeOff, List, MessageSquareText, Pencil, Send, Trash2 } from 'lucide-react'
import type { CategoryNote, Transaction } from '../types'
import { PageHeader } from '../components/common/PageHeader'
import { PeriodNav } from '../components/common/PeriodNav'
import { CategoryIcon } from '../components/common/CategoryIcon'
import { DatePicker } from '../components/common/DatePicker'
import { CategoryFormSheet } from '../components/categories/CategoryFormSheet'
import { NoteSheet } from '../components/categories/NoteSheet'
import { TransactionDetailsSheet } from '../components/transactions/TransactionDetailsSheet'
import { Card } from '../components/ui/Card'
import { Button, IconButton } from '../components/ui/Button'
import { Sheet } from '../components/ui/Sheet'
import { ActionRow } from '../components/ui/ActionRow'
import { AutoTextarea } from '../components/ui/AutoTextarea'
import { FitText } from '../components/ui/FitText'
import { ProgressBar } from '../components/ui/ProgressBar'
import { EmptyState } from '../components/ui/EmptyState'
import { controlClassName } from '../components/ui/Field'
import { useDefaultAccountId, useFinance } from '../hooks/useFinance'
import { useConfirm, useToast } from '../hooks/useUI'
import { calculateBudgetProgress, filterByRange, sumAmounts } from '../services/calculations'
import {
  addMonths,
  formatMonthYear,
  formatRelativeDay,
  formatTime,
  fromDateTimeInputs,
  isInRange,
  isSameMonth,
  monthRange,
  nowISO,
  parseDate,
  toDateInput,
  toTimeInput,
} from '../utils/date'
import { formatMoney, formatPercent, formatSignedMoney, parseAmount, pluralUk, sanitizeAmountInput } from '../utils/format'
import { cn } from '../utils/cn'

type Entry = { kind: 'tx'; id: string; date: string; tx: Transaction } | { kind: 'note'; id: string; date: string; note: CategoryNote }

const parseMonth = (value: string | null): Date => {
  if (value && /^\d{4}-\d{2}$/.test(value)) {
    const [y, m] = value.split('-').map(Number)
    return new Date(y, m - 1, 1)
  }
  return new Date()
}
const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`

/**
 * One category as a journal: totals for the month and a timeline of operations and notes.
 * A comment can be written at any moment — day and time are stamped automatically;
 * with an amount it becomes an operation, without — a note.
 */
export default function CategoryDetailPage() {
  const { id } = useParams()
  const { data } = useFinance()
  const category = data.categories.find((c) => c.id === id)
  if (!category) return <Navigate to="/categories" replace />
  return <CategoryJournal key={category.id} categoryId={category.id} />
}

function CategoryJournal({ categoryId }: { categoryId: string }) {
  const { data, addNote, addTransaction, updateCategory, deleteCategory } = useFinance()
  const defaultAccountId = useDefaultAccountId()
  const toast = useToast()
  const confirm = useConfirm()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const month = parseMonth(params.get('m'))
  const setMonth = (d: Date) => setParams(isSameMonth(d, new Date()) ? {} : { m: monthKey(d) }, { replace: true })
  const category = data.categories.find((c) => c.id === categoryId)!
  const isIncome = category.type === 'income'

  const [text, setText] = useState('')
  const [amount, setAmount] = useState('')
  const [customTime, setCustomTime] = useState(false)
  const [date, setDate] = useState(toDateInput(new Date()))
  const [time, setTime] = useState(toTimeInput(new Date()))
  const [error, setError] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [txId, setTxId] = useState<string | null>(null)
  const [noteId, setNoteId] = useState<string | null>(null)

  const range = useMemo(() => monthRange(month), [month.getFullYear(), month.getMonth()]) // eslint-disable-line react-hooks/exhaustive-deps

  const { entries, total, count, notesCount } = useMemo(() => {
    const txs = filterByRange(data.transactions, range).filter((t) => t.categoryId === categoryId)
    const notes = data.notes.filter((n) => n.categoryId === categoryId && isInRange(n.date, range))
    const list: Entry[] = [
      ...txs.map((tx) => ({ kind: 'tx' as const, id: tx.id, date: tx.date, tx })),
      ...notes.map((note) => ({ kind: 'note' as const, id: note.id, date: note.date, note })),
    ].sort((a, b) => parseDate(b.date).getTime() - parseDate(a.date).getTime())
    return { entries: list, total: sumAmounts(txs), count: txs.length, notesCount: notes.length }
  }, [data.transactions, data.notes, categoryId, range])

  const budget = data.budgets.find((b) => b.categoryId === categoryId && b.period === 'month')
  const progress = budget ? calculateBudgetProgress(budget, data.transactions, isSameMonth(month, new Date()) ? new Date() : range.end) : null

  const groups = useMemo(() => {
    const map = new Map<string, Entry[]>()
    for (const e of entries) {
      const key = toDateInput(parseDate(e.date))
      map.set(key, [...(map.get(key) ?? []), e])
    }
    return [...map.entries()]
  }, [entries])

  const submit = () => {
    const value = amount ? parseAmount(amount) : null
    if (!text.trim() && value === null) return setError('Напиши коментар або вкажи суму')
    if (value !== null && (Number.isNaN(value) || value <= 0)) return setError('Сума повинна бути більшою за 0')
    const when = customTime ? fromDateTimeInputs(date, time) : nowISO()
    if (value !== null) {
      addTransaction({
        type: isIncome ? 'income' : 'expense',
        amount: value,
        categoryId,
        accountId: defaultAccountId,
        date: when,
        comment: text.trim() || undefined,
      })
      toast(isIncome ? 'Дохід додано' : 'Витрату додано')
    } else {
      addNote({ categoryId, text: text.trim(), date: when })
      toast('Нотатку додано')
    }
    setText('')
    setAmount('')
    setError(null)
    setCustomTime(false)
    if (!isInRange(when, range)) setMonth(parseDate(when))
  }

  const onDelete = async () => {
    const used = data.transactions.some((t) => t.categoryId === categoryId) || data.notes.some((n) => n.categoryId === categoryId)
    const ok = await confirm({
      title: `Видалити «${category.name}»?`,
      message: used
        ? 'У категорії є записи, тому вона стане архівованою: історія збережеться, але обрати її для нових операцій буде неможливо.'
        : 'Категорію буде видалено назавжди.',
      confirmLabel: 'Видалити',
      danger: true,
    })
    if (!ok) return
    const result = deleteCategory(categoryId)
    toast(result === 'archived' ? 'Категорію архівовано' : 'Категорію видалено')
    navigate('/categories', { replace: true })
  }

  const selectedTx = txId ? (data.transactions.find((t) => t.id === txId) ?? null) : null
  const selectedNote = noteId ? (data.notes.find((n) => n.id === noteId) ?? null) : null
  const canNext = !isSameMonth(month, new Date())

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={category.name}
        subtitle={`${isIncome ? 'Доходи' : 'Витрати'}${category.isArchived ? ' · архівована' : ''}${category.isHidden ? ' · прихована' : ''}`}
        back
        actions={
          <IconButton label="Дії з категорією" onClick={() => setMenuOpen(true)}>
            <Ellipsis className="size-5" aria-hidden />
          </IconButton>
        }
      />

      <div className="space-y-4">
        <PeriodNav label={formatMonthYear(month)} onPrev={() => setMonth(addMonths(month, -1))} onNext={() => setMonth(addMonths(month, 1))} canNext={canNext} />

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <CategoryIcon icon={category.icon} color={category.color} size="lg" muted={category.isArchived} />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-muted">{isIncome ? 'Отримано' : 'Витрачено'}</p>
              <FitText as="p" className={cn('tabular text-[1.75rem] leading-tight font-bold tracking-tight', isIncome && 'text-income')}>
                {formatMoney(total)}
              </FitText>
              <p className="text-[0.8125rem] text-muted">
                {count} {pluralUk(count, ['операція', 'операції', 'операцій'])} · {notesCount} {pluralUk(notesCount, ['нотатка', 'нотатки', 'нотаток'])}
              </p>
            </div>
          </div>
          {progress && (
            <div className="mt-4">
              <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
                <span className="text-muted">Бюджет {formatMoney(progress.budget.amount)}</span>
                <span className={cn('tabular font-semibold', progress.status === 'exceeded' ? 'text-expense' : progress.status === 'warning' ? 'text-warning' : '')}>
                  {formatPercent(progress.percent)}
                </span>
              </div>
              <ProgressBar value={progress.percent} status={progress.status} color={category.color} label="Використано бюджету" />
              <p className={cn('mt-1.5 text-[0.8125rem]', progress.status === 'exceeded' ? 'text-expense' : 'text-muted')}>
                {progress.status === 'exceeded' ? `Перевищено на ${formatMoney(-progress.remaining)}` : `Залишилось ${formatMoney(progress.remaining)}`}
              </p>
            </div>
          )}
        </Card>

        {/* Composer */}
        {!category.isArchived && (
          <Card className="p-3">
            <form
              noValidate
              onSubmit={(e) => {
                e.preventDefault()
                submit()
              }}
              className="space-y-2.5"
            >
              <label htmlFor="journal-text" className="sr-only">
                Коментар
              </label>
              <AutoTextarea
                id="journal-text"
                value={text}
                maxLength={1000}
                placeholder="Напиши коментар… День і час додадуться самі"
                aria-invalid={!!error}
                onChange={(e) => {
                  setText(e.target.value)
                  setError(null)
                }}
                className="bg-surface-2"
              />
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative min-w-[8.5rem] flex-1">
                  <label htmlFor="journal-amount" className="sr-only">
                    Сума, необовʼязково
                  </label>
                  <input
                    id="journal-amount"
                    inputMode="decimal"
                    autoComplete="off"
                    placeholder="Сума"
                    value={amount}
                    onChange={(e) => {
                      setAmount(sanitizeAmountInput(e.target.value))
                      setError(null)
                    }}
                    className={cn(controlClassName, 'tabular h-11 pr-9')}
                  />
                  <span className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-subtle" aria-hidden>
                    ₴
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setCustomTime((v) => !v)}
                  aria-expanded={customTime}
                  className={cn(
                    'press inline-flex h-11 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium',
                    customTime ? 'bg-primary-soft text-primary' : 'bg-surface-2 text-muted hover:text-text',
                  )}
                >
                  <CalendarClock className="size-4 shrink-0" aria-hidden />
                  {customTime ? 'Свій час' : 'Зараз'}
                </button>
                <Button type="submit" icon={<Send className="size-[18px]" aria-hidden />} className="h-11">
                  Додати
                </Button>
              </div>
              {customTime && <DatePicker date={date} onDateChange={setDate} time={time} onTimeChange={setTime} label="День і час" max={toDateInput(new Date())} />}
              {error && (
                <p role="alert" className="text-sm font-medium text-expense">
                  {error}
                </p>
              )}
              <p className="text-xs text-subtle">
                {amount ? `Буде додано ${isIncome ? 'дохід' : 'витрату'} ${amount} ₴ у «${category.name}».` : 'Без суми — збережеться як нотатка.'}
              </p>
            </form>
          </Card>
        )}

        {/* Timeline */}
        {groups.length ? (
          <div className="space-y-5">
            {groups.map(([day, list]) => (
              <section key={day} aria-label={formatRelativeDay(day)}>
                <h3 className="mb-1.5 px-2 text-sm font-semibold text-muted">{formatRelativeDay(day)}</h3>
                <ul className="divide-y divide-border overflow-hidden rounded-[22px] bg-surface shadow-card">
                  {list.map((e) => (
                    <li key={e.id}>
                      <button
                        type="button"
                        onClick={() => (e.kind === 'tx' ? setTxId(e.id) : setNoteId(e.id))}
                        className="press flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-surface-2"
                      >
                        <span className="tabular w-11 shrink-0 pt-0.5 text-[0.8125rem] font-medium text-muted">{formatTime(e.date)}</span>
                        <span className="min-w-0 flex-1">
                          {e.kind === 'note' ? (
                            <span className="flex items-start gap-2">
                              <MessageSquareText className="mt-0.5 size-4 shrink-0 text-subtle" aria-label="Нотатка" />
                              <span className="min-w-0 text-[0.9375rem] leading-snug break-words whitespace-pre-wrap">{e.note.text}</span>
                            </span>
                          ) : (
                            <span className="flex items-start justify-between gap-3">
                              <span className="min-w-0 text-[0.9375rem] leading-snug break-words whitespace-pre-wrap">
                                {e.tx.comment || e.tx.merchant || <span className="text-muted">Без коментаря</span>}
                                {e.tx.comment && e.tx.merchant && <span className="mt-0.5 block text-[0.8125rem] text-muted">{e.tx.merchant}</span>}
                              </span>
                              <span className={cn('tabular shrink-0 text-[0.9375rem] font-semibold whitespace-nowrap', isIncome && 'text-income')}>
                                {formatSignedMoney(isIncome ? e.tx.amount : -e.tx.amount)}
                              </span>
                            </span>
                          )}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        ) : (
          <Card>
            <EmptyState
              compact
              icon={MessageSquareText}
              title={`Ще немає записів за ${formatMonthYear(month).toLowerCase()}`}
              description={category.isArchived ? 'Категорія архівована.' : 'Напиши коментар вище — день і час збережуться автоматично.'}
            />
          </Card>
        )}
      </div>

      <Sheet open={menuOpen} onClose={() => setMenuOpen(false)} title={category.name} size="sm">
        <div className="grid gap-1">
          <ActionRow
            icon={List}
            label="Усі операції в історії"
            onClick={() => {
              setMenuOpen(false)
              navigate(`/history?category=${categoryId}`)
            }}
          />
          <ActionRow
            icon={Pencil}
            label="Редагувати назву, іконку, колір"
            onClick={() => {
              setMenuOpen(false)
              setFormOpen(true)
            }}
          />
          {!category.isArchived && (
            <ActionRow
              icon={category.isHidden ? Eye : EyeOff}
              label={category.isHidden ? 'Показувати при виборі' : 'Приховати з вибору'}
              onClick={() => {
                updateCategory(categoryId, { isHidden: !category.isHidden })
                toast(category.isHidden ? 'Категорію показано' : 'Категорію приховано')
                setMenuOpen(false)
              }}
            />
          )}
          {category.isArchived ? (
            <ActionRow
              icon={Eye}
              label="Відновити категорію"
              onClick={() => {
                updateCategory(categoryId, { isArchived: false })
                toast('Категорію відновлено')
                setMenuOpen(false)
              }}
            />
          ) : (
            <ActionRow
              icon={Trash2}
              label="Видалити"
              danger
              onClick={() => {
                setMenuOpen(false)
                void onDelete()
              }}
            />
          )}
        </div>
      </Sheet>

      <CategoryFormSheet open={formOpen} onClose={() => setFormOpen(false)} category={category} />
      <TransactionDetailsSheet tx={selectedTx} onClose={() => setTxId(null)} />
      <NoteSheet note={selectedNote} onClose={() => setNoteId(null)} />
    </div>
  )
}
