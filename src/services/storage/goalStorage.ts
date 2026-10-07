import type { Goal } from '../../types'
import { createCollectionStorage } from './collection'

export const goalStorage = createCollectionStorage<Goal>('goals')
