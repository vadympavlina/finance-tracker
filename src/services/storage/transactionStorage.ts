import type { Transaction } from '../../types'
import { createCollectionStorage } from './collection'

export const transactionStorage = createCollectionStorage<Transaction>('transactions')
