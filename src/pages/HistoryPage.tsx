import { useDeferredValue, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, ReceiptText, Search, SearchX, SlidersHorizontal, X } from 'lucide-react'
import type { TransactionType } from '../types'
import { PageHeader } from '../components/common/PageHeader'
import { TransactionList } from '../components/transactions/TransactionList'
import { Segmented } from '../components/ui/Tabs'
import { Button, IconButton } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { Sheet } from '../components/ui/Sheet'
import { TextField, controlClassName } from '../components/ui/Field'
import { ChipGroup } from '../components/ui/ChipGroup'
import { useFinance, useLookups } from '../hooks/useFinance'
import { calculateExpenses, calculateIncome, sortByDateDesc } from '../services/calculations'
import { addDays, addMonths, endOfDay, endOfMonth, parseDate, startOfDay, startOfMonth, toDateInput, formatDayMonth } from '../utils/date'
import { formatMoney, parseAmount, pluralUk } from '../utils/format'
import { cn } from '../utils/cn'
import { FitText } from '../components/ui/FitText'

type Tab = 'all' | 'income' | 'expense' | 'debts'

interface Filters {
  from: string
  to: string
  categoryId: string
  accountId: string
  type: '' | TransactionType
  min: string
  max: string
}

const EMPTY_FILTERS: Filters = { from: '', to: '', categoryId: '', accountId: '', type: '', min: '', max: '' }
const PAGE = 80

export default function HistoryPage() {
  const { data } = useFinance()
  const { categoryById, accountById } = useLookups()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [tab, setTab] = useState<Tab>((params.get('tab') as Tab) || 'all')
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const [filters, setFilters] = useState<Filters>({ ...EMPTY_FILTERS, categoryId: params.get('category') ?? '' })
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [limit, setLimit] = useState(PAGE)

  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase()
    const from = filters.from ? startOfDay(parseDate(filters.from)).getTime() : null
    const to = filters.to ? endOfDay(parseDate(filters.to)).getTime() : null
    const min = filters.min ? parseAmount(filters.min) : null
    const max = filters.max ? parseAmount(filters.max) : null
    const list = data.transactions.filter((t) => {
      if (tab === 'income' && t.type !== 'income') return false
      if (tab === 'expense' && t.type !== 'expense') return false
      if (tab === 'debts' && t.type !== 'debt_repayment') return false
      if (filters.type && t.type !== filters.type) return false
      if (filters.categoryId && t.categoryId !== filters.categoryId) return false
      if (filters.accountId && t.accountId !== filters.accountId && t.toAccountId !== filters.accountId) return false
      const time = parseDate(t.date).getTime()
      if (from !== null && time < from) return false
      if (to !== null && time > to) return false
      if (min !== null && !Number.isNaN(min) && t.amount < min) return false
      if (max !== null && !Number.isNaN(max) && t.amount > max) return false
      if (q) {
        const category = t.categoryId ? categoryById.get(t.categoryId)?.name : ''
        const haystack = [t.merchant, t.comment, category, t.debtPerson, accountById.get(t.accountId)?.name, t.amount.toString()]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
    return sortByDateDesc(list)
  }, [data.transactions, tab, filters, deferredQuery, categoryById, accountById])

  const totals = useMemo(() => ({ income: calculateIncome(filtered), expenses: calculateExpenses(filtered) }), [filtered])

  const chips: Array<{ key: keyof Filters | 'range'; label: string }> = []
  if (filters.from || filters.to)
    chips.push({ key: 'range', label: `${filters.from ? formatDayMonth(filters.from) : '…'} – ${filters.to ? formatDayMonth(filters.to) : '…'}` })
  if (filters.categoryId) chips.push({ key: 'categoryId', label: categoryById.get(filters.categoryId)?.name ?? 'Категорія' })
  if (filters.accountId) chips.push({ key: 'accountId', label: accountById.get(filters.accountId)?.name ?? 'Рахунок' })
  if (filters.type) chips.push({ key: 'type', label: TYPE_OPTIONS.find((o) => o.value === filters.type)?.label ?? '' })
  if (filters.min || filters.max) chips.push({ key: 'min', label: `${filters.min || '0'} – ${filters.max || '∞'} ₴` })

  const removeChip = (key: (typeof chips)[number]['key']) => {
    if (key === 'range') setFilters((f) => ({ ...f, from: '', to: '' }))
    else if (key === 'min') setFilters((f) => ({ ...f, min: '', max: '' }))
    else setFilters((f) => ({ ...f, [key]: '' }))
    if (key === 'categoryId' && params.get('category')) {
      params.delete('category')
      setParams(params, { replace: true })
    }
  }

  const hasAnyFilter = chips.length > 0 || query.trim().length > 0
  const isEmptyData = data.transactions.length === 0

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Історія" subtitle={`${filtered.length} ${pluralUk(filtered.length, ['операція', 'операції', 'операцій'])}`} back />

      <div className="space-y-4">
        <Segmented<Tab>
          label="Тип операцій"
          value={tab}
          onChange={(v) => {
            setTab(v)
            setLimit(PAGE)
          }}
          options={[
            { value: 'all', label: 'Всі' },
            { value: 'income', label: 'Доходи' },
            { value: 'expense', label: 'Витрати' },
            { value: 'debts', label: 'Борги' },
          ]}
        />

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-subtle" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Пошук операцій..."
              aria-label="Пошук операцій"
              className={cn(controlClassName, 'h-12 bg-surface pl-12 shadow-card')}
            />
          </div>
          <IconButton label="Фільтри" onClick={() => setFiltersOpen(true)} className={cn('size-12 rounded-2xl', chips.length > 0 && 'border-primary text-primary')}>
            <SlidersHorizontal className="size-5" aria-hidden />
          </IconButton>
        </div>

        {chips.length > 0 && (
          <div className="flex flex-wrap gap-2" aria-label="Активні фільтри">
            {chips.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => removeChip(c.key)}
                className="press inline-flex h-9 items-center gap-1.5 rounded-full bg-primary-soft pr-2.5 pl-3.5 text-sm font-medium text-primary"
                aria-label={`Прибрати фільтр ${c.label}`}
              >
                {c.label}
                <X className="size-4" aria-hidden />
              </button>
            ))}
            <button type="button" onClick={() => setFilters(EMPTY_FILTERS)} className="press h-9 rounded-full px-3 text-sm font-medium text-muted hover:text-text">
              Скинути все
            </button>
          </div>
        )}

        {filtered.length > 0 && (tab === 'all' || hasAnyFilter) && (
          <Card className="grid grid-cols-2 divide-x divide-border">
            <div className="px-4 py-3">
              <p className="text-xs text-muted">Доходи{hasAnyFilter ? ' · за фільтром' : ' · за весь час'}</p>
              <FitText as="p" className="tabular text-[17px] font-semibold text-income">{formatMoney(totals.income)}</FitText>
            </div>
            <div className="px-4 py-3">
              <p className="text-xs text-muted">Витрати{hasAnyFilter ? ' · за фільтром' : ' · за весь час'}</p>
              <FitText as="p" className="tabular text-[17px] font-semibold">{formatMoney(totals.expenses)}</FitText>
            </div>
          </Card>
        )}

        {filtered.length ? (
          <>
            <TransactionList transactions={filtered.slice(0, limit)} grouped />
            {filtered.length > limit && (
              <Button variant="secondary" block onClick={() => setLimit((l) => l + PAGE)}>
                Показати ще ({filtered.length - limit})
              </Button>
            )}
          </>
        ) : isEmptyData ? (
          <EmptyState
            icon={ReceiptText}
            title="Поки що немає операцій"
            description={'Додай першу витрату,\nщоб почати відстежувати фінанси.'}
            action={
              <Button icon={<Plus className="size-5" aria-hidden />} onClick={() => navigate('/add/expense')}>
                Додати витрату
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={SearchX}
            title="Нічого не знайдено"
            description="Спробуй змінити пошуковий запит або фільтри."
            action={
              hasAnyFilter && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setFilters(EMPTY_FILTERS)
                    setQuery('')
                  }}
                >
                  Скинути фільтри
                </Button>
              )
            }
          />
        )}
      </div>

      <FiltersSheet open={filtersOpen} onClose={() => setFiltersOpen(false)} value={filters} onApply={(f) => {
        setFilters(f)
        setLimit(PAGE)
      }} />
    </div>
  )
}

const TYPE_OPTIONS: Array<{ value: Filters['type']; label: string }> = [
  { value: '', label: 'Усі' },
  { value: 'expense', label: 'Витрати' },
  { value: 'income', label: 'Доходи' },
  { value: 'transfer', label: 'Перекази' },
  { value: 'debt_repayment', label: 'Повернення боргів' },
]

function FiltersSheet({ open, onClose, value, onApply }: { open: boolean; onClose: () => void; value: Filters; onApply: (f: Filters) => void }) {
  const { data } = useFinance()
  const [draft, setDraft] = useState(value)
  const [lastOpen, setLastOpen] = useState(open)
  if (open !== lastOpen) {
    setLastOpen(open)
    if (open) setDraft(value)
  }
  const set = (patch: Partial<Filters>) => setDraft((d) => ({ ...d, ...patch }))
  const now = new Date()
  const presets = [
    { label: '7 днів', from: toDateInput(addDays(now, -6)), to: toDateInput(now) },
    { label: 'Цей місяць', from: toDateInput(startOfMonth(now)), to: toDateInput(now) },
    { label: 'Минулий місяць', from: toDateInput(addMonths(now, -1)), to: toDateInput(endOfMonth(addMonths(now, -1))) },
    { label: 'Весь час', from: '', to: '' },
  ]

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Фільтри"
      footer={
        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={() => setDraft(EMPTY_FILTERS)}>
            Скинути
          </Button>
          <Button
            onClick={() => {
              onApply(draft)
              onClose()
            }}
          >
            Застосувати
          </Button>
        </div>
      }
    >
      <div className="space-y-5 pt-1">
        <fieldset className="min-w-0 space-y-2">
          <legend className="mb-2 text-sm font-medium text-muted">Дата</legend>
          <div className="flex flex-wrap gap-2">
            {presets.map((p) => (
              <button
                key={p.label}
                type="button"
                aria-pressed={draft.from === p.from && draft.to === p.to}
                onClick={() => set({ from: p.from, to: p.to })}
                className={cn(
                  'press h-9 rounded-full px-3.5 text-sm font-medium',
                  draft.from === p.from && draft.to === p.to ? 'bg-primary-soft text-primary' : 'bg-surface-2 text-muted',
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-2 min-[400px]:grid-cols-2">
            <TextField label="Від" type="date" value={draft.from} max={draft.to || undefined} onChange={(e) => set({ from: e.target.value })} />
            <TextField label="До" type="date" value={draft.to} min={draft.from || undefined} onChange={(e) => set({ to: e.target.value })} />
          </div>
        </fieldset>
        <ChipGroup<Filters['type']> label="Тип" value={draft.type} onChange={(type) => set({ type })} options={TYPE_OPTIONS} />
        <ChipGroup
          label="Категорія"
          value={draft.categoryId}
          onChange={(categoryId) => set({ categoryId })}
          options={[
            { value: '', label: 'Усі' },
            ...[...data.categories]
              .sort((x, y) => Number(x.type === 'income') - Number(y.type === 'income') || Number(x.isArchived) - Number(y.isArchived))
              .map((c) => ({ value: c.id, label: `${c.name}${c.isArchived ? ' (архів)' : ''}`, color: c.color })),
          ]}
        />
        <ChipGroup
          label="Рахунок"
          value={draft.accountId}
          onChange={(accountId) => set({ accountId })}
          options={[{ value: '', label: 'Усі' }, ...data.accounts.map((a) => ({ value: a.id, label: a.name }))]}
        />
        <fieldset className="min-w-0">
          <legend className="mb-2 text-sm font-medium text-muted">Сума, ₴</legend>
          <div className="grid grid-cols-2 gap-2">
            <TextField label="Від" inputMode="decimal" placeholder="0" value={draft.min} onChange={(e) => set({ min: e.target.value.replace(/[^\d.,]/g, '') })} />
            <TextField label="До" inputMode="decimal" placeholder="∞" value={draft.max} onChange={(e) => set({ max: e.target.value.replace(/[^\d.,]/g, '') })} />
          </div>
        </fieldset>
      </div>
    </Sheet>
  )
}
