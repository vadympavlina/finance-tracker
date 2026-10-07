import type { Debt } from '../../types'
import { createCollectionStorage } from './collection'

export const debtStorage = createCollectionStorage<Debt>('debts')
