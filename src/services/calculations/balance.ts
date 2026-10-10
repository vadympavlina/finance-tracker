import type { Account, Transaction } from '../../types'
import { parseDate } from '../../utils/date'
import { roundMoney } from '../../utils/format'
import { getAccountDelta, getSignedAmount } from './transactions'

/**
 * Balance = opening balances of accounts
 *         + all incomes − all expenses
 *         ± debt repayments (only real money movements)
 * Transfers between accounts don't change the total.
 * Debts themselves never change the balance.
 */
export function calculateBalance(accounts: Account[], transactions: Transaction[], at?: Date): number {
  const limit = at?.getTime()
  const opening = accounts.reduce((s, a) => s + a.balance, 0)
  const flows = transactions.reduce((s, t) => {
    if (limit !== undefined && parseDate(t.date).getTime() > limit) return s
    return s + getSignedAmount(t)
  }, 0)
  return roundMoney(opening + flows)
}

export function calculateAccountBalance(account: Account, transactions: Transaction[], at?: Date): number {
  const limit = at?.getTime()
  return roundMoney(
    transactions.reduce((s, t) => (limit !== undefined && parseDate(t.date).getTime() > limit ? s : s + getAccountDelta(t, account.id)), account.balance),
  )
}

/** Savings accounts are kept apart: money put aside is not "money I have to spend". */
export const isSavingsAccount = (account: Account) => account.type === 'savings'

/** Sum of all savings accounts (archived included, so history stays consistent). */
export function calculateSavingsBalance(accounts: Account[], transactions: Transaction[], at?: Date): number {
  return roundMoney(accounts.filter(isSavingsAccount).reduce((s, a) => s + calculateAccountBalance(a, transactions, at), 0))
}

/**
 * The main "Загальний баланс": every account except savings.
 * Moving money to savings lowers it; taking it back raises it.
 */
export function calculateAvailableBalance(accounts: Account[], transactions: Transaction[], at?: Date): number {
  return roundMoney(calculateBalance(accounts, transactions, at) - calculateSavingsBalance(accounts, transactions, at))
}

export function calculateAccountBalances(
  accounts: Account[],
  transactions: Transaction[],
): Array<{ account: Account; balance: number }> {
  return accounts.map((account) => ({ account, balance: calculateAccountBalance(account, transactions) }))
}
