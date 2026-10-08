import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ChartPie, Flag, PiggyBank, Receipt, TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import { PageHeader } from '../components/common/PageHeader'
import { PeriodNav } from '../components/common/PeriodNav'
import { TrendBadge } from '../components/common/TrendBadge'
import { CategoryIcon } from '../components/common/CategoryIcon'
import { BarChart } from '../components/analytics/BarChart'
import { DonutChart } from '../components/analytics/DonutChart'
import { LineChart } from '../components/analytics/LineChart'
import { Segmented } from '../components/ui/Tabs'
import { Card, Section } from '../components/ui/Card'
import { ProgressBar } from '../components/ui/ProgressBar'
import { EmptyState } from '../components/ui/EmptyState'
import { useFinance, useLookups } from '../hooks/useFinance'
import {
  buildSeries,
  calculateBalanceSummary,
  calculateFlowSummary,
  calculateGoalProgress,
  categoryStructure,
  formatPeriodLabel,
  getPeriodRange,
  previousRange,
  type AnalyticsMetric,
  type AnalyticsPeriod,
} from '../services/calculations'
import { formatDayMonth } from '../utils/date'
import { formatMoney, formatPercent, formatSignedMoney } from '../utils/format'
import { cn } from '../utils/cn'
import { FitText } from '../components/ui/FitText'

const PERIOD_WORD: Record<AnalyticsPeriod, string> = { week: 'тиждень', month: 'місяць', year: 'рік' }
const DYNAMICS_HINT: Record<AnalyticsPeriod, string> = { week: 'по днях', month: 'останні 6 місяців', year: 'по місяцях' }

export default function AnalyticsPage() {
  const [params, setParams] = useSearchParams()
  const initialTab = (params.get('tab') as AnalyticsMetric) || 'expense'
  const [metric, setMetric] = useState<AnalyticsMetric>(['expense', 'income', 'balance'].includes(initialTab) ? initialTab : 'expense')
  const [period, setPeriod] = useState<AnalyticsPeriod>('month')
  const [offset, setOffset] = useState(0)

  const range = useMemo(() => getPeriodRange(period, offset), [period, offset])

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Аналітика" />
      <div className="space-y-4">
        <Segmented<AnalyticsMetric>
          label="Показник"
          value={metric}
          onChange={(m) => {
            setMetric(m)
            setParams(m === 'expense' ? {} : { tab: m }, { replace: true })
          }}
          options={[
            { value: 'expense', label: 'Витрати' },
            { value: 'income', label: 'Доходи' },
            { value: 'balance', label: 'Баланс' },
          ]}
        />
        <div className="grid gap-3 sm:grid-cols-[minmax(0,280px)_minmax(0,1fr)]">
          <Segmented<AnalyticsPeriod>
            label="Період"
            size="sm"
            value={period}
            onChange={(p) => {
              setPeriod(p)
              setOffset(0)
            }}
            options={[
              { value: 'week', label: 'Тиждень' },
              { value: 'month', label: 'Місяць' },
              { value: 'year', label: 'Рік' },
            ]}
            className=""
          />
          <PeriodNav label={formatPeriodLabel(period, range)} onPrev={() => setOffset((o) => o - 1)} onNext={() => setOffset((o) => Math.min(0, o + 1))} canNext={offset < 0} />
        </div>

        {metric === 'balance' ? (
          <BalanceView period={period} offset={offset} />
        ) : (
          <FlowView key={metric} type={metric} period={period} offset={offset} />
        )}
      </div>
    </div>
  )
}

function FlowView({ type, period, offset }: { type: 'expense' | 'income'; period: AnalyticsPeriod; offset: number }) {
  const { data } = useFinance()
  const { categoryById } = useLookups()
  const range = useMemo(() => getPeriodRange(period, offset), [period, offset])

  const { summary, series, structure } = useMemo(() => {
    const prev = previousRange(period, offset)
    return {
      summary: calculateFlowSummary(data.transactions, type, range, prev),
      series: buildSeries(data.transactions, data.accounts, type, period, range),
      structure: categoryStructure(data.transactions, data.categories, type, range),
    }
  }, [data.transactions, data.accounts, data.categories, type, period, offset, range])

  const isExpense = type === 'expense'
  const color = isExpense ? 'var(--primary)' : 'var(--income)'
  const largestCategory = summary.largest?.categoryId ? categoryById.get(summary.largest.categoryId) : undefined

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Card className="col-span-2 p-4 lg:col-span-1">
          <p className="text-sm text-muted">{isExpense ? 'Загальні витрати' : 'Загальні доходи'}</p>
          <FitText as="p" className={cn('tabular mt-1 text-[1.75rem] leading-tight font-bold tracking-tight', !isExpense && 'text-income')}>{formatMoney(summary.total)}</FitText>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
            <TrendBadge value={summary.change} inverse={isExpense} />
            {summary.change !== null && <span className="min-w-0 break-words">порівняно з тим самим часом минулого періоду</span>}
          </div>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted">{isExpense ? 'Середній чек' : 'Середній дохід'}</p>
          <FitText as="p" className="tabular mt-1 text-xl font-bold">{formatMoney(Math.round(summary.average))}</FitText>
          <div className="mt-2">
            <TrendBadge value={summary.averageChange} inverse={isExpense} />
          </div>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted">{isExpense ? 'Найбільша витрата' : 'Найбільший дохід'}</p>
          <FitText as="p" className="tabular mt-1 text-xl font-bold">{formatMoney(summary.largest?.amount ?? 0)}</FitText>
          <p className="mt-2 min-w-0 break-words text-xs text-muted">
            {summary.largest
              ? `${summary.largest.merchant || largestCategory?.name || ''} · ${formatDayMonth(summary.largest.date)}`
              : `${summary.count} операцій`}
          </p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title={isExpense ? 'Динаміка витрат' : 'Динаміка доходів'}>
          <Card className="p-4">
            <p className="mb-2 text-xs text-muted">{DYNAMICS_HINT[period]}</p>
            <BarChart data={series} color={color} label={`${isExpense ? 'Витрати' : 'Доходи'} ${DYNAMICS_HINT[period]}`} />
          </Card>
        </Section>

        <Section title={isExpense ? 'Структура витрат' : 'Джерела доходів'}>
          <Card className="@container p-4">
            {structure.slices.length ? (
              <div className="flex flex-col items-center gap-5 @[460px]:flex-row @[460px]:items-center">
                <DonutChart
                  slices={structure.slices}
                  total={summary.total}
                  centerLabel={`За ${PERIOD_WORD[period]}`}
                  label={`Структура ${isExpense ? 'витрат' : 'доходів'} за категоріями`}
                />
                <ul className="w-full min-w-0 flex-1 space-y-2.5">
                  {structure.slices.map((s) => (
                    <li key={s.id} className="flex items-center gap-2.5 text-sm">
                      <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: s.color }} aria-hidden />
                      <span className="min-w-0 flex-1 break-words">{s.name}</span>
                      <span className="tabular font-semibold">{formatPercent(s.share)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <EmptyState
                compact
                icon={ChartPie}
                title={isExpense ? 'Немає витрат за цей період' : 'Немає доходів за цей період'}
                description="Обери інший період або додай операцію."
              />
            )}
          </Card>
        </Section>
      </div>

      {structure.stats.length > 0 && (
        <Section title="За категоріями">
          <Card className="divide-y divide-border overflow-hidden">
            {structure.stats.map((s) => (
              <Link
                key={s.categoryId ?? 'none'}
                to={s.categoryId ? `/history?category=${s.categoryId}` : '/history'}
                className="press flex items-center gap-3 px-4 py-3 hover:bg-surface-2"
              >
                <CategoryIcon icon={s.category?.icon ?? 'package'} color={s.category?.color ?? '#94A3B8'} size="sm" muted={s.category?.isArchived} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="min-w-0 break-words text-[0.9375rem] font-medium">{s.category?.name ?? 'Без категорії'}</span>
                    <span className="tabular text-[0.9375rem] font-semibold">{formatMoney(s.amount)}</span>
                  </span>
                  <span className="mt-1.5 flex items-center gap-2">
                    <ProgressBar value={s.share} color={s.category?.color} size="sm" label={`${s.category?.name}: ${formatPercent(s.share)}`} />
                    <span className="tabular w-10 shrink-0 text-right text-xs text-muted">{formatPercent(s.share)}</span>
                  </span>
                </span>
              </Link>
            ))}
          </Card>
          <p className="px-1 text-xs text-subtle">
            Перекази між рахунками та повернення боргів не враховуються як доходи чи витрати.
          </p>
        </Section>
      )}
    </div>
  )
}

function BalanceView({ period, offset }: { period: AnalyticsPeriod; offset: number }) {
  const { data } = useFinance()
  const range = useMemo(() => getPeriodRange(period, offset), [period, offset])
  const { summary, series, goals } = useMemo(
    () => ({
      summary: calculateBalanceSummary(data.transactions, data.accounts, data.goals, range),
      series: buildSeries(data.transactions, data.accounts, 'balance', period, range),
      goals: data.goals.map((g) => calculateGoalProgress(g)),
    }),
    [data.transactions, data.accounts, data.goals, range, period],
  )
  const change = summary.closing - summary.opening
  const maxFlow = Math.max(summary.income, summary.expenses, 1)

  const tiles = [
    { label: 'Баланс на кінець', value: formatMoney(summary.closing), icon: Wallet, tone: 'bg-primary-soft text-primary' },
    {
      label: 'Зміна балансу',
      value: formatSignedMoney(change),
      icon: change >= 0 ? TrendingUp : TrendingDown,
      tone: change >= 0 ? 'bg-income-soft text-income' : 'bg-expense-soft text-expense',
    },
    {
      label: 'Норма заощаджень',
      value: summary.savingsRate === null ? '—' : formatPercent(summary.savingsRate),
      icon: PiggyBank,
      tone: 'bg-mint-soft text-mint',
    },
    { label: 'Відкладено в цілі', value: formatMoney(summary.goalSavings), icon: Flag, tone: 'bg-info-soft text-info' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((t) => (
          <Card key={t.label} className="p-4">
            <span className={cn('grid size-9 place-items-center rounded-full', t.tone)}>
              <t.icon className="size-[18px]" aria-hidden />
            </span>
            <p className="mt-3 text-[0.8125rem] text-muted">{t.label}</p>
            <FitText as="p" className="tabular mt-0.5 text-lg font-bold">{t.value}</FitText>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Section title="Динаміка балансу">
          <Card className="p-4">
            <p className="mb-2 text-xs text-muted">Баланс на кінець кожного проміжку · {DYNAMICS_HINT[period]}</p>
            <LineChart data={series} color="var(--primary)" label="Динаміка загального балансу" />
          </Card>
        </Section>

        <Section title="Доходи vs витрати">
          <Card className="space-y-4 p-4">
            {[
              { label: 'Доходи', value: summary.income, color: 'var(--income)' },
              { label: 'Витрати', value: summary.expenses, color: 'var(--expense)' },
            ].map((r) => (
              <div key={r.label}>
                <div className="mb-1.5 flex items-baseline justify-between text-sm">
                  <span className="text-muted">{r.label}</span>
                  <span className="tabular font-semibold">{formatMoney(r.value)}</span>
                </div>
                <ProgressBar value={(r.value / maxFlow) * 100} color={r.color} size="lg" label={r.label} />
              </div>
            ))}
            <div className="flex items-baseline justify-between border-t border-border pt-3 text-sm">
              <span className="text-muted">Рух коштів (з боргами)</span>
              <span className={cn('tabular font-bold', summary.netFlow >= 0 ? 'text-income' : 'text-expense')}>{formatSignedMoney(summary.netFlow)}</span>
            </div>
          </Card>
        </Section>
      </div>

      <Section title="Прогрес цілей" action={{ label: 'Усі цілі', to: '/goals' }}>
        {goals.length ? (
          <Card className="space-y-4 p-4">
            {goals.map((g) => (
              <div key={g.goal.id}>
                <div className="mb-1.5 flex items-baseline justify-between gap-2 text-sm">
                  <span className="min-w-0 break-words font-medium">{g.goal.name}</span>
                  <span className="tabular shrink-0 text-muted">
                    {formatMoney(g.current)} · <span className="font-semibold text-text">{formatPercent(g.percent)}</span>
                  </span>
                </div>
                <ProgressBar value={g.percent} color={g.goal.color} label={g.goal.name} />
              </div>
            ))}
          </Card>
        ) : (
          <Card>
            <EmptyState compact icon={Receipt} title="Ще немає цілей" description="Створи ціль, щоб бачити прогрес накопичень." />
          </Card>
        )}
      </Section>
    </div>
  )
}
