import type { Category, CategoryType, Transaction } from '../../types'
import { monthRange, addMonths, type DateRange } from '../../utils/date'
import { roundMoney } from '../../utils/format'
import { filterByRange, isInflow, isOutflow, sumAmounts } from './transactions'

/** Sum of income transactions (debt repayments are not income). */
export function calculateIncome(transactions: Transaction[], range?: DateRange): number {
  const list = range ? filterByRange(transactions, range) : transactions
  return sumAmounts(list.filter((t) => t.type === 'income'))
}

/** Sum of expense transactions (debt repayments are not expenses). */
export function calculateExpenses(transactions: Transaction[], range?: DateRange): number {
  const list = range ? filterByRange(transactions, range) : transactions
  return sumAmounts(list.filter((t) => t.type === 'expense'))
}

/** Net cash flow including debt repayments (what really happened with the money). */
export function calculateNetFlow(transactions: Transaction[], range?: DateRange): number {
  const list = range ? filterByRange(transactions, range) : transactions
  return roundMoney(list.reduce((s, t) => s + (isInflow(t) ? t.amount : isOutflow(t) ? -t.amount : 0), 0))
}

/** Percentage change, null when there is nothing to compare with. */
export function percentChange(current: number, previous: number): number | null {
  if (!previous) return null
  return ((current - previous) / Math.abs(previous)) * 100
}

export interface CategoryStat {
  category: Category | null
  categoryId: string | null
  amount: number
  share: number
  count: number
}

/** Per-category totals for a type (expense / income), sorted by amount desc. */
export function calculateCategoryTotals(
  transactions: Transaction[],
  categories: Category[],
  type: CategoryType,
  range?: DateRange,
): CategoryStat[] {
  const list = (range ? filterByRange(transactions, range) : transactions).filter((t) => t.type === type)
  const total = sumAmounts(list)
  const byId = new Map<string, { amount: number; count: number }>()
  for (const t of list) {
    const key = t.categoryId ?? '__none__'
    const cur = byId.get(key) ?? { amount: 0, count: 0 }
    cur.amount += t.amount
    cur.count += 1
    byId.set(key, cur)
  }
  const catMap = new Map(categories.map((c) => [c.id, c]))
  return [...byId.entries()]
    .map(([id, v]) => ({
      categoryId: id === '__none__' ? null : id,
      category: catMap.get(id) ?? null,
      amount: roundMoney(v.amount),
      count: v.count,
      share: total ? (v.amount / total) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount)
}

export function calculateCategoryExpenses(transactions: Transaction[], categories: Category[], range?: DateRange) {
  return calculateCategoryTotals(transactions, categories, 'expense', range)
}

/** Cuts the previous period to the same elapsed length when the current period is still in progress. */
export function comparableRange(previous: DateRange, current: DateRange, now = new Date()): DateRange {
  if (now.getTime() < current.start.getTime() || now.getTime() > current.end.getTime()) return previous
  const elapsed = now.getTime() - current.start.getTime()
  const end = new Date(Math.min(previous.end.getTime(), previous.start.getTime() + elapsed))
  return { start: previous.start, end }
}

export interface MonthlyStats {
  range: DateRange
  income: number
  expenses: number
  net: number
  netFlow: number
  previousIncome: number
  previousExpenses: number
  previousNetFlow: number
  incomeChange: number | null
  expensesChange: number | null
  netFlowChange: number | null
}

export function calculateMonthlyStats(transactions: Transaction[], ref = new Date()): MonthlyStats {
  const range = monthRange(ref)
  // Compare with the same elapsed part of the previous month (1–7 Oct vs 1–7 Sep),
  // otherwise an unfinished month always looks like a huge drop.
  const prevRange = comparableRange(monthRange(addMonths(ref, -1)), range, ref)
  const income = calculateIncome(transactions, range)
  const expenses = calculateExpenses(transactions, range)
  const netFlow = calculateNetFlow(transactions, range)
  const previousIncome = calculateIncome(transactions, prevRange)
  const previousExpenses = calculateExpenses(transactions, prevRange)
  const previousNetFlow = calculateNetFlow(transactions, prevRange)
  return {
    range,
    income,
    expenses,
    net: roundMoney(income - expenses),
    netFlow,
    previousIncome,
    previousExpenses,
    previousNetFlow,
    incomeChange: percentChange(income, previousIncome),
    expensesChange: percentChange(expenses, previousExpenses),
    netFlowChange: percentChange(netFlow, previousNetFlow),
  }
}
