import { Link } from 'react-router-dom'
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, HandCoins, type LucideIcon } from 'lucide-react'
import { cn } from '../../utils/cn'

const ACTIONS: Array<{ to: string; label: string; icon: LucideIcon; primary?: boolean }> = [
  { to: '/add/expense', label: 'Витрата', icon: ArrowUpRight, primary: true },
  { to: '/add/income', label: 'Дохід', icon: ArrowDownLeft },
  { to: '/add/transfer', label: 'Переказ', icon: ArrowLeftRight },
  { to: '/debts/new', label: 'Борг', icon: HandCoins },
]

/** One-tap entry points right under the balance: the main flow is "+ → сума → категорія → зберегти". */
export function QuickActions() {
  return (
    <nav aria-label="Швидкі дії" className="grid grid-cols-4 gap-2">
      {ACTIONS.map(({ to, label, icon: Icon, primary }) => (
        <Link
          key={to}
          to={to}
          aria-label={primary ? 'Додати витрату' : `Додати: ${label.toLowerCase()}`}
          className="press group flex flex-col items-center gap-2 rounded-3xl py-1.5"
        >
          <span
            className={cn(
              'grid size-14 place-items-center rounded-full transition-transform group-active:scale-95',
              primary ? 'glass-tinted text-white' : 'glass text-text',
            )}
          >
            <Icon className="size-[22px]" strokeWidth={2.1} aria-hidden />
          </span>
          <span className="text-[13px] font-medium">{label}</span>
        </Link>
      ))}
    </nav>
  )
}
