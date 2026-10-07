import { NavLink } from 'react-router-dom'
import { Plus, Settings, Wallet } from 'lucide-react'
import { DESKTOP_NAV } from '../../layouts/navigation'
import { cn } from '../../utils/cn'
import { Button } from '../ui/Button'
import { useFinance } from '../../hooks/useFinance'
import { initials } from '../../utils/format'

export function Sidebar({ onQuickAdd }: { onQuickAdd: () => void }) {
  const { data } = useFinance()
  const link = ({ isActive }: { isActive: boolean }) =>
    cn(
      'press flex h-11 items-center gap-3 rounded-2xl px-3.5 text-[15px] font-medium',
      isActive ? 'bg-primary-soft text-primary' : 'text-muted hover:bg-surface-2 hover:text-text',
    )
  return (
    <aside className="sticky top-0 hidden h-dvh w-[264px] shrink-0 flex-col border-r border-border bg-surface px-4 py-6 lg:flex">
      <div className="mb-8 flex items-center gap-2.5 px-2">
        <span className="grid size-10 place-items-center rounded-2xl bg-primary text-on-primary shadow-primary">
          <Wallet className="size-5" aria-hidden />
        </span>
        <div>
          <p className="text-[15px] leading-tight font-bold">Finance Tracker</p>
          <p className="text-xs text-muted">Особисті фінанси</p>
        </div>
      </div>
      <Button icon={<Plus className="size-5" aria-hidden />} onClick={onQuickAdd} block className="mb-6">
        Додати операцію
      </Button>
      <nav aria-label="Основна навігація" className="flex-1 overflow-y-auto">
        <ul className="space-y-1">
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
      <div className="mt-4 space-y-1 border-t border-border pt-4">
        <NavLink to="/settings" className={link}>
          <Settings className="size-5" aria-hidden />
          Налаштування
        </NavLink>
        <NavLink to="/profile" className="press flex items-center gap-3 rounded-2xl p-2 hover:bg-surface-2">
          <span className="grid size-9 place-items-center rounded-full bg-primary-soft text-sm font-bold text-primary">{initials(data.settings.fullName || data.settings.userName)}</span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold">{data.settings.fullName || data.settings.userName}</span>
            <span className="block text-xs text-muted">Фінансовий контроль</span>
          </span>
        </NavLink>
      </div>
    </aside>
  )
}
