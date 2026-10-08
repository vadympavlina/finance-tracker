import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { MOBILE_NAV, isNavActive } from '../../layouts/navigation'
import { cn } from '../../utils/cn'

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

/**
 * Floating Liquid Glass tab bar with a separate glass "+" button beside it
 * (the place iOS 26 gives to the primary action).
 */
export function BottomNavigation({ onQuickAdd, showAdd }: { onQuickAdd: () => void; showAdd: boolean }) {
  const collapsed = useScrollCollapsed()
  const { pathname } = useLocation()
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[max(10px,env(safe-area-inset-bottom))] z-30 flex items-end justify-center gap-2 px-3 lg:hidden">
      <nav aria-label="Основна навігація" className="glass pointer-events-auto min-w-0 flex-1 rounded-full p-1 sm:max-w-md">
        <ul className="flex items-stretch">
          {MOBILE_NAV.map((item) => {
            const { to, label, icon: Icon } = item
            const isActive = isNavActive(item, pathname)
            return (
            <li key={to} className="min-w-0 flex-1">
              <NavLink
                to={to}
                aria-current={isActive ? 'page' : undefined}
                className={() =>
                  cn(
                    'press flex flex-col items-center justify-center rounded-full font-semibold transition-all duration-300',
                    collapsed ? 'h-11 gap-0' : 'h-[54px] gap-0.5',
                    isActive ? 'bg-black/[0.06] text-primary dark:bg-white/[0.12]' : 'text-text',
                  )
                }
              >
                {() => (
                  <>
                    <Icon className="size-[22px] shrink-0" strokeWidth={isActive ? 2.3 : 1.9} aria-hidden />
                    <span
                      className={cn(
                        'max-w-full text-[clamp(9.5px,2.9vw,11px)] leading-tight whitespace-nowrap transition-all duration-300',
                        collapsed ? 'h-0 opacity-0' : 'h-3.5 opacity-100',
                      )}
                    >
                      {label}
                    </span>
                  </>
                )}
              </NavLink>
            </li>
            )
          })}
        </ul>
      </nav>
      {showAdd && (
        <button
          type="button"
          onClick={onQuickAdd}
          aria-label="Додати операцію"
          className={cn(
            'press glass-tinted pointer-events-auto grid shrink-0 place-items-center rounded-full text-on-primary transition-all duration-300',
            collapsed ? 'size-[52px]' : 'size-[62px]',
          )}
        >
          <Plus className="size-7" strokeWidth={2.4} aria-hidden />
        </button>
      )}
    </div>
  )
}
