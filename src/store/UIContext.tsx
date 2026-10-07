import { createContext, useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { ToastViewport, type ToastItem, type ToastKind } from '../components/ui/Toast'
import { ConfirmDialog, type ConfirmOptions } from '../components/ui/ConfirmDialog'

export interface UIContextValue {
  toast(message: string, kind?: ToastKind): void
  confirm(options: ConfirmOptions): Promise<boolean>
}

export const UIContext = createContext<UIContextValue | null>(null)

export function UIProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [confirmState, setConfirmState] = useState<(ConfirmOptions & { open: boolean }) | null>(null)
  const resolver = useRef<((v: boolean) => void) | null>(null)
  const counter = useRef(0)

  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), [])

  const toast = useCallback(
    (message: string, kind: ToastKind = 'success') => {
      const id = ++counter.current
      setToasts((t) => [...t.slice(-2), { id, message, kind }])
      window.setTimeout(() => dismiss(id), kind === 'error' ? 4500 : 2600)
    },
    [dismiss],
  )

  const confirm = useCallback((options: ConfirmOptions) => {
    resolver.current?.(false)
    setConfirmState({ ...options, open: true })
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve
    })
  }, [])

  const close = (result: boolean) => {
    resolver.current?.(result)
    resolver.current = null
    setConfirmState((s) => (s ? { ...s, open: false } : s))
  }

  const value = useMemo(() => ({ toast, confirm }), [toast, confirm])

  return (
    <UIContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
      {confirmState && (
        <ConfirmDialog {...confirmState} open={confirmState.open} onConfirm={() => close(true)} onCancel={() => close(false)} />
      )}
    </UIContext.Provider>
  )
}
