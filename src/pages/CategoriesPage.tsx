import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Archive, ArchiveRestore, Eye, EyeOff, LayoutGrid, List, Pencil, Plus, Trash2 } from 'lucide-react'
import type { Category, CategoryType } from '../types'
import { PageHeader } from '../components/common/PageHeader'
import { PeriodNav } from '../components/common/PeriodNav'
import { CategoryIcon } from '../components/common/CategoryIcon'
import { CategoryFormSheet } from '../components/categories/CategoryFormSheet'
import { Segmented } from '../components/ui/Tabs'
import { Button, IconButton } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { ProgressBar } from '../components/ui/ProgressBar'
import { Sheet } from '../components/ui/Sheet'
import { EmptyState } from '../components/ui/EmptyState'
import { useFinance } from '../hooks/useFinance'
import { useConfirm, useToast } from '../hooks/useUI'
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
  const { data, updateCategory, deleteCategory } = useFinance()
  const confirm = useConfirm()
  const toast = useToast()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('expense')
  const [month, setMonth] = useState(() => new Date())
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [selected, setSelected] = useState<Category | null>(null)
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

  const onDelete = async (c: Category) => {
    const used = data.transactions.some((t) => t.categoryId === c.id)
    const ok = await confirm({
      title: `Видалити «${c.name}»?`,
      message: used
        ? 'Категорія має операції, тому вона стане архівованою: історія збережеться, але обрати її для нових операцій буде неможливо. Бюджет категорії буде видалено.'
        : 'Категорію буде видалено назавжди.',
      confirmLabel: 'Видалити',
      danger: true,
    })
    if (!ok) return
    const result = deleteCategory(c.id)
    setSelected(null)
    toast(result === 'archived' ? 'Категорію архівовано' : 'Категорію видалено')
  }

  const renderList = (type: CategoryType, withTitle: boolean) => {
    const list = rows(type)
    const total = type === 'expense' ? stats.totalExpense : stats.totalIncome
    return (
      <section key={type} aria-label={type === 'expense' ? 'Витрати' : 'Доходи'} className="space-y-2">
        {withTitle && (
          <div className="flex items-baseline justify-between px-1 pt-2">
            <h2 className="text-[17px] font-semibold">{type === 'expense' ? 'Витрати' : 'Доходи'}</h2>
            <span className={cn('tabular text-sm font-semibold', type === 'income' ? 'text-income' : 'text-muted')}>{formatMoney(total)}</span>
          </div>
        )}
        {list.length ? (
          <Card className="divide-y divide-border overflow-hidden">
            {list.map(({ category: c, stat }) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelected(c)}
                className="press flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface-2"
              >
                <CategoryIcon icon={c.icon} color={c.color} muted={c.isHidden} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="truncate text-[15px] font-semibold">{c.name}</span>
                    {c.isHidden && <EyeOff className="size-3.5 shrink-0 text-subtle" aria-label="Прихована" />}
                  </span>
                  <ProgressBar value={stat?.share ?? 0} color={c.color} size="sm" className="mt-2" label={`${c.name}: ${formatPercent(stat?.share ?? 0)}`} />
                </span>
                <span className="w-24 shrink-0 text-right">
                  <span className="tabular block text-[15px] font-semibold">{formatMoney(stat?.amount ?? 0)}</span>
                  <span className="tabular block text-xs text-muted">{formatPercent(stat?.share ?? 0)}</span>
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
                      <span className="block truncate text-[15px] font-medium">{c.name}</span>
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

      {/* Category actions */}
      <Sheet open={!!selected} onClose={() => setSelected(null)} title={selected?.name ?? ''} size="sm">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-2xl bg-surface-2 p-3">
              <CategoryIcon icon={selected.icon} color={selected.color} size="lg" />
              <div>
                <p className="tabular text-xl font-bold">{formatMoney(stats.byId.get(selected.id)?.amount ?? 0)}</p>
                <p className="text-sm text-muted">
                  {formatMonthYear(month)} · {stats.byId.get(selected.id)?.count ?? 0} операцій
                </p>
              </div>
            </div>
            <div className="grid gap-2">
              <ActionRow icon={List} label="Переглянути операції" onClick={() => navigate(`/history?category=${selected.id}`)} />
              <ActionRow
                icon={Pencil}
                label="Редагувати"
                onClick={() => {
                  setEditing(selected)
                  setSelected(null)
                  setFormOpen(true)
                }}
              />
              <ActionRow
                icon={selected.isHidden ? Eye : EyeOff}
                label={selected.isHidden ? 'Показувати при виборі' : 'Приховати з вибору'}
                onClick={() => {
                  updateCategory(selected.id, { isHidden: !selected.isHidden })
                  toast(selected.isHidden ? 'Категорію показано' : 'Категорію приховано')
                  setSelected(null)
                }}
              />
              <ActionRow icon={Trash2} label="Видалити" danger onClick={() => onDelete(selected)} />
            </div>
          </div>
        )}
      </Sheet>

      <CategoryFormSheet open={formOpen} onClose={() => setFormOpen(false)} category={editing} defaultType={tab === 'income' ? 'income' : 'expense'} />
    </div>
  )
}

function ActionRow({ icon: Icon, label, onClick, danger }: { icon: typeof List; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn('press flex min-h-12 w-full items-center gap-3 rounded-2xl px-3 text-left text-[15px] font-medium hover:bg-surface-2', danger && 'text-expense')}
    >
      <Icon className="size-5" aria-hidden />
      {label}
    </button>
  )
}
