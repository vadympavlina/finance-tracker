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

export function calculateAccountBalance(account: Account, transactions: Transaction[]): number {
  return roundMoney(transactions.reduce((s, t) => s + getAccountDelta(t, account.id), account.balance))
}

export function calculateAccountBalances(
  accounts: Account[],
  transactions: Transaction[],
): Array<{ account: Account; balance: number }> {
  return accounts.map((account) => ({ account, balance: calculateAccountBalance(account, transactions) }))
}
