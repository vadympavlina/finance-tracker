import { forwardRef, useLayoutEffect, useRef, type TextareaHTMLAttributes } from 'react'
import { cn } from '../../utils/cn'
import { controlClassName } from './Field'

/** Textarea that grows with its content (up to maxRows), so long comments stay fully visible. */
export const AutoTextarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & { maxRows?: number }>(
  function AutoTextarea({ className, maxRows = 8, value, ...props }, outerRef) {
    const ref = useRef<HTMLTextAreaElement | null>(null)
    useLayoutEffect(() => {
      const el = ref.current
      if (!el) return
      el.style.height = 'auto'
      const line = parseFloat(getComputedStyle(el).lineHeight) || 22
      const max = line * maxRows + 24
      el.style.height = `${Math.min(el.scrollHeight, max)}px`
      el.style.overflowY = el.scrollHeight > max ? 'auto' : 'hidden'
    }, [value, maxRows])
    return (
      <textarea
        ref={(el) => {
          ref.current = el
          if (typeof outerRef === 'function') outerRef(el)
          else if (outerRef) outerRef.current = el
        }}
        rows={1}
        value={value}
        className={cn(controlClassName, 'resize-none py-3 leading-[1.4]', className)}
        {...props}
      />
    )
  },
)
