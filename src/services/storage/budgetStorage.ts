import type { Budget } from '../../types'
import { createCollectionStorage } from './collection'

export const budgetStorage = createCollectionStorage<Budget>('budgets')
