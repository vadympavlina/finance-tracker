import type { Debt, DebtStatus, Transaction } from '../../types'
import { diffInDays, parseDate } from '../../utils/date'
import { roundMoney } from '../../utils/format'

export function calculateDebtRepaid(debt: Debt, transactions: Transaction[]): number {
  return roundMoney(
    transactions.filter((t) => t.type === 'debt_repayment' && t.debtId === debt.id).reduce((s, t) => s + t.amount, 0),
  )
}

export function calculateDebtRemaining(debt: Debt): number {
  return Math.max(0, roundMoney(debt.amount - debt.repaidAmount))
}

/**
 * paid    — fully repaid
 * overdue — due date passed and something is still left
 * pending — has a due date in the future ("Очікує")
 * active  — no due date
 */
export function calculateDebtStatus(debt: Debt, now = new Date()): DebtStatus {
  if (calculateDebtRemaining(debt) <= 0) return 'paid'
  if (debt.dueDate) {
    return diffInDays(parseDate(debt.dueDate), now) < 0 ? 'overdue' : 'pending'
  }
  return 'active'
}

export interface DebtBalance {
  /** What I owe to others (remaining). */
  iOwe: number
  /** What others owe me (remaining). */
  owedToMe: number
  /** Total of open debts in both directions. */
  total: number
  /** owedToMe − iOwe */
  net: number
  openCount: number
  overdueCount: number
}

export function calculateDebtBalance(debts: Debt[], now = new Date()): DebtBalance {
  let iOwe = 0
  let owedToMe = 0
  let openCount = 0
  let overdueCount = 0
  for (const d of debts) {
    const remaining = calculateDebtRemaining(d)
    if (remaining <= 0) continue
    openCount += 1
    if (calculateDebtStatus(d, now) === 'overdue') overdueCount += 1
    if (d.direction === 'i_owe') iOwe += remaining
    else owedToMe += remaining
  }
  return {
    iOwe: roundMoney(iOwe),
    owedToMe: roundMoney(owedToMe),
    total: roundMoney(iOwe + owedToMe),
    net: roundMoney(owedToMe - iOwe),
    openCount,
    overdueCount,
  }
}

export function calculateDebtProgress(debt: Debt): number {
  return debt.amount > 0 ? Math.min(100, (debt.repaidAmount / debt.amount) * 100) : 0
}

/** Debts that are overdue or due within `days` days. */
export function getUpcomingDebts(debts: Debt[], days = 7, now = new Date()): Debt[] {
  return debts
    .filter((d) => calculateDebtRemaining(d) > 0 && d.dueDate && diffInDays(parseDate(d.dueDate), now) <= days)
    .sort((a, b) => parseDate(a.dueDate!).getTime() - parseDate(b.dueDate!).getTime())
}
