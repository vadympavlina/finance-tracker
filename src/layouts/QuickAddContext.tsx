import { createContext, useContext } from 'react'

export const QuickAddContext = createContext<{ open: () => void }>({ open: () => {} })
export const useQuickAdd = () => useContext(QuickAddContext)
