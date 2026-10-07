import { useContext } from 'react'
import { UIContext } from '../store/UIContext'

function useUIContext() {
  const ctx = useContext(UIContext)
  if (!ctx) throw new Error('useUI must be used inside <UIProvider>')
  return ctx
}

export const useToast = () => useUIContext().toast
export const useConfirm = () => useUIContext().confirm
