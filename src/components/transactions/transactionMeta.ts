import type { Account, Category, Transaction } from '../../types'
import { getSignedAmount } from '../../services/calculations'

export interface TransactionView {
  title: string
  subtitle: string
  icon: string
  color: string
  /** Signed amount for display; transfers are shown as neutral. */
  signed: number
  tone: 'income' | 'expense' | 'neutral'
  categoryName: string
  isArchivedCategory: boolean
}

/** Presentation info for a transaction — pure, no calculations of totals. */
export function describeTransaction(
  tx: Transaction,
  categoryById: Map<string, Category>,
  accountById: Map<string, Account>,
): TransactionView {
  const account = accountById.get(tx.accountId)
  if (tx.type === 'transfer') {
    const to = tx.toAccountId ? accountById.get(tx.toAccountId) : undefined
    return {
      title: 'Переказ',
      subtitle: `${account?.name ?? 'Рахунок'} → ${to?.name ?? 'Рахунок'}`,
      icon: 'transfer',
      color: '#3B82F6',
      signed: tx.amount,
      tone: 'neutral',
      categoryName: 'Переказ між рахунками',
      isArchivedCategory: false,
    }
  }
  if (tx.type === 'adjustment') {
    const added = tx.adjustmentDirection !== 'out'
    return {
      title: added ? 'Додано до місяця' : 'Віднято з місяця',
      subtitle: tx.comment || account?.name || '',
      icon: added ? 'plus-circle' : 'minus-circle',
      color: added ? '#0E8F62' : '#B06700',
      signed: getSignedAmount(tx),
      tone: added ? 'income' : 'expense',
      categoryName: added ? 'Коригування: додано' : 'Коригування: віднято',
      isArchivedCategory: false,
    }
  }
  if (tx.type === 'debt_repayment') {
    const incoming = tx.debtDirection === 'they_owe_me'
    return {
      title: incoming ? 'Повернення боргу' : 'Погашення боргу',
      subtitle: tx.debtPerson ?? 'Борг',
      icon: incoming ? 'hand-coins' : 'undo',
      color: incoming ? '#0E8F62' : '#D98E04',
      signed: getSignedAmount(tx),
      tone: incoming ? 'income' : 'expense',
      categoryName: incoming ? 'Мені повернули борг' : 'Я повернув борг',
      isArchivedCategory: false,
    }
  }
  const category = tx.categoryId ? categoryById.get(tx.categoryId) : undefined
  const name = category?.name ?? 'Без категорії'
  return {
    title: name,
    subtitle: tx.merchant || tx.comment || account?.name || '',
    icon: category?.icon ?? 'package',
    color: category?.color ?? '#94A3B8',
    signed: getSignedAmount(tx),
    tone: tx.type === 'income' ? 'income' : 'expense',
    categoryName: category?.isArchived ? `${name} (архівована)` : name,
    isArchivedCategory: Boolean(category?.isArchived),
  }
}

export const TRANSACTION_TYPE_LABELS: Record<Transaction['type'], string> = {
  income: 'Дохід',
  expense: 'Витрата',
  transfer: 'Переказ',
  debt_repayment: 'Повернення боргу',
  adjustment: 'Коригування суми',
}
