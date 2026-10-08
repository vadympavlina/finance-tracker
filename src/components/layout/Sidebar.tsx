import { NavLink } from 'react-router-dom'
import { Plus, Settings } from 'lucide-react'
import { DESKTOP_NAV } from '../../layouts/navigation'
import { cn } from '../../utils/cn'
import { Button } from '../ui/Button'
import { useFinance } from '../../hooks/useFinance'
import { initials } from '../../utils/format'

/** Floating Liquid Glass sidebar (iPadOS / macOS 26 style). */
export function Sidebar({ onQuickAdd }: { onQuickAdd: () => void }) {
  const { data } = useFinance()
  const link = ({ isActive }: { isActive: boolean }) =>
    cn(
      'press flex h-11 items-center gap-3 rounded-full px-4 text-[15px] font-medium transition-colors',
      isActive ? 'bg-black/[0.06] font-semibold text-primary dark:bg-white/[0.1]' : 'text-text hover:bg-black/[0.04] dark:hover:bg-white/[0.06]',
    )
  return (
    <aside className="sticky top-0 hidden h-dvh w-[288px] shrink-0 p-3 lg:block">
      <div className="glass flex h-full flex-col rounded-[30px] px-3 py-5">
        <div className="mb-6 flex items-center gap-3 px-2">
          <img src="./favicon.svg" alt="" width={40} height={40} className="size-10 rounded-[12px] shadow-card" />
          <div>
            <p className="text-[15px] leading-tight font-bold">Finance Tracker</p>
            <p className="text-xs text-muted">Особисті фінанси</p>
          </div>
        </div>
        <Button icon={<Plus className="size-5" aria-hidden />} onClick={onQuickAdd} block className="mb-5">
          Додати операцію
        </Button>
        <nav aria-label="Основна навігація" className="flex-1 overflow-y-auto">
          <ul className="space-y-0.5">
            {DESKTOP_NAV.map(({ to, label, icon: Icon }) => (
              <li key={to}>
                <NavLink to={to} end={to === '/'} className={link}>
                  <Icon className="size-5" aria-hidden />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-3 space-y-0.5 border-t border-border pt-3">
          <NavLink to="/settings" className={link}>
            <Settings className="size-5" aria-hidden />
            Налаштування
          </NavLink>
          <NavLink to="/profile" className="press flex items-center gap-3 rounded-full p-1.5 hover:bg-black/[0.04] dark:hover:bg-white/[0.06]">
            <span className="grid size-9 place-items-center rounded-full bg-ink text-[13px] font-bold text-on-ink">{initials(data.settings.fullName || data.settings.userName)}</span>
            <span className="min-w-0">
              <span className="block min-w-0 break-words text-sm font-semibold">{data.settings.fullName || data.settings.userName}</span>
              <span className="block text-xs text-muted">Фінансовий контроль</span>
            </span>
          </NavLink>
        </div>
      </div>
    </aside>
  )
}
