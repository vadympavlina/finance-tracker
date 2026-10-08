import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Archive, ArchiveRestore, EyeOff, LayoutGrid, Plus } from 'lucide-react'
import type { Category, CategoryType } from '../types'
import { PageHeader } from '../components/common/PageHeader'
import { PeriodNav } from '../components/common/PeriodNav'
import { CategoryIcon } from '../components/common/CategoryIcon'
import { CategoryFormSheet } from '../components/categories/CategoryFormSheet'
import { Segmented } from '../components/ui/Tabs'
import { Button, IconButton } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { ProgressBar } from '../components/ui/ProgressBar'
import { EmptyState } from '../components/ui/EmptyState'
import { useFinance } from '../hooks/useFinance'
import { useToast } from '../hooks/useUI'
import { calculateCategoryTotals, type CategoryStat } from '../services/calculations'
import { addMonths, formatMonthYear, isSameMonth, monthRange } from '../utils/date'
import { formatMoney, formatPercent } from '../utils/format'
import { cn } from '../utils/cn'

type Tab = 'all' | CategoryType

interface Row {
  category: Category
  stat: CategoryStat | undefined
}

export default function CategoriesPage() {
  const { data, updateCategory } = useFinance()
  const toast = useToast()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('expense')
  const [month, setMonth] = useState(() => new Date())
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [showArchived, setShowArchived] = useState(false)

  const range = useMemo(() => monthRange(month), [month])
  const stats = useMemo(() => {
    const expense = calculateCategoryTotals(data.transactions, data.categories, 'expense', range)
    const income = calculateCategoryTotals(data.transactions, data.categories, 'income', range)
    return {
      expense,
      income,
      byId: new Map([...expense, ...income].filter((s) => s.categoryId).map((s) => [s.categoryId!, s])),
      totalExpense: expense.reduce((s, x) => s + x.amount, 0),
      totalIncome: income.reduce((s, x) => s + x.amount, 0),
    }
  }, [data.transactions, data.categories, range])

  const rows = (type: CategoryType): Row[] =>
    data.categories
      .filter((c) => c.type === type && !c.isArchived)
      .map((c) => ({ category: c, stat: stats.byId.get(c.id) }))
      .sort((a, b) => (b.stat?.amount ?? 0) - (a.stat?.amount ?? 0) || Number(a.category.isHidden) - Number(b.category.isHidden))

  const archived = data.categories.filter((c) => c.isArchived && (tab === 'all' || c.type === tab))

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const renderList = (type: CategoryType, withTitle: boolean) => {
    const list = rows(type)
    const total = type === 'expense' ? stats.totalExpense : stats.totalIncome
    return (
      <section key={type} aria-label={type === 'expense' ? 'Витрати' : 'Доходи'} className="space-y-2">
        {withTitle && (
          <div className="flex items-baseline justify-between px-1 pt-2">
            <h2 className="text-[1.0625rem] font-semibold">{type === 'expense' ? 'Витрати' : 'Доходи'}</h2>
            <span className={cn('tabular text-sm font-semibold', type === 'income' ? 'text-income' : 'text-muted')}>{formatMoney(total)}</span>
          </div>
        )}
        {list.length ? (
          <Card className="divide-y divide-border overflow-hidden">
            {list.map(({ category: c, stat }) => (
              <button
                key={c.id}
                type="button"
                onClick={() => navigate(`/categories/${c.id}${isSameMonth(month, new Date()) ? '' : `?m=${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`}`)}
                className="press flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-surface-2"
              >
                <CategoryIcon icon={c.icon} color={c.color} muted={c.isHidden} />
                <span className="min-w-0 flex-1 pt-0.5">
                  <span className="flex items-start justify-between gap-3">
                    <span className="flex min-w-0 items-center gap-1.5">
                      <span className="min-w-0 text-[0.9375rem] leading-snug font-semibold break-words">{c.name}</span>
                      {c.isHidden && <EyeOff className="size-3.5 shrink-0 text-subtle" aria-label="Прихована" />}
                    </span>
                    <span className="tabular shrink-0 text-[0.9375rem] leading-snug font-semibold whitespace-nowrap">{formatMoney(stat?.amount ?? 0)}</span>
                  </span>
                  <span className="mt-2 flex items-center gap-3">
                    <ProgressBar value={stat?.share ?? 0} color={c.color} size="sm" label={`${c.name}: ${formatPercent(stat?.share ?? 0)}`} />
                    <span className="tabular w-9 shrink-0 text-right text-xs text-muted">{formatPercent(stat?.share ?? 0)}</span>
                  </span>
                </span>
              </button>
            ))}
          </Card>
        ) : (
          <Card>
            <EmptyState compact icon={LayoutGrid} title="Немає категорій" description="Створи першу категорію." />
          </Card>
        )}
      </section>
    )
  }

  const canNext = !isSameMonth(month, new Date())

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Категорії"
        back navPage
        actions={
          <IconButton label="Створити категорію" variant="primary" onClick={openCreate}>
            <Plus className="size-5" aria-hidden />
          </IconButton>
        }
      />
      <div className="space-y-4">
        <Segmented<Tab>
          label="Тип категорій"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'all', label: 'Всі' },
            { value: 'expense', label: 'Витрати' },
            { value: 'income', label: 'Доходи' },
          ]}
        />
        <PeriodNav label={formatMonthYear(month)} onPrev={() => setMonth((m) => addMonths(m, -1))} onNext={() => setMonth((m) => addMonths(m, 1))} canNext={canNext} />

        {tab !== 'all' && (
          <Card className="flex items-center justify-between p-4">
            <span className="text-sm text-muted">{tab === 'expense' ? 'Усього витрат' : 'Усього доходів'}</span>
            <span className={cn('tabular text-xl font-bold', tab === 'income' && 'text-income')}>
              {formatMoney(tab === 'expense' ? stats.totalExpense : stats.totalIncome)}
            </span>
          </Card>
        )}

        {tab === 'all' ? [renderList('expense', true), renderList('income', true)] : renderList(tab, false)}

        {archived.length > 0 && (
          <section className="pt-2">
            <button
              type="button"
              aria-expanded={showArchived}
              onClick={() => setShowArchived((v) => !v)}
              className="press flex min-h-11 items-center gap-2 rounded-xl px-1 text-sm font-medium text-muted hover:text-text"
            >
              <Archive className="size-4" aria-hidden />
              Архівовані категорії ({archived.length})
            </button>
            {showArchived && (
              <Card className="mt-2 divide-y divide-border">
                {archived.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 px-4 py-3">
                    <CategoryIcon icon={c.icon} color={c.color} size="sm" muted />
                    <span className="min-w-0 flex-1">
                      <span className="block min-w-0 break-words text-[0.9375rem] font-medium">{c.name}</span>
                      <span className="block text-xs text-subtle">Архівована категорія</span>
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={<ArchiveRestore className="size-4" aria-hidden />}
                      onClick={() => {
                        updateCategory(c.id, { isArchived: false })
                        toast('Категорію відновлено')
                      }}
                    >
                      Відновити
                    </Button>
                  </div>
                ))}
              </Card>
            )}
          </section>
        )}
      </div>

      <CategoryFormSheet open={formOpen} onClose={() => setFormOpen(false)} category={editing} defaultType={tab === 'income' ? 'income' : 'expense'} />
    </div>
  )
}
