import type { Budget, Transaction } from '../../types'
import { endOfDay, monthRange, parseDate, startOfDay, type DateRange } from '../../utils/date'
import { roundMoney } from '../../utils/format'
import { filterByRange, sumAmounts } from './transactions'

export type BudgetStatus = 'ok' | 'warning' | 'exceeded'

export interface BudgetProgress {
  budget: Budget
  range: DateRange
  spent: number
  remaining: number
  /** 0..∞ (can be > 100 when exceeded) */
  percent: number
  status: BudgetStatus
  /** Whether the budget applies to the reference date at all. */
  isActive: boolean
}

/** Monthly budgets apply to the month of `ref`; custom ones to their own range. */
export function getBudgetRange(budget: Budget, ref = new Date()): DateRange {
  if (budget.period === 'custom' && budget.endDate) {
    return { start: startOfDay(parseDate(budget.startDate)), end: endOfDay(parseDate(budget.endDate)) }
  }
  return monthRange(ref)
}

export const BUDGET_WARNING_THRESHOLD = 80

export function calculateBudgetProgress(budget: Budget, transactions: Transaction[], ref = new Date()): BudgetProgress {
  const range = getBudgetRange(budget, ref)
  const expenses = filterByRange(transactions, range).filter(
    (t) => t.type === 'expense' && (budget.categoryId === null || t.categoryId === budget.categoryId),
  )
  const spent = sumAmounts(expenses)
  const percent = budget.amount > 0 ? (spent / budget.amount) * 100 : 0
  const status: BudgetStatus = spent > budget.amount ? 'exceeded' : percent >= BUDGET_WARNING_THRESHOLD ? 'warning' : 'ok'
  const t = ref.getTime()
  return {
    budget,
    range,
    spent,
    remaining: roundMoney(budget.amount - spent),
    percent,
    status,
    isActive: budget.period === 'month' || (t >= range.start.getTime() && t <= range.end.getTime()),
  }
}
