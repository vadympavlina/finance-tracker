import type { Account } from '../../types'
import { createCollectionStorage } from './collection'

export const accountStorage = createCollectionStorage<Account>('accounts')
