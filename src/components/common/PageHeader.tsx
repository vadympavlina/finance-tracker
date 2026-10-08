import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { IconButton } from '../ui/Button'
import { cn } from '../../utils/cn'

interface PageHeaderProps {
  title: string
  subtitle?: string
  back?: boolean | string
  actions?: ReactNode
  /** The page is in the desktop sidebar: hide the back button there (≥ lg). */
  navPage?: boolean
}

/**
 * iOS large title. When it scrolls away, a compact glass bar with the
 * inline title fades in at the top (mobile), like UINavigationBar in iOS 26.
 */
export function PageHeader({ title, subtitle, back, actions, navPage }: PageHeaderProps) {
  const navigate = useNavigate()
  const sentinel = useRef<HTMLHeadingElement>(null)
  const [compact, setCompact] = useState(false)

  useEffect(() => {
    const el = sentinel.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([entry]) => setCompact(!entry.isIntersecting), { rootMargin: '-8px 0px 0px 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const goBack = () => {
    if (typeof back === 'string') navigate(back)
    else if (window.history.state?.idx > 0) navigate(-1)
    else navigate('/')
  }

  const backButton = back && (
    <IconButton label="Назад" onClick={goBack} className={navPage ? 'lg:hidden' : undefined}>
      <ChevronLeft className="size-[22px]" strokeWidth={2.4} aria-hidden />
    </IconButton>
  )

  return (
    <>
      <header className="pt-2 pb-5 lg:pt-0">
        {(back || actions) && (
          <div className={cn('mb-3 flex min-h-11 items-center justify-between gap-2', navPage && !actions && 'lg:hidden')}>
            <div>{backButton}</div>
            <div className="flex items-center gap-2">{actions}</div>
          </div>
        )}
        <h1 ref={sentinel} className="text-[34px] leading-[1.1] font-bold tracking-[-0.03em]">
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-[15px] text-muted">{subtitle}</p>}
      </header>
      {/* Compact bar (appears on scroll) */}
      <div
        inert={!compact}
        className={cn(
          'pointer-events-none fixed inset-x-0 top-0 z-20 pt-[max(8px,env(safe-area-inset-top))] transition-opacity duration-300 lg:hidden',
          compact ? 'opacity-100' : 'opacity-0',
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-bg via-bg/85 to-bg/0 [mask-image:linear-gradient(black_60%,transparent)]" />
        <div className="relative flex h-14 items-center gap-2 px-4">
          <div className={cn('flex w-24 items-center', compact && 'pointer-events-auto')}>{backButton}</div>
          <p className="min-w-0 flex-1 truncate text-center text-[17px] font-semibold">{title}</p>
          <div className={cn('flex w-24 justify-end gap-2', compact && 'pointer-events-auto')}>{actions}</div>
        </div>
      </div>

    </>
  )
}
