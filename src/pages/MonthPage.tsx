import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowUpRight, ChevronRight, Minus, Plus, Wallet } from 'lucide-react'
import { PageHeader } from '../components/common/PageHeader'
import { PeriodNav } from '../components/common/PeriodNav'
import { CategoryIcon } from '../components/common/CategoryIcon'
import { TransactionList } from '../components/transactions/TransactionList'
import { MoneyEntrySheet } from '../components/month/MoneyEntrySheet'
import { Card, Section } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { FitText } from '../components/ui/FitText'
import { ProgressBar } from '../components/ui/ProgressBar'
import { EmptyState } from '../components/ui/EmptyState'
import { useFinance } from '../hooks/useFinance'
import { calculateCategoryTotals, calculateMonthSummary, filterByRange, sortByDateDesc } from '../services/calculations'
import { addMonths, formatMonthName, formatMonthYear, isSameMonth } from '../utils/date'
import { formatMoney, formatPercent, formatSignedMoney } from '../utils/format'
import { cn } from '../utils/cn'

const parseMonth = (value: string | null): Date => {
  if (value && /^\d{4}-\d{2}$/.test(value)) {
    const [y, m] = value.split('-').map(Number)
    return new Date(y, m - 1, 1)
  }
  return new Date()
}
const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`

/** The month at a glance: how much there was, how much came in, how much was spent, what is left. */
export default function MonthPage() {
  const { data } = useFinance()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const month = parseMonth(params.get('m'))
  const isCurrent = isSameMonth(month, new Date())
  const setMonth = (d: Date) => setParams(isSameMonth(d, new Date()) ? {} : { m: monthKey(d) }, { replace: true })
  const [entry, setEntry] = useState<'add' | 'subtract' | null>(null)

  const { summary, received, categories } = useMemo(() => {
    const s = calculateMonthSummary(data.transactions, data.accounts, month)
    const inMonth = filterByRange(data.transactions, s.range)
    return {
      summary: s,
      received: sortByDateDesc(inMonth.filter((t) => t.type === 'income' || t.type === 'adjustment')),
      categories: calculateCategoryTotals(data.transactions, data.categories, 'expense', s.range),
    }
  }, [data.transactions, data.accounts, data.categories, month.getFullYear(), month.getMonth()]) // eslint-disable-line react-hooks/exhaustive-deps

  const overspent = summary.received > 0 && summary.expenses > summary.received
  const monthName = formatMonthName(month)
  const mParam = isCurrent ? '' : `?m=${monthKey(month)}`

  const rows: Array<{ label: string; value: string; tone?: string }> = [
    { label: 'Було на початку', value: formatMoney(summary.opening) },
    { label: 'Отримано', value: formatSignedMoney(summary.received), tone: 'text-[#7ee2b8]' },
    { label: 'Витрачено', value: formatSignedMoney(-summary.expenses), tone: 'text-[#ffb3a3]' },
  ]
  const debtsNet = summary.debtsIn - summary.debtsOut
  if (debtsNet !== 0) rows.push({ label: 'Борги (повернення)', value: formatSignedMoney(debtsNet) })

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Місяць" subtitle={formatMonthYear(month)} />
      <div className="space-y-5">
        <PeriodNav label={formatMonthYear(month)} onPrev={() => setMonth(addMonths(month, -1))} onNext={() => setMonth(addMonths(month, 1))} canNext={!isCurrent} />

        {/* Hero */}
        <section aria-label={`Підсумок: ${monthName}`} className="@container relative isolate overflow-hidden rounded-[32px] bg-[#121a17] p-5 text-[#f3f2ed] ring-1 ring-white/5 sm:p-6">
          <div className="pointer-events-none absolute -right-28 -bottom-36 -z-10 size-[22rem] rounded-full bg-[radial-gradient(circle,rgb(var(--accent-rgb)/0.45),rgb(var(--accent-rgb)/0)_65%)]" aria-hidden />
          <p className="text-[0.8125rem] font-medium text-white/65">{isCurrent ? 'Залишилось зараз' : `Залишилось на кінець місяця`}</p>
          <FitText as="p" className="tabular mt-1 text-[2.5rem] leading-none font-semibold tracking-[-0.03em]" min={0.45}>
            {formatMoney(summary.closing)}
          </FitText>

          <dl className="mt-5 grid grid-cols-1 gap-2 @[420px]:grid-cols-3">
            {rows.map((r) => (
              <div key={r.label} className="flex min-w-0 items-baseline justify-between gap-3 rounded-2xl bg-white/[0.07] px-3.5 py-2.5 @[420px]:block">
                <dt className="text-[0.8125rem] text-white/65">{r.label}</dt>
                <dd className="min-w-0">
                  <FitText className={cn('tabular text-right text-[1.0625rem] font-semibold @[420px]:text-left', r.tone)}>{r.value}</FitText>
                </dd>
              </div>
            ))}
          </dl>

          {summary.received > 0 && (
            <div className="mt-4">
              <ProgressBar
                value={summary.spentShare ?? 0}
                color={overspent ? '#ff8a73' : 'rgb(var(--accent-rgb))'}
                trackClassName="bg-white/15"
                label="Частка витраченого від отриманого"
              />
              <p className="mt-2 text-[0.8125rem] leading-snug text-white/70">
                {overspent
                  ? `Витрачено більше, ніж отримано, на ${formatMoney(summary.expenses - summary.received)}`
                  : `Витрачено ${formatPercent(summary.spentShare ?? 0)} від отриманого · вільно ${formatMoney(summary.received - summary.expenses)}`}
              </p>
            </div>
          )}
        </section>

        {/* Actions */}
        <div className="grid grid-cols-1 gap-2.5 min-[360px]:grid-cols-3">
          <Button size="lg" className="px-3" icon={<Plus className="size-5" aria-hidden />} onClick={() => setEntry('add')}>
            Додати
          </Button>
          <Button size="lg" variant="secondary" className="px-3" icon={<Minus className="size-5" aria-hidden />} onClick={() => setEntry('subtract')}>
            Відняти
          </Button>
          <Button size="lg" variant="secondary" className="px-3" icon={<ArrowUpRight className="size-5" aria-hidden />} onClick={() => navigate('/add/expense')}>
            Витрата
          </Button>
        </div>

        <Section title="Отримано" action={received.length ? { label: 'Аналітика доходів', to: '/analytics?tab=income' } : undefined}>
          <Card className="p-2 sm:p-3">
            {received.length ? (
              <div className="px-2">
                <TransactionList transactions={received} />
              </div>
            ) : (
              <EmptyState
                compact
                icon={Wallet}
                title={`За ${monthName.toLowerCase()} ще нічого не отримано`}
                description="Натисни «Додати», щоб записати зарплату, аванс чи інші гроші."
              />
            )}
          </Card>
        </Section>

        <Section title="Витрати за категоріями" action={{ label: 'Усі категорії', to: '/categories' }}>
          {categories.length ? (
            <Card className="divide-y divide-border overflow-hidden">
              {categories.map((s) => (
                <Link
                  key={s.categoryId ?? 'none'}
                  to={s.categoryId ? `/categories/${s.categoryId}${mParam}` : '/history'}
                  className="press flex items-start gap-3 px-4 py-3 hover:bg-surface-2"
                >
                  <CategoryIcon icon={s.category?.icon ?? 'package'} color={s.category?.color ?? '#94A3B8'} size="sm" muted={s.category?.isArchived} />
                  <span className="min-w-0 flex-1 pt-0.5">
                    <span className="flex items-start justify-between gap-3">
                      <span className="min-w-0 text-[0.9375rem] leading-snug font-medium break-words">{s.category?.name ?? 'Без категорії'}</span>
                      <span className="tabular shrink-0 text-[0.9375rem] font-semibold whitespace-nowrap">{formatMoney(s.amount)}</span>
                    </span>
                    <span className="mt-1.5 flex items-center gap-2">
                      <ProgressBar value={s.share} color={s.category?.color} size="sm" label={`${s.category?.name}: ${formatPercent(s.share)}`} />
                      <span className="tabular w-9 shrink-0 text-right text-xs text-muted">{formatPercent(s.share)}</span>
                    </span>
                  </span>
                  <ChevronRight className="mt-1 size-4 shrink-0 text-subtle" aria-hidden />
                </Link>
              ))}
            </Card>
          ) : (
            <Card>
              <EmptyState compact icon={ArrowUpRight} title="Витрат ще немає" description="Коли додаси витрату, тут з'явиться розподіл за категоріями." />
            </Card>
          )}
        </Section>

        <p className="px-1 text-[0.8125rem] leading-relaxed text-muted">
          Залишок = було на початку + отримано − витрачено ± повернення боргів. «Відняти» зменшує отриману суму, але не рахується як витрата; перекази між рахунками не враховуються.
        </p>
      </div>

      <MoneyEntrySheet
        open={!!entry}
        mode={entry ?? 'add'}
        onClose={() => setEntry(null)}
        defaultDate={isCurrent ? undefined : new Date(month.getFullYear(), month.getMonth(), 15, 12)}
      />
    </div>
  )
}
