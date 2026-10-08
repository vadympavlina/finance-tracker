import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Wallet } from 'lucide-react'
import type { Budget } from '../types'
import { PageHeader } from '../components/common/PageHeader'
import { BudgetCard } from '../components/budgets/BudgetCard'
import { BudgetFormSheet } from '../components/budgets/BudgetFormSheet'
import { Button, IconButton } from '../components/ui/Button'
import { Card, Section } from '../components/ui/Card'
import { ProgressBar } from '../components/ui/ProgressBar'
import { EmptyState } from '../components/ui/EmptyState'
import { useFinance, useLookups } from '../hooks/useFinance'
import { calculateBudgetProgress } from '../services/calculations'
import { formatMonthYear } from '../utils/date'
import { formatMoney, formatPercent } from '../utils/format'
import { cn } from '../utils/cn'
import { FitText } from '../components/ui/FitText'

export default function BudgetsPage() {
  const { data } = useFinance()
  const { categoryById } = useLookups()
  const [params, setParams] = useSearchParams()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Budget | null>(null)

  useEffect(() => {
    if (params.get('new')) {
      setEditing(null)
      setFormOpen(true)
      setParams({}, { replace: true })
    }
  }, [params, setParams])

  const { total, categories, custom } = useMemo(() => {
    const now = new Date()
    const all = data.budgets.map((b) => calculateBudgetProgress(b, data.transactions, now))
    return {
      total: all.find((p) => p.budget.categoryId === null && p.budget.period === 'month') ?? null,
      categories: all.filter((p) => p.budget.categoryId !== null && p.budget.period === 'month').sort((a, b) => b.percent - a.percent),
      custom: all.filter((p) => p.budget.period === 'custom'),
    }
  }, [data.budgets, data.transactions])

  const open = (b: Budget | null) => {
    setEditing(b)
    setFormOpen(true)
  }

  const statusColor = (s: 'ok' | 'warning' | 'exceeded') => (s === 'exceeded' ? 'text-expense' : s === 'warning' ? 'text-warning' : 'text-text')

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Бюджет"
        subtitle={formatMonthYear(new Date())}
        back
        actions={
          <IconButton label="Створити бюджет" variant="primary" onClick={() => open(null)}>
            <Plus className="size-5" aria-hidden />
          </IconButton>
        }
      />

      {data.budgets.length === 0 ? (
        <Card>
          <EmptyState
            icon={Wallet}
            title="Ще немає бюджетів"
            description={'Встанови ліміт на місяць або на категорію —\nі ми підкажемо, коли наближаєшся до межі.'}
            action={
              <Button icon={<Plus className="size-5" aria-hidden />} onClick={() => open(null)}>
                Створити бюджет
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="space-y-6">
          {total ? (
            <button
              type="button"
              onClick={() => open(total.budget)}
              className="press w-full rounded-[26px] bg-surface p-5 text-left shadow-card hover:border-border-strong"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-muted">Місячний бюджет</p>
                  <FitText as="p" className="tabular mt-1 text-[30px] leading-tight font-bold tracking-tight">{formatMoney(total.budget.amount)}</FitText>
                </div>
                <span className={cn('tabular rounded-full bg-surface-2 px-3 py-1 text-lg font-bold', statusColor(total.status))}>{formatPercent(total.percent)}</span>
              </div>
              <ProgressBar value={total.percent} status={total.status} size="lg" className="mt-4" label={`Місячний бюджет: ${formatPercent(total.percent)}`} />
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-surface-2 p-3">
                  <p className="text-xs text-muted">Витрачено</p>
                  <FitText as="p" className="tabular text-[17px] font-bold">{formatMoney(total.spent)}</FitText>
                </div>
                <div className={cn('rounded-2xl p-3', total.status === 'exceeded' ? 'bg-expense-soft' : 'bg-surface-2')}>
                  <p className="text-xs text-muted">{total.status === 'exceeded' ? 'Перевищено на' : 'Залишилось'}</p>
                  <FitText as="p" className={cn('tabular text-[17px] font-bold', total.status === 'exceeded' ? 'text-expense' : 'text-income')}>
                    {formatMoney(Math.abs(total.remaining))}
                  </FitText>
                </div>
              </div>
              {total.status === 'exceeded' && <p className="mt-3 text-sm font-semibold text-expense">Перевищено бюджет</p>}
            </button>
          ) : (
            <Card className="flex items-center justify-between gap-3 p-4">
              <p className="text-sm text-muted">Немає загального місячного бюджету.</p>
              <Button size="sm" variant="soft" onClick={() => open(null)}>
                Додати
              </Button>
            </Card>
          )}

          <Section title="Бюджети категорій">
            {categories.length ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {categories.map((p) => (
                  <BudgetCard key={p.budget.id} progress={p} category={categoryById.get(p.budget.categoryId!) ?? null} onClick={() => open(p.budget)} />
                ))}
              </div>
            ) : (
              <Card>
                <EmptyState compact icon={Wallet} title="Немає бюджетів категорій" description="Обмеж витрати на окремі категорії, наприклад «Кава»." />
              </Card>
            )}
          </Section>

          {custom.length > 0 && (
            <Section title="Бюджети на період">
              <div className="grid gap-3 sm:grid-cols-2">
                {custom.map((p) => (
                  <BudgetCard key={p.budget.id} progress={p} category={p.budget.categoryId ? (categoryById.get(p.budget.categoryId) ?? null) : null} onClick={() => open(p.budget)} />
                ))}
              </div>
            </Section>
          )}

          <Button block size="lg" variant="soft" icon={<Plus className="size-5" aria-hidden />} onClick={() => open(null)}>
            Створити бюджет
          </Button>
        </div>
      )}

      <BudgetFormSheet open={formOpen} onClose={() => setFormOpen(false)} budget={editing} />
    </div>
  )
}
