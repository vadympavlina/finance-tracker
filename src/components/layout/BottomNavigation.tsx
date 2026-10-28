import { forwardRef, useEffect, useState, type AnchorHTMLAttributes, type CSSProperties } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Button as GlassButton, TabBar } from 'glisse'
import { MOBILE_NAV, isNavActive } from '../../layouts/navigation'
import { useWidth } from '../../hooks/useWidth'

/** Collapses the tab bar while the user scrolls down, like iOS 26. */
function useScrollCollapsed() {
  const [collapsed, setCollapsed] = useState(false)
  useEffect(() => {
    let last = window.scrollY
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const y = window.scrollY
        const atBottom = window.innerHeight + y >= document.documentElement.scrollHeight - 4
        if (y < 40 || atBottom) setCollapsed(false)
        else if (y > last + 6) setCollapsed(true)
        else if (y < last - 6) setCollapsed(false)
        last = y
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])
  return collapsed
}

/** Glisse renders link tabs through this component, so navigation stays inside the HashRouter. */
const RouterLink = forwardRef<HTMLAnchorElement, AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }>(function RouterLink(
  { href, ...rest },
  ref,
) {
  return <Link ref={ref} to={href} {...rest} />
})

/** Tab bar padding inside Glisse (4px each side). */
const BAR_PADDING = 8

/**
 * Floating Liquid Glass tab bar (Glisse): the selection is a glass lens you can drag
 * across tabs. The primary "+" action sits beside it, as iOS 26 does.
 */
export function BottomNavigation({ onQuickAdd, showAdd }: { onQuickAdd: () => void; showAdd: boolean }) {
  const collapsed = useScrollCollapsed()
  const { pathname } = useLocation()
  const [ref, width] = useWidth<HTMLDivElement>()
  const active = MOBILE_NAV.find((item) => isNavActive(item, pathname))?.to ?? null
  const tabWidth = width ? (width - BAR_PADDING) / MOBILE_NAV.length : 0
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[max(10px,env(safe-area-inset-bottom))] z-30 flex items-center justify-center gap-2 px-3 lg:hidden">
      <div
        ref={ref}
        className="ft-nav pointer-events-auto min-w-0 flex-1 sm:max-w-md"
        data-collapsed={collapsed ? '' : undefined}
        style={{ visibility: tabWidth ? undefined : 'hidden' }}
      >
        <TabBar
          aria-label="Основна навігація"
          link={RouterLink}
          value={active}
          style={{ '--lg-tab-width': `${tabWidth}px` } as CSSProperties}
          items={MOBILE_NAV.map(({ to, label, icon: Icon }) => ({
            value: to,
            href: to,
            label: (
              <span className="ft-nav-item">
                <Icon strokeWidth={active === to ? 2.3 : 1.9} aria-hidden />
                <span className="ft-nav-label">{label}</span>
              </span>
            ),
          }))}
        />
      </div>
      {showAdd && (
        <GlassButton
          variant="filled"
          aria-label="Додати операцію"
          onClick={onQuickAdd}
          data-collapsed={collapsed ? '' : undefined}
          className="ft-btn ft-icon ft-fab pointer-events-auto"
          icon={<Plus strokeWidth={2.4} aria-hidden />}
        />
      )}
    </div>
  )
}
