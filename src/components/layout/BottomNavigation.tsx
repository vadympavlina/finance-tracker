import { NavLink } from 'react-router-dom'
import { MOBILE_NAV } from '../../layouts/navigation'
import { cn } from '../../utils/cn'

/** Solid bottom bar; the active tab expands into an ink pill with its label. */
export function BottomNavigation() {
  return (
    <nav aria-label="Основна навігація" className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface lg:hidden">
      <ul className="mx-auto flex max-w-xl items-center justify-between gap-1 px-3 py-2">
        {MOBILE_NAV.map(({ to, label, icon: Icon }) => (
          <li key={to} className="flex min-w-0 justify-center">
            <NavLink
              to={to}
              end={to === '/'}
              aria-label={label}
              className={({ isActive }) =>
                cn(
                  'press flex h-12 min-w-12 items-center justify-center gap-2 rounded-full text-sm font-semibold transition-[background-color,padding,color] duration-300',
                  isActive ? 'bg-ink px-4 text-on-ink' : 'px-3 text-subtle hover:text-text',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className="size-[22px] shrink-0" strokeWidth={isActive ? 2.2 : 1.9} aria-hidden />
                  {isActive && <span className="truncate">{label}</span>}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
