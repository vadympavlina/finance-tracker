import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '../../utils/cn'

let openSheets = 0

interface SheetProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  /** Sticky footer (primary actions). */
  footer?: ReactNode
  /** role="alertdialog" for confirmations. */
  alert?: boolean
  size?: 'sm' | 'md' | 'lg'
  hideTitle?: boolean
}

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

/**
 * Bottom sheet on mobile, centered modal on ≥ md screens.
 * Handles Esc, focus trap, focus restore and body scroll lock.
 */
export function Sheet({ open, onClose, title, description, children, footer, alert, size = 'md', hideTitle }: SheetProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  const titleId = useId()
  const descId = useId()

  useEffect(() => {
    if (!open) return
    const previouslyFocused = document.activeElement as HTMLElement | null
    openSheets += 1
    document.body.style.overflow = 'hidden'

    const panel = panelRef.current
    const focusFirst = () => {
      const autofocus = panel?.querySelector<HTMLElement>('[data-autofocus]')
      const first = autofocus ?? panel?.querySelector<HTMLElement>(FOCUSABLE)
      ;(first ?? panel)?.focus({ preventScroll: true })
    }
    const raf = requestAnimationFrame(focusFirst)

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onCloseRef.current()
        return
      }
      if (e.key !== 'Tab' || !panel) return
      const items = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null)
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('keydown', onKey)
      openSheets -= 1
      if (openSheets <= 0) {
        openSheets = 0
        document.body.style.overflow = ''
      }
      previouslyFocused?.focus?.({ preventScroll: true })
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-6">
      <div className="animate-fade-in absolute inset-0 bg-[#0b0c12]/45 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div
        ref={panelRef}
        role={alert ? 'alertdialog' : 'dialog'}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={cn(
          'relative flex max-h-[92dvh] w-full flex-col bg-surface shadow-float outline-none',
          'animate-slide-up rounded-t-[28px] md:animate-pop md:rounded-[28px]',
          size === 'sm' && 'md:max-w-sm',
          size === 'md' && 'md:max-w-lg',
          size === 'lg' && 'md:max-w-2xl',
        )}
      >
        <div className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-surface-3 md:hidden" aria-hidden />
        <div className={cn('flex shrink-0 items-start gap-3 px-5 pt-3 pb-2 md:px-6 md:pt-5', hideTitle && 'sr-only')}>
          <div className="min-w-0 flex-1 pt-1.5">
            <h2 id={titleId} className="text-lg font-semibold tracking-tight">
              {title}
            </h2>
            {description && (
              <p id={descId} className="mt-1 text-sm text-muted">
                {description}
              </p>
            )}
          </div>
          {!alert && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Закрити"
              className="press -mr-1.5 grid size-11 shrink-0 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-text"
            >
              <X className="size-5" aria-hidden />
            </button>
          )}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5 md:px-6">{children}</div>
        {footer && <div className="shrink-0 border-t border-border px-5 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] md:px-6 md:pb-5">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}
