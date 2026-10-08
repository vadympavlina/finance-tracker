import type { Transaction } from '../../types'
import { isInRange, parseDate, type DateRange } from '../../utils/date'

/** true if the money came into the user's wallet (income or a debt returned to me). */
export function isInflow(tx: Transaction): boolean {
  if (tx.type === 'income') return true
  if (tx.type === 'debt_repayment') return tx.debtDirection === 'they_owe_me'
  if (tx.type === 'adjustment') return tx.adjustmentDirection !== 'out'
  return false
}

/** true if the money left the user's wallet (expense or me repaying my debt). */
export function isOutflow(tx: Transaction): boolean {
  if (tx.type === 'expense') return true
  if (tx.type === 'debt_repayment') return tx.debtDirection === 'i_owe'
  if (tx.type === 'adjustment') return tx.adjustmentDirection === 'out'
  return false
}

/**
 * Effect of a transaction on the TOTAL balance.
 * Transfers move money between accounts and never change the total.
 */
export function getSignedAmount(tx: Transaction): number {
  if (isInflow(tx)) return tx.amount
  if (isOutflow(tx)) return -tx.amount
  return 0
}

/** Effect of a transaction on a specific account. */
export function getAccountDelta(tx: Transaction, accountId: string): number {
  if (tx.type === 'transfer') {
    let delta = 0
    if (tx.accountId === accountId) delta -= tx.amount
    if (tx.toAccountId === accountId) delta += tx.amount
    return delta
  }
  return tx.accountId === accountId ? getSignedAmount(tx) : 0
}

export function filterByRange(transactions: Transaction[], range: DateRange): Transaction[] {
  return transactions.filter((t) => isInRange(t.date, range))
}

/** Newest first. */
export function sortByDateDesc(transactions: Transaction[]): Transaction[] {
  return [...transactions].sort((a, b) => {
    const diff = parseDate(b.date).getTime() - parseDate(a.date).getTime()
    return diff !== 0 ? diff : b.createdAt.localeCompare(a.createdAt)
  })
}

export function sumAmounts(transactions: Transaction[]): number {
  return Math.round(transactions.reduce((s, t) => s + t.amount, 0) * 100) / 100
}
