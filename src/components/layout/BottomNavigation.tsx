import { NavLink } from 'react-router-dom'
import { MOBILE_NAV } from '../../layouts/navigation'
import { cn } from '../../utils/cn'

export function BottomNavigation() {
  return (
    <nav
      aria-label="Основна навігація"
      className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/90 backdrop-blur-xl lg:hidden"
    >
      <ul className="mx-auto flex max-w-xl items-stretch justify-around px-1">
        {MOBILE_NAV.map(({ to, label, icon: Icon }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'press flex min-h-[60px] flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-medium',
                  isActive ? 'text-primary' : 'text-subtle hover:text-muted',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span className={cn('grid h-7 w-12 place-items-center rounded-full transition-colors', isActive && 'bg-primary-soft')}>
                    <Icon className="size-[21px]" strokeWidth={isActive ? 2.3 : 2} aria-hidden />
                  </span>
                  {label}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
