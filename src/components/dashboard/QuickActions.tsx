import { useNavigate } from 'react-router-dom'
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, HandCoins, type LucideIcon } from 'lucide-react'
import { Button as GlassButton } from 'glisse'

const ACTIONS: Array<{ to: string; label: string; icon: LucideIcon; primary?: boolean }> = [
  { to: '/add/expense', label: 'Витрата', icon: ArrowUpRight, primary: true },
  { to: '/add/income', label: 'Дохід', icon: ArrowDownLeft },
  { to: '/add/transfer', label: 'Переказ', icon: ArrowLeftRight },
  { to: '/debts/new', label: 'Борг', icon: HandCoins },
]

/** One-tap entry points right under the balance: Liquid Glass circles, the main one filled with the accent. */
export function QuickActions() {
  const navigate = useNavigate()
  return (
    <nav aria-label="Швидкі дії" className="grid grid-cols-4 gap-2">
      {ACTIONS.map(({ to, label, icon: Icon, primary }) => (
        <div key={to} className="flex flex-col items-center gap-2 py-1.5">
          <GlassButton
            variant={primary ? 'filled' : 'glass'}
            aria-label={primary ? 'Додати витрату' : `Додати: ${label.toLowerCase()}`}
            onClick={() => navigate(to)}
            className="ft-btn ft-icon ft-quick"
            icon={<Icon strokeWidth={2.1} aria-hidden />}
          />
          {/* The visible caption; the button carries the full accessible name. */}
          <span aria-hidden className="max-w-full text-center text-[min(0.8125rem,3.4vw)] leading-tight font-medium">
            {label}
          </span>
        </div>
      ))}
    </nav>
  )
}
