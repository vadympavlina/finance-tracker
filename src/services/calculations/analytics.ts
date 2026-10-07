import type { Account, Category, Goal, Transaction } from '../../types'
import {
  addDays,
  addMonths,
  endOfDay,
  endOfMonth,
  endOfYear,
  formatDayMonth,
  formatFullDate,
  formatMonthShort,
  formatMonthYear,
  formatWeekdayShort,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  type DateRange,
} from '../../utils/date'
import { roundMoney } from '../../utils/format'
import { calculateBalance } from './balance'
import { comparableRange, calculateCategoryTotals, calculateExpenses, calculateIncome, calculateNetFlow, percentChange, type CategoryStat } from './stats'
import { filterByRange } from './transactions'
import { calculateGoalSavings } from './goals'

export type AnalyticsPeriod = 'week' | 'month' | 'year'
export type AnalyticsMetric = 'expense' | 'income' | 'balance'

/** Period window shifted by `offset` periods back (offset ≤ 0). */
export function getPeriodRange(period: AnalyticsPeriod, offset = 0, ref = new Date()): DateRange {
  if (period === 'week') {
    const start = addDays(startOfWeek(ref), offset * 7)
    return { start, end: endOfDay(addDays(start, 6)) }
  }
  if (period === 'month') {
    const start = addMonths(startOfMonth(ref), offset)
    return { start, end: endOfMonth(start) }
  }
  const start = new Date(ref.getFullYear() + offset, 0, 1)
  return { start, end: endOfYear(start) }
}

export function formatPeriodLabel(period: AnalyticsPeriod, range: DateRange): string {
  if (period === 'week') return `${formatDayMonth(range.start)} – ${formatFullDate(range.end)}`
  if (period === 'month') return formatMonthYear(range.start)
  return String(range.start.getFullYear())
}

export interface SeriesPoint {
  key: string
  label: string
  /** Long label for tooltips. */
  fullLabel: string
  value: number
  isCurrent: boolean
}

interface Bucket {
  range: DateRange
  label: string
  fullLabel: string
  isCurrent: boolean
}

/**
 * Buckets for the dynamics chart:
 *  week  → 7 days of the selected week
 *  month → 6 months ending with the selected month
 *  year  → 12 months of the selected year
 */
function getBuckets(period: AnalyticsPeriod, range: DateRange, now: Date): Bucket[] {
  if (period === 'week') {
    return Array.from({ length: 7 }, (_, i) => {
      const day = addDays(range.start, i)
      return {
        range: { start: day, end: endOfDay(day) },
        label: formatWeekdayShort(day),
        fullLabel: formatFullDate(day),
        isCurrent: isSameDay(day, now),
      }
    })
  }
  if (period === 'month') {
    return Array.from({ length: 6 }, (_, i) => {
      const m = addMonths(range.start, i - 5)
      return {
        range: { start: m, end: endOfMonth(m) },
        label: formatMonthShort(m),
        fullLabel: formatMonthYear(m),
        isCurrent: i === 5,
      }
    })
  }
  return Array.from({ length: 12 }, (_, i) => {
    const m = new Date(range.start.getFullYear(), i, 1)
    return {
      range: { start: m, end: endOfMonth(m) },
      label: formatMonthShort(m),
      fullLabel: formatMonthYear(m),
      isCurrent: isSameMonth(m, now),
    }
  })
}

export function buildSeries(
  transactions: Transaction[],
  accounts: Account[],
  metric: AnalyticsMetric,
  period: AnalyticsPeriod,
  range: DateRange,
  now = new Date(),
): SeriesPoint[] {
  const buckets = getBuckets(period, range, now)
  // The balance of a future day is unknown — the line stops at "today".
  const visible = metric === 'balance' ? buckets.filter((b) => b.range.start.getTime() <= now.getTime()) : buckets
  return visible.map((b) => {
    let value: number
    if (metric === 'expense') value = calculateExpenses(transactions, b.range)
    else if (metric === 'income') value = calculateIncome(transactions, b.range)
    else value = calculateBalance(accounts, transactions, b.range.end.getTime() > now.getTime() ? now : b.range.end)
    return { key: b.range.start.toISOString(), label: b.label, fullLabel: b.fullLabel, value, isCurrent: b.isCurrent }
  })
}

export interface StructureSlice {
  id: string
  name: string
  color: string
  icon: string
  amount: number
  share: number
}

/** Top N categories + "Інше" for the donut chart. */
export function buildStructure(stats: CategoryStat[], topN = 4): StructureSlice[] {
  const toSlice = (s: CategoryStat): StructureSlice => ({
    id: s.categoryId ?? 'none',
    name: s.category?.name ?? 'Без категорії',
    color: s.category?.color ?? '#94A3B8',
    icon: s.category?.icon ?? 'package',
    amount: s.amount,
    share: s.share,
  })
  if (stats.length <= topN + 1) return stats.map(toSlice)
  const top = stats.slice(0, topN).map(toSlice)
  const rest = stats.slice(topN)
  return [
    ...top,
    {
      id: 'rest',
      name: 'Інше',
      color: '#CBD5E1',
      icon: 'more-horizontal',
      amount: roundMoney(rest.reduce((s, r) => s + r.amount, 0)),
      share: rest.reduce((s, r) => s + r.share, 0),
    },
  ]
}

export interface FlowSummary {
  total: number
  previousTotal: number
  change: number | null
  count: number
  average: number
  previousAverage: number
  averageChange: number | null
  largest: Transaction | null
}

export function calculateFlowSummary(
  transactions: Transaction[],
  type: 'expense' | 'income',
  range: DateRange,
  previousRange: DateRange,
): FlowSummary {
  const current = filterByRange(transactions, range).filter((t) => t.type === type)
  const previous = filterByRange(transactions, previousRange).filter((t) => t.type === type)
  const total = roundMoney(current.reduce((s, t) => s + t.amount, 0))
  const previousTotal = roundMoney(previous.reduce((s, t) => s + t.amount, 0))
  const average = current.length ? roundMoney(total / current.length) : 0
  const previousAverage = previous.length ? roundMoney(previousTotal / previous.length) : 0
  const largest = current.reduce<Transaction | null>((m, t) => (!m || t.amount > m.amount ? t : m), null)
  return {
    total,
    previousTotal,
    change: percentChange(total, previousTotal),
    count: current.length,
    average,
    previousAverage,
    averageChange: percentChange(average, previousAverage),
    largest,
  }
}

export interface BalanceSummary {
  opening: number
  closing: number
  income: number
  expenses: number
  netFlow: number
  savingsRate: number | null
  goalSavings: number
}

export function calculateBalanceSummary(
  transactions: Transaction[],
  accounts: Account[],
  goals: Goal[],
  range: DateRange,
  now = new Date(),
): BalanceSummary {
  const openingAt = new Date(range.start.getTime() - 1)
  const closingAt = range.end.getTime() > now.getTime() ? now : range.end
  const income = calculateIncome(transactions, range)
  const expenses = calculateExpenses(transactions, range)
  return {
    opening: calculateBalance(accounts, transactions, openingAt),
    closing: calculateBalance(accounts, transactions, closingAt),
    income,
    expenses,
    netFlow: calculateNetFlow(transactions, range),
    savingsRate: income > 0 ? ((income - expenses) / income) * 100 : null,
    goalSavings: calculateGoalSavings(goals, range),
  }
}

export function previousRange(period: AnalyticsPeriod, offset: number, ref = new Date()): DateRange {
  return comparableRange(getPeriodRange(period, offset - 1, ref), getPeriodRange(period, offset, ref), ref)
}

export function categoryStructure(
  transactions: Transaction[],
  categories: Category[],
  type: 'expense' | 'income',
  range: DateRange,
) {
  const stats = calculateCategoryTotals(transactions, categories, type, range)
  return { stats, slices: buildStructure(stats) }
}

/** Earliest year with data — used to limit period navigation. */
export function getEarliestDate(transactions: Transaction[]): Date | null {
  if (!transactions.length) return null
  return transactions.reduce((min, t) => {
    const d = new Date(t.date)
    return d < min ? d : min
  }, new Date())
}

