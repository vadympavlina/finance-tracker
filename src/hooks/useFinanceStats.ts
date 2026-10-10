import { useMemo } from 'react'
import { useFinance } from './useFinance'
import {
  calculateAccountBalances,
  calculateAvailableBalance,
  calculateSavingsBalance,
  calculateBudgetProgress,
  calculateDebtBalance,
  calculateGoalsSummary,
  calculateMonthlyStats,
  percentChange,
  sortByDateDesc,
} from '../services/calculations'
import { endOfMonth, addMonths } from '../utils/date'

/** Dashboard-level numbers, memoized on the underlying data. */
export function useFinanceStats() {
  const { data } = useFinance()
  const { transactions, accounts, debts, budgets, goals } = data

  return useMemo(() => {
    const now = new Date()
    // Main balance excludes savings accounts so it shows the money actually available.
    const balance = calculateAvailableBalance(accounts, transactions)
    const savings = calculateSavingsBalance(accounts, transactions)
    const lastMonthEnd = endOfMonth(addMonths(now, -1))
    const balanceAtMonthStart = calculateAvailableBalance(accounts, transactions, lastMonthEnd)
    const monthly = calculateMonthlyStats(transactions, now)
    const debt = calculateDebtBalance(debts, now)
    const accountBalances = calculateAccountBalances(
      accounts.filter((a) => !a.isArchived),
      transactions,
    )
    const overallBudget = budgets.find((b) => b.categoryId === null && b.period === 'month')
    const budgetProgress = overallBudget ? calculateBudgetProgress(overallBudget, transactions, now) : null
    return {
      balance,
      savings,
      hasSavingsAccount: accounts.some((a) => a.type === 'savings' && !a.isArchived),
      balanceAtMonthStart,
      balanceChange: percentChange(balance, balanceAtMonthStart),
      balanceDelta: balance - balanceAtMonthStart,
      monthly,
      debt,
      accountBalances,
      budgetProgress,
      goals: calculateGoalsSummary(goals),
      recent: sortByDateDesc(transactions).slice(0, 6),
    }
  }, [transactions, accounts, debts, budgets, goals])
}
