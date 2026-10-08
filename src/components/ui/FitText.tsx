import { useLayoutEffect, useRef, type ReactNode } from 'react'
import { cn } from '../../utils/cn'

interface FitTextProps {
  children: ReactNode
  className?: string
  /** Smallest allowed scale of the original font size. */
  min?: number
  as?: 'span' | 'p'
}

/**
 * One-line text (amounts) that shrinks its font until it fits the available
 * width instead of being cut with "…". Re-fits on resize and on content change.
 */
export function FitText({ children, className, min = 0.5, as: Tag = 'span' }: FitTextProps) {
  const ref = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const fit = () => {
      el.style.fontSize = ''
      el.style.whiteSpace = 'nowrap'
      const available = el.clientWidth
      const needed = el.scrollWidth
      if (!available || needed <= available) return
      const base = parseFloat(getComputedStyle(el).fontSize)
      const scale = available / needed
      if (scale >= min) {
        el.style.fontSize = `${Math.floor(base * scale * 10) / 10}px`
      } else {
        // Extremely long value: shrink as much as allowed and let it wrap.
        el.style.fontSize = `${base * min}px`
        el.style.whiteSpace = 'normal'
      }
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    if (el.parentElement) ro.observe(el.parentElement)
    return () => ro.disconnect()
  }, [children, min])

  return (
    <Tag ref={ref as never} className={cn('block max-w-full whitespace-nowrap', className)}>
      {children}
    </Tag>
  )
}
