import type { Category } from '../../types'
import { createCollectionStorage } from './collection'

export const categoryStorage = createCollectionStorage<Category>('categories')
