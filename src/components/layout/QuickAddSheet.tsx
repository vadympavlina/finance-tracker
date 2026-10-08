import { useNavigate } from 'react-router-dom'
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, ChevronRight, HandCoins, type LucideIcon } from 'lucide-react'
import { Sheet } from '../ui/Sheet'

interface Option {
  to: string
  label: string
  hint: string
  icon: LucideIcon
  className: string
}

const OPTIONS: Option[] = [
  { to: '/add/expense', label: 'Додати витрату', hint: 'Покупки, кафе, транспорт…', icon: ArrowUpRight, className: 'bg-expense-soft text-expense' },
  { to: '/add/income', label: 'Додати дохід', hint: 'Зарплата, підробіток, подарунок', icon: ArrowDownLeft, className: 'bg-income-soft text-income' },
  { to: '/add/transfer', label: 'Переказ', hint: 'Між власними рахунками', icon: ArrowLeftRight, className: 'bg-info-soft text-info' },
  { to: '/debts/new', label: 'Додати борг', hint: 'Я винен або мені винні', icon: HandCoins, className: 'bg-primary-soft text-primary' },
]

export function QuickAddSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  return (
    <Sheet open={open} onClose={onClose} title="Швидке додавання" size="sm">
      <ul className="space-y-2 pt-1">
        {OPTIONS.map(({ to, label, hint, icon: Icon, className }) => (
          <li key={to}>
            <button
              type="button"
              onClick={() => {
                onClose()
                navigate(to)
              }}
              className="press flex w-full items-center gap-3.5 rounded-[22px] bg-surface shadow-card p-3 text-left hover:border-border-strong hover:bg-surface-2"
            >
              <span className={`grid size-12 shrink-0 place-items-center rounded-2xl ${className}`}>
                <Icon className="size-[22px]" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[0.9375rem] font-semibold">{label}</span>
                <span className="block min-w-0 break-words text-sm text-muted">{hint}</span>
              </span>
              <ChevronRight className="size-5 text-subtle" aria-hidden />
            </button>
          </li>
        ))}
      </ul>
    </Sheet>
  )
}
