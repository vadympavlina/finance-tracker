import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, ReceiptText, Settings } from 'lucide-react'
import { useFinance } from '../hooks/useFinance'
import { useFinanceStats } from '../hooks/useFinanceStats'
import { BalanceCard } from '../components/dashboard/BalanceCard'
import { MonthCard } from '../components/dashboard/MonthCard'
import { QuickActions } from '../components/dashboard/QuickActions'
import { AccountsStrip } from '../components/dashboard/AccountsStrip'
import { Reminders } from '../components/dashboard/Reminders'
import { TransactionList } from '../components/transactions/TransactionList'
import { BudgetCard } from '../components/budgets/BudgetCard'
import { GoalCard } from '../components/goals/GoalCard'
import { BarChart } from '../components/analytics/BarChart'
import { Card, Section } from '../components/ui/Card'
import { Button, IconButton } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { buildSeries, calculateGoalProgress, calculateMonthSummary, getPeriodRange } from '../services/calculations'
import { formatMoney, initials } from '../utils/format'
import { FitText } from '../components/ui/FitText'

const todayLabel = () =>
  new Intl.DateTimeFormat('uk-UA', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())

export default function DashboardPage() {
  const { data, updateSettings } = useFinance()
  const stats = useFinanceStats()
  const navigate = useNavigate()
  const hidden = data.settings.hideBalance

  const series = useMemo(
    () => buildSeries(data.transactions, data.accounts, 'expense', 'month', getPeriodRange('month')),
    [data.transactions, data.accounts],
  )
  const monthSummary = useMemo(() => calculateMonthSummary(data.transactions, data.accounts), [data.transactions, data.accounts])
  const topGoals = useMemo(
    () =>
      data.goals
        .map((g) => calculateGoalProgress(g))
        .sort((a, b) => Number(a.isCompleted) - Number(b.isCompleted) || b.percent - a.percent)
        .slice(0, 2),
    [data.goals],
  )

  return (
    <div className="space-y-6 pt-2 lg:pt-0">
      {/* Greeting */}
      <header className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[0.8125rem] font-medium text-muted first-letter:uppercase">{todayLabel()}</p>
          <h1 className="mt-0.5 min-w-0 break-words text-[clamp(1.375rem,7.5vw,1.625rem)] leading-tight font-bold tracking-[-0.02em] lg:text-3xl">{data.settings.userName.trim() || 'Мої фінанси'}</h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <IconButton label="Налаштування" onClick={() => navigate('/settings')}>
            <Settings className="size-5" aria-hidden />
          </IconButton>
          <Link
            to="/profile"
            aria-label="Профіль"
            className="press grid size-11 place-items-center rounded-full bg-ink text-[0.8125rem] font-bold text-on-ink lg:hidden"
          >
            {initials(data.settings.fullName || data.settings.userName)}
          </Link>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        {/* Left column */}
        <div className="min-w-0 space-y-6">
          <div className="space-y-4">
            <BalanceCard
              balance={stats.balance}
              change={stats.balanceChange}
              delta={stats.balanceDelta}
              hidden={hidden}
              onToggleHidden={() => updateSettings({ hideBalance: !hidden })}
            />
            <QuickActions />
          </div>

          <MonthCard summary={monthSummary} debtTotal={stats.debt.total} overdueCount={stats.debt.overdueCount} />

          <Reminders />

          <Section title="Рахунки" action={{ label: 'Керувати', to: '/accounts' }}>
            <AccountsStrip items={stats.accountBalances} hidden={hidden} />
          </Section>

          <Section title="Останні операції" action={stats.recent.length ? { label: 'Дивитись всі', to: '/history' } : undefined}>
            <Card className="p-2 sm:p-3">
              {stats.recent.length ? (
                <div className="px-2">
                  <TransactionList transactions={stats.recent} />
                </div>
              ) : (
                <EmptyState
                  compact
                  icon={ReceiptText}
                  title="Поки що немає витрат"
                  description={'Додай першу витрату,\nщоб почати відстежувати фінанси.'}
                  action={
                    <Button icon={<Plus className="size-5" aria-hidden />} onClick={() => navigate('/add/expense')}>
                      Додати витрату
                    </Button>
                  }
                />
              )}
            </Card>
          </Section>
        </div>

        {/* Right column */}
        <div className="min-w-0 space-y-6">
          <Section title="Динаміка витрат" action={{ label: 'Аналітика', to: '/analytics' }}>
            <Card className="p-4">
              <div className="mb-2 flex items-baseline justify-between gap-2">
                <p className="text-sm text-muted">Цього місяця</p>
                <FitText as="p" className="tabular text-lg font-bold">{formatMoney(stats.monthly.expenses)}</FitText>
              </div>
              <BarChart data={series} color="var(--primary)" height={190} label="Витрати за останні 6 місяців" />
            </Card>
          </Section>

          <Section title="Бюджет" action={{ label: stats.budgetProgress ? 'Усі бюджети' : 'Створити', to: '/budgets' }}>
            {stats.budgetProgress ? (
              <BudgetCard progress={stats.budgetProgress} category={null} onClick={() => navigate('/budgets')} />
            ) : (
              <Card className="flex items-center justify-between gap-3 p-4">
                <p className="text-sm text-muted">Встанови місячний бюджет, щоб контролювати витрати.</p>
                <Button size="sm" variant="soft" onClick={() => navigate('/budgets?new=1')}>
                  Створити
                </Button>
              </Card>
            )}
          </Section>

          <Section title="Цілі" action={{ label: data.goals.length ? 'Усі цілі' : 'Створити', to: '/goals' }}>
            {topGoals.length ? (
              <div className="grid gap-3">
                {topGoals.map((p) => (
                  <GoalCard key={p.goal.id} progress={p} compact onClick={() => navigate(`/goals?goal=${p.goal.id}`)} />
                ))}
              </div>
            ) : (
              <Card className="flex items-center justify-between gap-3 p-4">
                <p className="text-sm text-muted">Постав фінансову ціль і відстежуй прогрес.</p>
                <Button size="sm" variant="soft" onClick={() => navigate('/goals?new=1')}>
                  Нова ціль
                </Button>
              </Card>
            )}
          </Section>
        </div>
      </div>

    </div>
  )
}
