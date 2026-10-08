import type { CategoryNote } from '../../types'
import { createCollectionStorage } from './collection'

export const noteStorage = createCollectionStorage<CategoryNote>('notes')
